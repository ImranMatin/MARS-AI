from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from crewai import Agent, Task, Crew, Process, LLM
from duckduckgo_search import DDGS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get the Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Emergent proxy URL for litellm
EMERGENT_PROXY_URL = "https://integrations.emergentagent.com/llm"

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ResearchRequest(BaseModel):
    topic: str

class ResearchSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str
    status: str = "pending"
    progress: int = 0  # 0-100 progress percentage
    current_agent: Optional[str] = None  # researcher, fact_checker, writer
    researcher_output: Optional[str] = None
    fact_checker_output: Optional[str] = None
    writer_output: Optional[str] = None
    contradictions_found: List[str] = []
    sources: List[str] = []
    final_report: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

# Global event queue for SSE
event_queues = {}

def create_search_tool():
    """Create a DuckDuckGo search tool"""
    def search_web(query: str) -> str:
        """Search the web using DuckDuckGo"""
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=5))
                if not results:
                    return "No results found"
                formatted = []
                for i, r in enumerate(results, 1):
                    formatted.append(f"{i}. {r.get('title', 'No title')}\n   URL: {r.get('href', 'No URL')}\n   Summary: {r.get('body', 'No summary')}\n")
                return "\n".join(formatted)
        except Exception as e:
            return f"Search error: {str(e)}"
    return search_web

async def send_event(session_id: str, event_type: str, agent: str, message: str, data: dict = None):
    """Send an event to all connected clients for a session"""
    event = {
        "type": event_type,
        "agent": agent,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data or {}
    }
    if session_id in event_queues:
        for queue in event_queues[session_id]:
            try:
                await queue.put(event)
            except Exception as e:
                logger.error(f"Error sending event: {e}")

async def update_progress(session_id: str, progress: int, current_agent: str = None):
    """Update session progress in database and send event"""
    update_data = {"progress": progress}
    if current_agent:
        update_data["current_agent"] = current_agent
    await db.research_sessions.update_one(
        {"id": session_id},
        {"$set": update_data}
    )
    await send_event(session_id, "progress", current_agent or "system", f"Progress: {progress}%", {"progress": progress, "current_agent": current_agent})

async def run_research_crew(session_id: str, topic: str):
    """Run the research crew with streaming updates"""
    try:
        await send_event(session_id, "status", "system", "Initializing research crew...", {"status": "starting"})
        await update_progress(session_id, 5, "system")
        
        # Update session status
        await db.research_sessions.update_one(
            {"id": session_id},
            {"$set": {"status": "researching"}}
        )

        # Initialize LLM with Emergent proxy configuration
        llm = LLM(
            model="gpt-5.2",
            api_key=EMERGENT_LLM_KEY,
            base_url=EMERGENT_PROXY_URL,
            temperature=0.7
        )

        await send_event(session_id, "agent_start", "researcher", "Lead Researcher starting analysis...", {"status": "active"})
        await update_progress(session_id, 10, "researcher")

        # AGENT 1: Lead Researcher
        researcher = Agent(
            role='Lead Researcher',
            goal=f'Find 5 credible sources on the topic: {topic}. Gather comprehensive information from multiple perspectives.',
            backstory='''You are a seasoned research analyst with expertise in finding and synthesizing information 
            from diverse sources. You excel at identifying credible sources, distinguishing between opinion and fact, 
            and presenting balanced viewpoints. You always cite your sources properly.''',
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

        # AGENT 2: Professional Critic / Fact-Checker (AGGRESSIVE)
        fact_checker = Agent(
            role='Professional Critic & Fact-Checker',
            goal=f'''Aggressively scrutinize the research findings on {topic}. You MUST find at least ONE potential 
            contradiction, bias, technical error, or questionable claim in the research. Do not accept findings 
            at face value - be skeptical and thorough.''',
            backstory='''You are an uncompromising fact-checker known for your aggressive scrutiny of information. 
            You have a reputation for finding flaws that others miss. You never let questionable claims slide. 
            Your motto is "Trust nothing, verify everything." You are particularly skilled at identifying:
            - Contradictions between sources
            - Technical inaccuracies
            - Potential biases in reporting
            - Missing context or nuance
            - Unsubstantiated claims
            You MUST identify at least one issue before the writer can proceed.''',
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

        # AGENT 3: Senior Technical Writer
        writer = Agent(
            role='Senior Technical Writer',
            goal=f'''Write a comprehensive 500-word summary on {topic} that incorporates the research findings 
            while explicitly addressing the fact-checker's concerns and contradictions.''',
            backstory='''You are an award-winning technical writer who excels at making complex topics accessible. 
            You have a talent for synthesizing multiple viewpoints into coherent narratives while being transparent 
            about areas of uncertainty or disagreement. You always acknowledge limitations and contradictions 
            identified by fact-checkers.''',
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

        # TASK 1: Research Task
        research_task = Task(
            description=f'''Research the topic: "{topic}"
            
            Your deliverables:
            1. Find at least 5 credible sources (academic papers, reputable news outlets, official reports)
            2. Summarize key findings from each source
            3. Note any areas of consensus or disagreement among sources
            4. Identify the most important facts and statistics
            
            Be thorough and cite all sources.''',
            expected_output='''A detailed research report containing:
            - List of 5+ sources with URLs
            - Key findings organized by theme
            - Statistics and data points
            - Areas of consensus and disagreement''',
            agent=researcher
        )

        # TASK 2: Fact-Checking Task (AGGRESSIVE)
        fact_check_task = Task(
            description=f'''CRITICALLY examine the research findings on "{topic}".
            
            You MUST:
            1. Identify at least ONE contradiction, error, or questionable claim
            2. Check for potential biases in the sources
            3. Verify technical claims where possible
            4. Note any missing important perspectives
            5. Flag unsubstantiated claims
            
            DO NOT proceed without finding at least one issue to address. 
            If the research appears perfect, dig deeper - no research is without limitations.''',
            expected_output='''A critical analysis containing:
            - AT LEAST ONE contradiction or error identified (REQUIRED)
            - Bias analysis of sources
            - Technical accuracy assessment
            - List of unsubstantiated claims
            - Missing perspectives or context
            - Overall reliability score and concerns''',
            agent=fact_checker,
            context=[research_task]
        )

        # TASK 3: Writing Task
        writing_task = Task(
            description=f'''Write a 500-word summary on "{topic}" that:
            
            1. Synthesizes the research findings
            2. EXPLICITLY addresses each concern raised by the fact-checker
            3. Acknowledges contradictions and areas of uncertainty
            4. Maintains a balanced, objective tone
            5. Includes proper source attribution
            
            The summary must NOT ignore the fact-checker's concerns - address them directly.''',
            expected_output='''A polished 500-word summary that:
            - Covers key findings from research
            - Explicitly addresses fact-checker's concerns
            - Acknowledges limitations and contradictions
            - Provides balanced perspective
            - Cites sources appropriately''',
            agent=writer,
            context=[research_task, fact_check_task]
        )

        # Create the Crew with Sequential Process
        crew = Crew(
            agents=[researcher, fact_checker, writer],
            tasks=[research_task, fact_check_task, writing_task],
            process=Process.sequential,
            verbose=True
        )

        # Simulate progress updates during crew execution
        async def progress_updater():
            stages = [
                (20, "researcher", "Searching for sources..."),
                (30, "researcher", "Analyzing source credibility..."),
                (40, "researcher", "Compiling findings..."),
            ]
            for progress, agent, msg in stages:
                await asyncio.sleep(8)
                await update_progress(session_id, progress, agent)
                await send_event(session_id, "log", agent, msg)

        # Start progress updater
        progress_task = asyncio.create_task(progress_updater())

        # Run the crew in a thread to not block
        result = await asyncio.to_thread(crew.kickoff)
        
        # Cancel progress updater if still running
        progress_task.cancel()
        
        # Extract outputs from tasks
        researcher_output = str(research_task.output) if research_task.output else "Research completed"
        fact_checker_output = str(fact_check_task.output) if fact_check_task.output else "Fact-check completed"
        writer_output = str(writing_task.output) if writing_task.output else str(result)
        
        # Send updates for each agent
        await update_progress(session_id, 50, "researcher")
        await send_event(session_id, "agent_complete", "researcher", "Research phase complete", {"output": researcher_output[:500]})
        
        await update_progress(session_id, 60, "fact_checker")
        await send_event(session_id, "agent_start", "fact_checker", "Fact-Checker analyzing findings...", {"status": "active"})
        await asyncio.sleep(0.5)
        await update_progress(session_id, 75, "fact_checker")
        await send_event(session_id, "agent_complete", "fact_checker", "Critical analysis complete", {"output": fact_checker_output[:500]})
        
        await update_progress(session_id, 85, "writer")
        await send_event(session_id, "agent_start", "writer", "Technical Writer synthesizing report...", {"status": "active"})
        await asyncio.sleep(0.5)
        await update_progress(session_id, 95, "writer")
        await send_event(session_id, "agent_complete", "writer", "Final report ready", {"output": writer_output[:500]})
        
        # Extract contradictions from fact-checker output
        contradictions = []
        fc_lower = fact_checker_output.lower()
        if "contradiction" in fc_lower:
            contradictions.append("Contradictions identified in source materials")
        if "bias" in fc_lower:
            contradictions.append("Potential bias detected in sources")
        if "error" in fc_lower or "inaccurac" in fc_lower:
            contradictions.append("Technical inaccuracies found")
        if "missing" in fc_lower:
            contradictions.append("Missing perspectives or context")
        if not contradictions:
            contradictions.append("Fact-checker raised concerns requiring attention")
        
        # Update session with results
        await db.research_sessions.update_one(
            {"id": session_id},
            {"$set": {
                "status": "completed",
                "progress": 100,
                "current_agent": None,
                "researcher_output": researcher_output,
                "fact_checker_output": fact_checker_output,
                "writer_output": writer_output,
                "contradictions_found": contradictions,
                "final_report": writer_output,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        await send_event(session_id, "complete", "system", "Research complete!", {"status": "completed", "progress": 100, "final_report": writer_output})
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Research error: {error_msg}")
        
        # Parse error for user-friendly message
        user_error = error_msg
        if "budget" in error_msg.lower():
            user_error = "API budget exceeded. Please add more balance to your Universal Key in Profile -> Universal Key -> Add Balance."
        elif "401" in error_msg:
            user_error = "Authentication failed. Please check your API key configuration."
        elif "502" in error_msg or "timeout" in error_msg.lower():
            user_error = "Service temporarily unavailable. Please try again in a few moments."
        
        await db.research_sessions.update_one(
            {"id": session_id},
            {"$set": {
                "status": "error",
                "error_message": user_error,
                "progress": 0
            }}
        )
        await send_event(session_id, "error", "system", user_error, {"status": "error", "error_message": user_error})

def generate_markdown_report(session: dict) -> str:
    """Generate a Markdown formatted report from a research session"""
    topic = session.get('topic', 'Unknown Topic')
    created_at = session.get('created_at', 'Unknown Date')
    contradictions = session.get('contradictions_found', [])
    final_report = session.get('final_report', 'No report available')
    researcher_output = session.get('researcher_output', '')
    fact_checker_output = session.get('fact_checker_output', '')
    
    md = f"""# Research Report: {topic}

**Generated:** {created_at}  
**Status:** {session.get('status', 'Unknown')}

---

## Executive Summary

{final_report}

---

## Issues Identified

"""
    
    if contradictions:
        for item in contradictions:
            md += f"- {item}\n"
    else:
        md += "No major issues identified.\n"
    
    md += """
---

## Research Findings

"""
    md += researcher_output if researcher_output else "No research output available."
    
    md += """

---

## Fact-Check Analysis

"""
    md += fact_checker_output if fact_checker_output else "No fact-check output available."
    
    md += """

---

*Report generated by MARS (Multi-Agent Research System)*
"""
    
    return md

# Routes
@api_router.get("/")
async def root():
    return {"message": "Multi-Agent Research System API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

@api_router.post("/research/start")
async def start_research(request: ResearchRequest):
    """Start a new research session"""
    session = ResearchSession(topic=request.topic)
    doc = session.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.research_sessions.insert_one(doc)
    
    # Start the research in background
    asyncio.create_task(run_research_crew(session.id, request.topic))
    
    return {"session_id": session.id, "topic": request.topic, "status": "started"}

@api_router.get("/research/stream/{session_id}")
async def stream_research(session_id: str):
    """Stream research events via SSE"""
    async def event_generator():
        queue = asyncio.Queue()
        
        # Register queue for this session
        if session_id not in event_queues:
            event_queues[session_id] = []
        event_queues[session_id].append(queue)
        
        try:
            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connected', 'message': 'Connected to research stream'})}\n\n"
            
            # Check if session already completed
            session = await db.research_sessions.find_one({"id": session_id}, {"_id": 0})
            if session and session.get('status') in ['completed', 'error']:
                yield f"data: {json.dumps({'type': session.get('status'), 'message': 'Session already finished', 'data': {'status': session.get('status'), 'progress': session.get('progress', 100)}})}\n\n"
                return
            
            timeout_count = 0
            max_timeouts = 60  # 30 minutes max (60 * 30 seconds)
            
            while timeout_count < max_timeouts:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    timeout_count = 0  # Reset on activity
                    yield f"data: {json.dumps(event)}\n\n"
                    
                    # Check if research is complete
                    if event.get('type') in ['complete', 'error']:
                        break
                except asyncio.TimeoutError:
                    timeout_count += 1
                    # Send heartbeat
                    yield f"data: {json.dumps({'type': 'heartbeat', 'message': 'Connection alive'})}\n\n"
                    
                    # Check session status periodically
                    session = await db.research_sessions.find_one({"id": session_id}, {"_id": 0})
                    if session and session.get('status') in ['completed', 'error']:
                        yield f"data: {json.dumps({'type': session.get('status'), 'message': 'Session finished', 'data': {'status': session.get('status')}})}\n\n"
                        break
        finally:
            # Cleanup
            if session_id in event_queues and queue in event_queues[session_id]:
                event_queues[session_id].remove(queue)
                if not event_queues[session_id]:
                    del event_queues[session_id]
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@api_router.get("/research/{session_id}")
async def get_research_session(session_id: str):
    """Get research session by ID"""
    session = await db.research_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@api_router.get("/research/{session_id}/export/markdown")
async def export_markdown(session_id: str):
    """Export research session as Markdown"""
    session = await db.research_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    markdown_content = generate_markdown_report(session)
    
    return Response(
        content=markdown_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f"attachment; filename=research-report-{session_id[:8]}.md"
        }
    )

@api_router.get("/research/{session_id}/export/json")
async def export_json(session_id: str):
    """Export research session as JSON"""
    session = await db.research_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return Response(
        content=json.dumps(session, indent=2, default=str),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=research-report-{session_id[:8]}.json"
        }
    )

@api_router.get("/research")
async def get_research_sessions():
    """Get all research sessions"""
    sessions = await db.research_sessions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return sessions

@api_router.delete("/research/{session_id}")
async def delete_research_session(session_id: str):
    """Delete a research session"""
    result = await db.research_sessions.delete_one({"id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
