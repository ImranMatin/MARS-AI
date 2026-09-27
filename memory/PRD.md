# Multi-Agent Research System (MARS) - PRD

## Original Problem Statement
Build a Multi-Agent AI system using the CrewAI framework to automate deep-dive research with:
- Lead Researcher: Find 5 credible sources on complex topics
- Professional Critic: Find potential biases or technical errors (aggressive fact-checking)
- Senior Technical Writer: Write a 500-word summary incorporating research and addressing concerns
- Sequential Process: Researcher → Critic → Writer

## User Personas
1. **Researchers** - Need comprehensive analysis on complex topics
2. **Developers** - Want to understand multi-agent AI architectures
3. **AI Enthusiasts** - Interested in seeing AI agents collaborate in real-time

## Core Requirements (Static)
- CrewAI framework with GPT-5.2 Thinking
- Sequential process architecture
- Aggressive fact-checker that MUST find at least one issue
- Live terminal feeds showing agent "internal monologue"
- Dark mode React dashboard
- DuckDuckGo search for web research
- SSE streaming for real-time updates

## What's Been Implemented

### Version 1.1.0 (Jan 2026)
- [x] **History Page** - Browse all research sessions at `/history`
- [x] **Export Markdown** - Download reports as `.md` files
- [x] **Export JSON** - Download reports as `.json` files
- [x] **Progress Indicators** - Real-time progress bar (0-100%)
- [x] **Session Delete** - Remove unwanted sessions with confirmation
- [x] **Improved SSE** - Auto-reconnection with 3-second retry
- [x] **Better Errors** - User-friendly messages for budget/auth/timeout

### Version 1.0.0 (Jan 2026)
- [x] Three AI agents: Researcher, Fact-Checker, Writer
- [x] Sequential process with proper task dependencies
- [x] Emergent LLM Key integration via proxy URL
- [x] SSE streaming for live agent updates
- [x] MongoDB storage for research sessions
- [x] DuckDuckGo search tool integration
- [x] Dark mode dashboard with Cyberpunk Terminal aesthetic
- [x] Three agent cards with terminal feeds
- [x] Process flow visualization
- [x] Results panel with contradictions and final report
- [x] IBM Plex Sans + JetBrains Mono typography

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Multi-agent research execution
- [x] Real-time terminal feeds
- [x] Fact-checker contradiction detection
- [x] History page
- [x] Export functionality
- [x] Progress indicators

### P1 - Important (Next)
- [ ] PDF export format
- [ ] Research templates for common topics
- [ ] Custom agent configuration UI
- [ ] Source credibility scoring

### P2 - Nice to Have (Future)
- [ ] Multiple LLM provider options
- [ ] Collaborative research (multiple users)
- [ ] Research scheduling/automation
- [ ] API rate limiting and quotas

## Technical Architecture
```
Frontend (React) ←→ SSE Streaming ←→ Backend (FastAPI)
     │                                      │
     │ /history                             ↓
     │ /export                        CrewAI Crew
     │                                ↓ Sequential
     │                           [Researcher Agent]
     │                                ↓ context
     │                           [Fact-Checker Agent]
     │                                ↓ context
     │                           [Writer Agent]
     │                                ↓
     └─────────────────────────→ MongoDB (sessions)
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Health check |
| POST | `/api/research/start` | Start research |
| GET | `/api/research/stream/{id}` | SSE stream |
| GET | `/api/research/{id}` | Get session |
| GET | `/api/research` | List sessions |
| DELETE | `/api/research/{id}` | Delete session |
| GET | `/api/research/{id}/export/markdown` | Export MD |
| GET | `/api/research/{id}/export/json` | Export JSON |

## Next Tasks
1. Add PDF export using reportlab or similar
2. Create research templates dropdown
3. Implement source credibility scoring
4. Add custom agent personality configuration
