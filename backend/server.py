from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
import json
import asyncio
import httpx
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from io import BytesIO
from crewai import Agent, Task, Crew, Process, LLM
from duckduckgo_search import DDGS
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

from auth import create_auth_router, seed_admin_and_indexes

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Auth router setup
def get_frontend_url():
    return os.environ.get("FRONTEND_URL", "http://localhost:3000")

auth_router, get_current_user = create_auth_router(db, get_frontend_url)
app.include_router(auth_router)

@app.on_event("startup")
async def on_startup():
    await seed_admin_and_indexes(db)

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

# Credibility scoring - trusted domains and TLDs
HIGH_CREDIBILITY_DOMAINS = {
    'nature.com', 'science.org', 'nih.gov', 'nasa.gov', 'noaa.gov', 'ieee.org',
    'acm.org', 'arxiv.org', 'plos.org', 'sciencedirect.com', 'springer.com',
    'wiley.com', 'jstor.org', 'pubmed.ncbi.nlm.nih.gov', 'who.int', 'un.org',
    'europa.eu', 'gov.uk', 'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk',
    'economist.com', 'ft.com', 'nytimes.com', 'wsj.com', 'washingtonpost.com',
    'harvard.edu', 'mit.edu', 'stanford.edu', 'ox.ac.uk', 'cam.ac.uk',
    'nationalgeographic.com', 'smithsonianmag.com', 'scientificamerican.com'
}

MEDIUM_CREDIBILITY_TLDS = {'.edu', '.gov', '.org'}
LOW_CREDIBILITY_INDICATORS = {'blog', 'wordpress', 'medium.com', 'substack.com'}

# Research Templates
RESEARCH_TEMPLATES = [
    {
        "id": "market-analysis",
        "name": "Market Analysis",
        "icon": "trending-up",
        "description": "Comprehensive market landscape and competitor analysis",
        "prompt": "Market analysis of [INDUSTRY]: current market size, growth projections, key players, competitive landscape, and future opportunities"
    },
    {
        "id": "tech-deep-dive",
        "name": "Technical Deep Dive",
        "icon": "cpu",
        "description": "In-depth technical analysis of emerging technologies",
        "prompt": "Technical deep-dive analysis of [TECHNOLOGY]: architecture, implementation details, real-world applications, limitations, and future potential"
    },
    {
        "id": "scientific-review",
        "name": "Scientific Review",
        "icon": "flask",
        "description": "Academic literature review on scientific topics",
        "prompt": "Scientific literature review on [TOPIC]: current research, key findings, methodologies, controversies, and areas for future study"
    },
    {
        "id": "policy-analysis",
        "name": "Policy Analysis",
        "icon": "scale",
        "description": "Government policy impact and implementation review",
        "prompt": "Policy analysis of [POLICY/REGULATION]: objectives, implementation, stakeholder impacts, effectiveness, and unintended consequences"
    },
    {
        "id": "trend-forecast",
        "name": "Trend Forecast",
        "icon": "chart",
        "description": "Emerging trends and future predictions",
        "prompt": "Trend forecast for [TOPIC]: current developments, key drivers, expert predictions for the next 5 years, and potential disruptions"
    },
    {
        "id": "competitive-intel",
        "name": "Competitive Intelligence",
        "icon": "target",
        "description": "Company or product competitive positioning",
        "prompt": "Competitive intelligence on [COMPANY/PRODUCT]: market position, strengths, weaknesses, strategic moves, and competitor comparison"
    }
]

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class AgentConfig(BaseModel):
    """Custom agent configuration"""
    role: Optional[str] = None
    goal: Optional[str] = None
    backstory: Optional[str] = None
    expertise: Optional[str] = None  # e.g., "AI/ML", "Finance", "Healthcare"

class ResearchRequest(BaseModel):
    topic: str
    fast_mode: bool = True  # Fast mode by default
    researcher_config: Optional[AgentConfig] = None
    fact_checker_config: Optional[AgentConfig] = None
    writer_config: Optional[AgentConfig] = None

class ResearchSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str
    status: str = "pending"
    progress: int = 0
    current_agent: Optional[str] = None
    researcher_output: Optional[str] = None
    fact_checker_output: Optional[str] = None
    writer_output: Optional[str] = None
    contradictions_found: List[str] = []
    sources: List[dict] = []  # Now includes credibility scoring
    credibility_score: Optional[float] = None  # Overall credibility (0-100)
    final_report: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

# Global event queue for SSE
event_queues = {}

def score_source_credibility(url: str, title: str = "") -> dict:
    """Score the credibility of a single source"""
    if not url:
        return {"score": 30, "level": "unknown", "reasons": ["No URL provided"]}
    
    score = 50  # Base score
    reasons = []
    
    url_lower = url.lower()
    
    # Check trusted domains
    for domain in HIGH_CREDIBILITY_DOMAINS:
        if domain in url_lower:
            score = 90
            reasons.append(f"Trusted source: {domain}")
            break
    
    # Check TLD credibility
    if score < 90:
        for tld in MEDIUM_CREDIBILITY_TLDS:
            if url_lower.endswith(tld) or f'{tld}/' in url_lower:
                score = max(score, 75)
                reasons.append(f"Reputable TLD: {tld}")
                break
    
    # Check for low credibility indicators
    for indicator in LOW_CREDIBILITY_INDICATORS:
        if indicator in url_lower:
            score = min(score, 40)
            reasons.append(f"Blog/personal source: {indicator}")
            break
    
    # HTTPS bonus
    if url_lower.startswith('https://'):
        score = min(100, score + 5)
    else:
        score = max(0, score - 10)
        reasons.append("Non-HTTPS source")
    
    # Determine level
    if score >= 80:
        level = "high"
    elif score >= 60:
        level = "medium"
    elif score >= 40:
        level = "low"
    else:
        level = "very-low"
    
    if not reasons:
        reasons.append("Standard web source")
    
    return {"score": score, "level": level, "reasons": reasons}

def extract_and_score_sources(text: str) -> List[dict]:
    """Extract URLs from text and score their credibility.
    Handles markdown links [text](url), plain URLs, and cleans trailing punctuation."""
    if not text:
        return []
    
    all_urls = []
    
    # First: extract markdown-style links [text](url)
    md_link_pattern = r'\[([^\]]+)\]\((https?://[^\)]+)\)'
    md_matches = re.findall(md_link_pattern, text)
    for title, url in md_matches:
        all_urls.append((url, title))
    
    # Remove markdown links from text to avoid double-counting
    text_no_md = re.sub(md_link_pattern, '', text)
    
    # Then: extract plain URLs (not inside markdown syntax)
    plain_url_pattern = r'https?://[^\s\)\]\}\>\"\'\<,]+'
    plain_urls = re.findall(plain_url_pattern, text_no_md)
    for url in plain_urls:
        all_urls.append((url, ""))
    
    # Deduplicate by URL, keeping title
    seen = {}
    for url, title in all_urls:
        # Clean trailing punctuation
        clean_url = url.rstrip('.,;:!?)\'"')
        # Skip if URL is too short or invalid
        if len(clean_url) < 10 or '.' not in clean_url:
            continue
        if clean_url not in seen:
            seen[clean_url] = title
    
    # Limit to top 10
    unique_urls = list(seen.items())[:10]
    
    sources = []
    for url, title in unique_urls:
        credibility = score_source_credibility(url)
        sources.append({
            "url": url,
            "title": title if title else None,
            "credibility_score": credibility["score"],
            "credibility_level": credibility["level"],
            "reasons": credibility["reasons"],
            "verified": None,  # Will be set by verify_sources
            "verified_url": None,  # Final URL after redirects
            "status_code": None
        })
    
    return sources

async def verify_url(url: str, client: httpx.AsyncClient) -> dict:
    """Verify a URL is accessible and follow redirects"""
    try:
        # Try HEAD first (faster), fallback to GET if not allowed
        response = await client.head(url, follow_redirects=True, timeout=8.0)
        if response.status_code == 405 or response.status_code >= 500:
            # Some servers don't allow HEAD, try GET
            response = await client.get(url, follow_redirects=True, timeout=8.0)
        
        final_url = str(response.url)
        status = response.status_code
        
        return {
            "verified": 200 <= status < 400,
            "verified_url": final_url,
            "status_code": status
        }
    except httpx.TimeoutException:
        return {"verified": False, "verified_url": None, "status_code": 0, "error": "timeout"}
    except Exception as e:
        return {"verified": False, "verified_url": None, "status_code": 0, "error": str(e)[:100]}

async def verify_sources(sources: List[dict]) -> List[dict]:
    """Verify all sources in parallel"""
    if not sources:
        return sources
    
    async with httpx.AsyncClient(
        headers={'User-Agent': 'Mozilla/5.0 (compatible; MARS-Research-Bot/1.0)'},
        follow_redirects=True
    ) as client:
        tasks = [verify_url(src['url'], client) for src in sources]
        results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for src, result in zip(sources, results):
        if isinstance(result, Exception):
            src['verified'] = False
            src['status_code'] = 0
        else:
            src['verified'] = result.get('verified', False)
            src['verified_url'] = result.get('verified_url')
            src['status_code'] = result.get('status_code', 0)
            # If we got a redirect to a different URL, use it
            if src['verified_url'] and src['verified_url'] != src['url']:
                # Re-score based on final URL
                new_credibility = score_source_credibility(src['verified_url'])
                if new_credibility['score'] != src['credibility_score']:
                    src['credibility_score'] = new_credibility['score']
                    src['credibility_level'] = new_credibility['level']
                    src['reasons'] = new_credibility['reasons'] + [f"Redirected from original URL"]
    
    return sources

def calculate_overall_credibility(sources: List[dict]) -> float:
    """Calculate weighted average credibility score"""
    if not sources:
        return 0.0
    
    scores = [s["credibility_score"] for s in sources]
    return round(sum(scores) / len(scores), 1)

def create_search_tool(fast_mode: bool = True):
    """Create a DuckDuckGo search tool"""
    max_results = 3 if fast_mode else 5  # Fewer results in fast mode
    
    def search_web(query: str) -> str:
        """Search the web using DuckDuckGo"""
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))
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

async def run_research_crew(session_id: str, topic: str, fast_mode: bool = True, 
                            researcher_config: dict = None, fact_checker_config: dict = None, 
                            writer_config: dict = None):
    """Run the research crew with streaming updates - OPTIMIZED for speed"""
    try:
        await send_event(session_id, "status", "system", "Initializing research crew...", {"status": "starting"})
        await update_progress(session_id, 5, "system")
        
        # Update session status
        await db.research_sessions.update_one(
            {"id": session_id},
            {"$set": {"status": "researching"}}
        )

        # SPEED OPTIMIZATION: Use gpt-4o-mini for faster responses in fast mode
        model_name = "gpt-4o-mini" if fast_mode else "gpt-5.2"
        
        llm = LLM(
            model=model_name,
            api_key=EMERGENT_LLM_KEY,
            base_url=EMERGENT_PROXY_URL,
            temperature=0.5 if fast_mode else 0.7,
            max_tokens=1500 if fast_mode else 2500
        )

        await send_event(session_id, "agent_start", "researcher", "Lead Researcher starting analysis...", {"status": "active"})
        await update_progress(session_id, 10, "researcher")

        # Helper to build agent with custom config
        def _agent_field(config, key, default):
            if config and config.get(key):
                return config[key]
            return default
        
        # Apply expertise context if provided
        expertise_r = researcher_config.get('expertise') if researcher_config else None
        expertise_fc = fact_checker_config.get('expertise') if fact_checker_config else None
        expertise_w = writer_config.get('expertise') if writer_config else None
        
        expertise_suffix_r = f' Focus your research using expertise in {expertise_r}.' if expertise_r else ''
        expertise_suffix_fc = f' Apply {expertise_fc} domain expertise in your critique.' if expertise_fc else ''
        expertise_suffix_w = f' Write from a {expertise_w} subject-matter perspective.' if expertise_w else ''

        # AGENT 1: Lead Researcher
        researcher = Agent(
            role=_agent_field(researcher_config, 'role', 'Lead Researcher'),
            goal=_agent_field(researcher_config, 'goal', 
                f'Find {3 if fast_mode else 5} credible sources on: {topic}. Be concise and focused.{expertise_suffix_r}'),
            backstory=_agent_field(researcher_config, 'backstory',
                f'''You are a fast, efficient research analyst. You quickly identify credible sources 
                and extract key findings without unnecessary elaboration. You always cite URLs.{expertise_suffix_r}'''),
            verbose=False,
            allow_delegation=False,
            llm=llm,
            max_iter=2
        )

        # AGENT 2: Professional Critic
        fact_checker = Agent(
            role=_agent_field(fact_checker_config, 'role', 'Professional Critic & Fact-Checker'),
            goal=_agent_field(fact_checker_config, 'goal',
                f'''Quickly identify at least ONE contradiction, bias, or error in research on {topic}.
                Be direct and concise.{expertise_suffix_fc}'''),
            backstory=_agent_field(fact_checker_config, 'backstory',
                f'''You are an aggressive fact-checker. You quickly spot flaws, biases, and 
                contradictions. Your motto: "Trust nothing, verify everything." You MUST find at least 
                one issue before the writer proceeds.{expertise_suffix_fc}'''),
            verbose=False,
            allow_delegation=False,
            llm=llm,
            max_iter=2
        )

        # AGENT 3: Senior Technical Writer
        writer = Agent(
            role=_agent_field(writer_config, 'role', 'Senior Technical Writer'),
            goal=_agent_field(writer_config, 'goal',
                f'''Write a {"300" if fast_mode else "500"}-word summary on {topic} that addresses 
                the fact-checker's concerns.{expertise_suffix_w}'''),
            backstory=_agent_field(writer_config, 'backstory',
                f'''You are an efficient technical writer. You synthesize research quickly 
                while acknowledging limitations and contradictions raised by fact-checkers.{expertise_suffix_w}'''),
            verbose=False,
            allow_delegation=False,
            llm=llm,
            max_iter=2
        )

        # TASK 1: Research Task - FOCUSED
        research_task = Task(
            description=f'''Research: "{topic}"
            
            Requirements:
            1. Identify {3 if fast_mode else 5} credible sources with URLs
            2. Extract key findings (bullet points, be concise)
            3. Note main points of consensus and disagreement
            
            Be efficient. Focus on quality over quantity.''',
            expected_output=f'''Concise research report with:
            - {3 if fast_mode else 5} sources (title + URL)
            - Key findings (bullets)
            - Consensus/disagreement notes''',
            agent=researcher
        )

        # TASK 2: Fact-Checking Task - QUICK BUT AGGRESSIVE
        fact_check_task = Task(
            description=f'''Critically review research on "{topic}".
            
            REQUIRED:
            1. Find AT LEAST ONE contradiction, error, or bias
            2. Note any unsubstantiated claims
            3. Be direct and concise
            
            You MUST find at least one issue - dig deeper if needed.''',
            expected_output='''Critical analysis with:
            - AT LEAST ONE identified issue (required)
            - Brief bias/accuracy notes
            - Reliability assessment''',
            agent=fact_checker,
            context=[research_task]
        )

        # TASK 3: Writing Task - CONCISE
        writing_task = Task(
            description=f'''Write a {"300" if fast_mode else "500"}-word summary on "{topic}":
            
            1. Synthesize research findings concisely
            2. Address fact-checker's concerns directly
            3. Acknowledge contradictions
            4. Cite sources
            
            Be balanced and objective.''',
            expected_output=f'''{"300" if fast_mode else "500"}-word summary addressing:
            - Key findings
            - Fact-checker's concerns
            - Limitations and contradictions
            - Source citations''',
            agent=writer,
            context=[research_task, fact_check_task]
        )

        # Create the Crew with Sequential Process
        crew = Crew(
            agents=[researcher, fact_checker, writer],
            tasks=[research_task, fact_check_task, writing_task],
            process=Process.sequential,
            verbose=False  # Reduced verbosity for speed
        )

        # Faster progress updates (real research feedback)
        async def progress_updater():
            stages = [
                (15, "researcher", "Searching for sources..."),
                (25, "researcher", "Evaluating credibility..."),
                (35, "researcher", "Extracting key findings..."),
                (45, "researcher", "Compiling research report..."),
            ]
            for progress, agent, msg in stages:
                await asyncio.sleep(5)  # Faster updates
                await update_progress(session_id, progress, agent)
                await send_event(session_id, "log", agent, msg)

        progress_task = asyncio.create_task(progress_updater())

        # Run the crew in a thread
        result = await asyncio.to_thread(crew.kickoff)
        
        progress_task.cancel()
        
        # Extract outputs from tasks
        researcher_output = str(research_task.output) if research_task.output else "Research completed"
        fact_checker_output = str(fact_check_task.output) if fact_check_task.output else "Fact-check completed"
        writer_output = str(writing_task.output) if writing_task.output else str(result)
        
        # Extract and score sources - also search research findings from writer
        sources = extract_and_score_sources(researcher_output + "\n" + writer_output)
        
        # Real-time source verification (checks URLs are accessible, follows redirects)
        await send_event(session_id, "log", "researcher", f"Verifying {len(sources)} source URLs...")
        sources = await verify_sources(sources)
        verified_count = sum(1 for s in sources if s.get('verified'))
        await send_event(session_id, "log", "researcher", f"Verified {verified_count}/{len(sources)} sources are accessible")
        
        # Recalculate credibility after verification
        credibility_score = calculate_overall_credibility(sources)
        
        # Send updates for each agent
        await update_progress(session_id, 55, "researcher")
        await send_event(session_id, "agent_complete", "researcher", "Research phase complete", {
            "output": researcher_output[:500],
            "sources_count": len(sources),
            "credibility_score": credibility_score
        })
        
        await update_progress(session_id, 65, "fact_checker")
        await send_event(session_id, "agent_start", "fact_checker", "Fact-Checker analyzing findings...", {"status": "active"})
        await asyncio.sleep(0.3)
        await update_progress(session_id, 80, "fact_checker")
        await send_event(session_id, "agent_complete", "fact_checker", "Critical analysis complete", {"output": fact_checker_output[:500]})
        
        await update_progress(session_id, 88, "writer")
        await send_event(session_id, "agent_start", "writer", "Technical Writer synthesizing report...", {"status": "active"})
        await asyncio.sleep(0.3)
        await update_progress(session_id, 96, "writer")
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
        if "unsubstantiated" in fc_lower or "unverified" in fc_lower:
            contradictions.append("Unsubstantiated claims present")
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
                "sources": sources,
                "credibility_score": credibility_score,
                "final_report": writer_output,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        await send_event(session_id, "complete", "system", "Research complete!", {
            "status": "completed", 
            "progress": 100, 
            "final_report": writer_output,
            "sources": sources,
            "credibility_score": credibility_score
        })
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Research error: {error_msg}")
        
        user_error = error_msg
        if "budget" in error_msg.lower():
            user_error = "API budget exceeded. Please add more balance to your Universal Key."
        elif "401" in error_msg:
            user_error = "Authentication failed. Please check your API key configuration."
        elif "502" in error_msg or "timeout" in error_msg.lower():
            user_error = "Service temporarily unavailable. Please try again in a few moments."
        elif "rate" in error_msg.lower() and "limit" in error_msg.lower():
            user_error = "Rate limit reached. Please wait a moment before trying again."
        
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
    """Generate a Markdown formatted report"""
    topic = session.get('topic', 'Unknown Topic')
    created_at = session.get('created_at', 'Unknown Date')
    contradictions = session.get('contradictions_found', [])
    final_report = session.get('final_report', 'No report available')
    researcher_output = session.get('researcher_output', '')
    fact_checker_output = session.get('fact_checker_output', '')
    sources = session.get('sources', [])
    credibility_score = session.get('credibility_score', 0)
    
    md = f"""# Research Report: {topic}

**Generated:** {created_at}  
**Status:** {session.get('status', 'Unknown')}  
**Overall Source Credibility:** {credibility_score}/100

---

## Executive Summary

{final_report}

---

## Source Credibility Analysis

"""
    if sources:
        for src in sources:
            level_emoji = {"high": "[HIGH]", "medium": "[MED]", "low": "[LOW]", "very-low": "[POOR]"}.get(src.get('credibility_level'), '[UNK]')
            md += f"- {level_emoji} **{src.get('credibility_score')}/100** - {src.get('url')}\n"
            for reason in src.get('reasons', []):
                md += f"  - {reason}\n"
    else:
        md += "No sources with URLs found.\n"
    
    md += """
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

def _sanitize_for_pdf(text: str) -> str:
    """Sanitize text for reportlab PDF generation"""
    if not text:
        return ""
    # Escape XML special chars first
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    # Convert markdown bold **text** to <b>text</b> after escaping
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # Convert markdown italic *text* to <i>text</i> (avoid conflicts with **)
    text = re.sub(r'(?<!\*)\*([^\*\n]+?)\*(?!\*)', r'<i>\1</i>', text)
    # Remove markdown link syntax [text](url), keep only text
    text = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'\1 (\2)', text)
    # Handle newlines
    text = text.replace('\n', '<br/>')
    return text

def generate_pdf_report(session: dict) -> bytes:
    """Generate a PDF formatted report"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    # Custom styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=HexColor('#22c55e'),
        spaceAfter=12,
        alignment=TA_LEFT
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=HexColor('#0ea5e9'),
        spaceAfter=8,
        spaceBefore=16
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=10,
        leading=14,
        alignment=TA_JUSTIFY,
        spaceAfter=8
    )
    
    metadata_style = ParagraphStyle(
        'Metadata',
        parent=styles['BodyText'],
        fontSize=9,
        textColor=HexColor('#71717a'),
        spaceAfter=4
    )
    
    story = []
    
    # Title
    topic = session.get('topic', 'Unknown Topic')
    story.append(Paragraph("Research Report", title_style))
    story.append(Paragraph(_sanitize_for_pdf(topic), heading_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Metadata
    story.append(Paragraph(f"<b>Generated:</b> {session.get('created_at', 'Unknown')}", metadata_style))
    story.append(Paragraph(f"<b>Status:</b> {session.get('status', 'Unknown').capitalize()}", metadata_style))
    credibility_score = session.get('credibility_score', 0) or 0
    credibility_color = '#22c55e' if credibility_score >= 70 else '#eab308' if credibility_score >= 50 else '#ef4444'
    story.append(Paragraph(
        f"<b>Overall Source Credibility:</b> <font color='{credibility_color}'>{credibility_score}/100</font>",
        metadata_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    # Executive Summary
    story.append(Paragraph("Executive Summary", heading_style))
    final_report = session.get('final_report', 'No report available')
    for para in final_report.split('\n\n'):
        if para.strip():
            try:
                story.append(Paragraph(_sanitize_for_pdf(para), body_style))
            except Exception as e:
                # Fallback: use fully escaped plain text
                safe_text = para.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>')
                story.append(Paragraph(safe_text, body_style))
    
    story.append(Spacer(1, 0.2*inch))
    
    # Source Credibility Analysis
    sources = session.get('sources', [])
    if sources:
        story.append(Paragraph("Source Credibility Analysis", heading_style))
        for src in sources:
            score = src.get('credibility_score', 0)
            color = '#22c55e' if score >= 70 else '#eab308' if score >= 50 else '#ef4444'
            url = src.get('url', 'N/A')
            url_display = url.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            try:
                story.append(Paragraph(
                    f"<font color='{color}'><b>{score}/100</b></font> - <font size='8'>{url_display}</font>",
                    body_style
                ))
            except Exception:
                pass
        story.append(Spacer(1, 0.2*inch))
    
    # Issues Identified
    contradictions = session.get('contradictions_found', [])
    if contradictions:
        story.append(Paragraph("Issues Identified by Fact-Checker", heading_style))
        for item in contradictions:
            try:
                story.append(Paragraph(f"• {_sanitize_for_pdf(item)}", body_style))
            except Exception:
                pass
        story.append(Spacer(1, 0.2*inch))
    
    # Page break before detailed sections
    story.append(PageBreak())
    
    # Research Findings
    researcher_output = session.get('researcher_output', '')
    if researcher_output:
        story.append(Paragraph("Research Findings", heading_style))
        for para in researcher_output.split('\n\n'):
            if para.strip():
                try:
                    story.append(Paragraph(_sanitize_for_pdf(para), body_style))
                except Exception:
                    safe_text = para.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>')
                    try:
                        story.append(Paragraph(safe_text, body_style))
                    except Exception:
                        pass
        story.append(Spacer(1, 0.2*inch))
    
    # Fact-Check Analysis
    fact_checker_output = session.get('fact_checker_output', '')
    if fact_checker_output:
        story.append(Paragraph("Fact-Check Analysis", heading_style))
        for para in fact_checker_output.split('\n\n'):
            if para.strip():
                try:
                    story.append(Paragraph(_sanitize_for_pdf(para), body_style))
                except Exception:
                    safe_text = para.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>')
                    try:
                        story.append(Paragraph(safe_text, body_style))
                    except Exception:
                        pass
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['BodyText'],
        fontSize=8,
        textColor=HexColor('#a1a1aa'),
        alignment=TA_CENTER
    )
    story.append(Paragraph("Generated by MARS - Multi-Agent Research System", footer_style))
    
    # Build the PDF
    doc.build(story)
    
    buffer.seek(0)
    return buffer.getvalue()

def _latex_escape(text: str) -> str:
    """Escape special LaTeX characters"""
    if not text:
        return ""
    replacements = {
        '\\': r'\textbackslash{}',
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\textasciicircum{}',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text

def generate_latex_report(session: dict) -> str:
    """Generate an editable LaTeX research paper"""
    topic = _latex_escape(session.get('topic', 'Unknown Topic'))
    created_at = session.get('created_at', 'Unknown Date')
    contradictions = session.get('contradictions_found', [])
    final_report = _latex_escape(session.get('final_report', 'No report available'))
    researcher_output = _latex_escape(session.get('researcher_output', ''))
    fact_checker_output = _latex_escape(session.get('fact_checker_output', ''))
    sources = session.get('sources', [])
    credibility_score = session.get('credibility_score', 0) or 0
    
    latex = r"""\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[margin=1in]{geometry}
\usepackage{hyperref}
\usepackage{xcolor}
\usepackage{titlesec}
\usepackage{parskip}
\usepackage{enumitem}

\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    urlcolor=blue,
    citecolor=blue
}

\titleformat{\section}{\Large\bfseries\color{blue!60!black}}{\thesection}{1em}{}
\titleformat{\subsection}{\large\bfseries\color{gray!60!black}}{\thesubsection}{1em}{}

\title{\textbf{Research Report:} """ + topic + r"""}
\author{Generated by MARS -- Multi-Agent Research System}
\date{""" + _latex_escape(created_at) + r"""}

\begin{document}

\maketitle

\begin{center}
\textbf{Overall Source Credibility Score:} """ + f"{credibility_score}/100" + r"""
\end{center}

\section{Executive Summary}

""" + final_report + r"""

\section{Source Credibility Analysis}

"""
    
    if sources:
        latex += r"\begin{itemize}[leftmargin=*]" + "\n"
        for src in sources:
            url = src.get('url', 'N/A')
            score = src.get('credibility_score', 0)
            level = src.get('credibility_level', 'unknown')
            verified = src.get('verified')
            verified_url = src.get('verified_url') or url
            # Use verified_url for the hyperlink so it points to the actual accessible source
            escaped_url = verified_url.replace('%', r'\%').replace('#', r'\#').replace('&', r'\&').replace('_', r'\_')
            display_url = _latex_escape(verified_url[:80] + ('...' if len(verified_url) > 80 else ''))
            verification_status = "Verified" if verified else "Unverified" if verified is False else "Not checked"
            latex += rf"\item \textbf{{[{score}/100 - {level}]}} \href{{{escaped_url}}}{{{display_url}}} ({verification_status})" + "\n"
        latex += r"\end{itemize}" + "\n"
    else:
        latex += "No sources with URLs found.\n"
    
    latex += r"""
\section{Issues Identified by Fact-Checker}

"""
    
    if contradictions:
        latex += r"\begin{itemize}[leftmargin=*]" + "\n"
        for item in contradictions:
            latex += rf"\item {_latex_escape(item)}" + "\n"
        latex += r"\end{itemize}" + "\n"
    else:
        latex += "No major issues identified.\n"
    
    latex += r"""
\newpage

\section{Research Findings}

""" + researcher_output + r"""

\section{Fact-Check Analysis}

""" + fact_checker_output + r"""

\vfill

\hrulefill

\begin{center}
\textit{Report generated by MARS -- Multi-Agent Research System}
\end{center}

\end{document}
"""
    return latex

def generate_docx_report(session: dict) -> bytes:
    """Generate an editable Word (.docx) research paper"""
    doc = Document()
    
    # Set document margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
    
    topic = session.get('topic', 'Unknown Topic')
    created_at = session.get('created_at', 'Unknown Date')
    contradictions = session.get('contradictions_found', [])
    final_report = session.get('final_report', 'No report available')
    researcher_output = session.get('researcher_output', '')
    fact_checker_output = session.get('fact_checker_output', '')
    sources = session.get('sources', [])
    credibility_score = session.get('credibility_score', 0) or 0
    
    # Title
    title = doc.add_heading('Research Report', level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    
    subtitle = doc.add_heading(topic, level=1)
    
    # Metadata
    meta = doc.add_paragraph()
    meta_run = meta.add_run(f'Generated: {created_at}\n')
    meta_run.font.size = Pt(10)
    meta_run.font.color.rgb = RGBColor(0x71, 0x71, 0x7a)
    
    status_run = meta.add_run(f'Status: {session.get("status", "Unknown").capitalize()}\n')
    status_run.font.size = Pt(10)
    status_run.font.color.rgb = RGBColor(0x71, 0x71, 0x7a)
    
    cred_para = doc.add_paragraph()
    cred_run = cred_para.add_run(f'Overall Source Credibility: {credibility_score}/100')
    cred_run.bold = True
    cred_run.font.size = Pt(11)
    if credibility_score >= 70:
        cred_run.font.color.rgb = RGBColor(0x22, 0xc5, 0x5e)
    elif credibility_score >= 50:
        cred_run.font.color.rgb = RGBColor(0xea, 0xb3, 0x08)
    else:
        cred_run.font.color.rgb = RGBColor(0xef, 0x44, 0x44)
    
    # Executive Summary
    doc.add_heading('Executive Summary', level=2)
    for para in final_report.split('\n\n'):
        if para.strip():
            p = doc.add_paragraph(para.strip())
            p.paragraph_format.space_after = Pt(6)
    
    # Source Credibility Analysis
    if sources:
        doc.add_heading('Source Credibility Analysis', level=2)
        for src in sources:
            url = src.get('url', 'N/A')
            score = src.get('credibility_score', 0)
            level = src.get('credibility_level', 'unknown')
            verified = src.get('verified')
            verified_url = src.get('verified_url') or url
            
            p = doc.add_paragraph()
            score_run = p.add_run(f'[{score}/100 - {level}] ')
            score_run.bold = True
            if score >= 70:
                score_run.font.color.rgb = RGBColor(0x22, 0xc5, 0x5e)
            elif score >= 50:
                score_run.font.color.rgb = RGBColor(0xea, 0xb3, 0x08)
            else:
                score_run.font.color.rgb = RGBColor(0xef, 0x44, 0x44)
            
            url_run = p.add_run(verified_url)
            url_run.font.size = Pt(9)
            url_run.font.color.rgb = RGBColor(0x0e, 0xa5, 0xe9)
            
            status_text = f' ({"Verified" if verified else "Unverified" if verified is False else "Not checked"})'
            status_run = p.add_run(status_text)
            status_run.font.size = Pt(9)
            status_run.italic = True
    
    # Issues Identified
    if contradictions:
        doc.add_heading('Issues Identified by Fact-Checker', level=2)
        for item in contradictions:
            doc.add_paragraph(item, style='List Bullet')
    
    # Page break
    doc.add_page_break()
    
    # Research Findings
    if researcher_output:
        doc.add_heading('Research Findings', level=2)
        for para in researcher_output.split('\n\n'):
            if para.strip():
                p = doc.add_paragraph(para.strip())
                p.paragraph_format.space_after = Pt(6)
    
    # Fact-Check Analysis
    if fact_checker_output:
        doc.add_heading('Fact-Check Analysis', level=2)
        for para in fact_checker_output.split('\n\n'):
            if para.strip():
                p = doc.add_paragraph(para.strip())
                p.paragraph_format.space_after = Pt(6)
    
    # Footer
    doc.add_paragraph()
    footer = doc.add_paragraph()
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer.add_run('Generated by MARS - Multi-Agent Research System')
    footer_run.italic = True
    footer_run.font.size = Pt(9)
    footer_run.font.color.rgb = RGBColor(0xa1, 0xa1, 0xaa)
    
    # Save to buffer
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()

# Routes
@api_router.get("/")
async def root():
    return {"message": "Multi-Agent Research System API"}

@api_router.get("/templates")
async def get_templates():
    """Get research templates"""
    return {"templates": RESEARCH_TEMPLATES}

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
async def start_research(request: ResearchRequest, current_user: dict = Depends(get_current_user)):
    """Start a new research session"""
    session = ResearchSession(topic=request.topic)
    doc = session.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['user_id'] = current_user["id"]  # Associate with user
    await db.research_sessions.insert_one(doc)
    
    researcher_config = request.researcher_config.model_dump(exclude_none=True) if request.researcher_config else None
    fact_checker_config = request.fact_checker_config.model_dump(exclude_none=True) if request.fact_checker_config else None
    writer_config = request.writer_config.model_dump(exclude_none=True) if request.writer_config else None
    
    asyncio.create_task(run_research_crew(
        session.id, request.topic, request.fast_mode,
        researcher_config, fact_checker_config, writer_config
    ))
    
    return {"session_id": session.id, "topic": request.topic, "status": "started", "fast_mode": request.fast_mode}

@api_router.get("/research/stream/{session_id}")
async def stream_research(session_id: str):
    """Stream research events via SSE"""
    async def event_generator():
        queue = asyncio.Queue()
        
        if session_id not in event_queues:
            event_queues[session_id] = []
        event_queues[session_id].append(queue)
        
        try:
            yield f"data: {json.dumps({'type': 'connected', 'message': 'Connected to research stream'})}\n\n"
            
            # Check if session already completed
            session = await db.research_sessions.find_one({"id": session_id}, {"_id": 0})
            if session and session.get('status') in ['completed', 'error']:
                yield f"data: {json.dumps({'type': session.get('status'), 'message': 'Session already finished', 'data': {'status': session.get('status'), 'progress': session.get('progress', 100)}})}\n\n"
                return
            
            timeout_count = 0
            max_timeouts = 60
            
            while timeout_count < max_timeouts:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    timeout_count = 0
                    yield f"data: {json.dumps(event)}\n\n"
                    
                    if event.get('type') in ['complete', 'error']:
                        break
                except asyncio.TimeoutError:
                    timeout_count += 1
                    yield f"data: {json.dumps({'type': 'heartbeat', 'message': 'Connection alive'})}\n\n"
                    
                    session = await db.research_sessions.find_one({"id": session_id}, {"_id": 0})
                    if session and session.get('status') in ['completed', 'error']:
                        yield f"data: {json.dumps({'type': session.get('status'), 'message': 'Session finished', 'data': {'status': session.get('status')}})}\n\n"
                        break
        finally:
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

@api_router.get("/research/{session_id}/export/pdf")
async def export_pdf(session_id: str):
    """Export research session as PDF"""
    session = await db.research_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        pdf_content = generate_pdf_report(session)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=research-report-{session_id[:8]}.pdf"
            }
        )
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF")

@api_router.get("/research/{session_id}/export/latex")
async def export_latex(session_id: str):
    """Export research session as editable LaTeX (.tex)"""
    session = await db.research_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        latex_content = generate_latex_report(session)
        return Response(
            content=latex_content,
            media_type="application/x-latex",
            headers={
                "Content-Disposition": f"attachment; filename=research-report-{session_id[:8]}.tex"
            }
        )
    except Exception as e:
        logger.error(f"LaTeX generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate LaTeX")

@api_router.get("/research/{session_id}/export/docx")
async def export_docx(session_id: str):
    """Export research session as editable Word document (.docx)"""
    session = await db.research_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        docx_content = generate_docx_report(session)
        return Response(
            content=docx_content,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename=research-report-{session_id[:8]}.docx"
            }
        )
    except Exception as e:
        logger.error(f"DOCX generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate DOCX")

@api_router.get("/research")
async def get_research_sessions(current_user: dict = Depends(get_current_user)):
    """Get all research sessions for the current user"""
    # Admins see all, users see only their own
    query = {} if current_user.get("role") == "admin" else {"user_id": current_user["id"]}
    sessions = await db.research_sessions.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return sessions

@api_router.delete("/research/{session_id}")
async def delete_research_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a research session (only own sessions unless admin)"""
    query = {"id": session_id}
    if current_user.get("role") != "admin":
        query["user_id"] = current_user["id"]
    result = await db.research_sessions.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[get_frontend_url(), "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
