# MARS - Multi-Agent Research System

<div align="center">

![MARS Logo](https://img.shields.io/badge/MARS-Multi--Agent%20Research%20System-22c55e?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMyMmM1NWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEzIDIgMyAxNCAzIDIxIDE0IDIxIDE0IDE0IDIxIDE0IDEzIDIiLz48L3N2Zz4=)

**Deep-dive research automation powered by AI agents**

[![Version](https://img.shields.io/badge/version-1.2.0-22c55e?style=flat-square)](https://github.com/your-org/mars-research-system)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![CrewAI](https://img.shields.io/badge/CrewAI-FF6B6B?style=flat-square&logo=openai&logoColor=white)](https://crewai.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Architecture](#backend-architecture) • [Contributing](#contributing)

</div>

---

## The Problem

Research is time-consuming and error-prone. Traditional approaches require:
- **Hours of manual source hunting** across multiple platforms
- **Cognitive bias blind spots** that compromise objectivity
- **Fragmented synthesis** of conflicting information
- **No systematic fact-checking** before drawing conclusions
- **No way to assess source credibility** systematically

Researchers need a system that can autonomously gather, verify, and synthesize information while maintaining intellectual rigor and transparency.

## What We Built

**MARS** (Multi-Agent Research System) is an AI-powered research automation platform that deploys a team of specialized AI agents working in sequence:

1. **Lead Researcher** - Hunts for credible sources and compiles comprehensive findings
2. **Aggressive Fact-Checker** - Scrutinizes research for contradictions, biases, and errors
3. **Technical Writer** - Synthesizes a balanced report addressing all concerns

The system provides a **live terminal feed** showing each agent's "internal monologue" as they work, **automatic credibility scoring** for all sources, **6 pre-configured research templates** to get started quickly, and **PDF/Markdown/JSON exports** for sharing.

---

## Table of Contents

- [Definitions](#definitions)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Backend Architecture](#backend-architecture)
- [Database Schema](#database-schema)
- [Security Features](#security-features)
- [Key Bug Fixes & Improvements](#key-bug-fixes--improvements)
- [Performance Optimizations](#performance-optimizations)
- [Design System](#design-system)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgement](#acknowledgement)
- [Support](#support)
- [Project Info](#project-info)

---

## Definitions

| Term | Definition |
|------|------------|
| **CrewAI** | An open-source framework for orchestrating autonomous AI agents that work together to accomplish complex tasks |
| **Sequential Process** | A workflow where agents execute in order, with each agent's output feeding into the next agent's context |
| **SSE (Server-Sent Events)** | A server push technology enabling real-time updates from server to client over HTTP |
| **Agent Monologue** | The internal reasoning and decision-making process of an AI agent, displayed in terminal format |
| **Fact-Checking Gate** | A requirement that the Fact-Checker must identify at least one issue before the Writer can proceed |
| **Emergent LLM Key** | A universal API key that provides access to multiple LLM providers (OpenAI, Anthropic, Google) |
| **Credibility Score** | A 0-100 rating assigned to each source based on domain reputation, TLD, and other factors |
| **Fast Mode** | An optimized mode using GPT-4o Mini for 4-5x faster research at slightly reduced depth |
| **Research Template** | Pre-configured prompts for common research scenarios (market analysis, technical deep dive, etc.) |

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Multi-Agent Architecture** | Three specialized AI agents working in sequence |
| **Live Terminal Feeds** | Real-time visualization of each agent's reasoning |
| **Aggressive Fact-Checking** | Built-in skepticism that MUST find at least one issue |
| **Sequential Workflow** | Structured process ensuring thorough review |
| **Dark Mode Dashboard** | Cyberpunk-inspired terminal aesthetic |

### New Features (v1.2.0)

| Feature | Description |
|---------|-------------|
| **PDF Export** | Professional PDF reports with color-coded credibility scores |
| **Research Templates** | 6 pre-configured templates for common research scenarios |
| **Source Credibility Scoring** | Automatic 0-100 rating for each source based on domain reputation |
| **Fast Mode** | GPT-4o Mini for 4-5x faster research (~15-20 seconds) |
| **Optimized Speed** | Reduced verbosity and iteration limits for faster completion |

### v1.1.0 Features

| Feature | Description |
|---------|-------------|
| **Research History** | Browse all past research sessions with detailed view |
| **Markdown Export** | Download completed research as `.md` files |
| **JSON Export** | Download raw session data as `.json` files |
| **Progress Indicators** | Real-time progress bar (0-100%) |
| **Session Management** | Delete sessions with confirmation dialog |
| **SSE Reconnection** | Automatic reconnection with heartbeat monitoring |

### Research Templates

| Template | Use Case |
|----------|----------|
| **Market Analysis** | Market landscape and competitor analysis |
| **Technical Deep Dive** | In-depth analysis of emerging technologies |
| **Scientific Review** | Academic literature review on scientific topics |
| **Policy Analysis** | Government policy impact and implementation |
| **Trend Forecast** | Emerging trends and future predictions |
| **Competitive Intelligence** | Company or product competitive positioning |

### Credibility Scoring System

Sources are automatically scored 0-100 based on:

| Score Range | Level | Indicators |
|-------------|-------|------------|
| **80-100** | High | nature.com, science.org, .edu, .gov, .nih.gov, reuters.com, IEEE, arxiv.org |
| **60-79** | Medium | .org domains, reputable news outlets, HTTPS |
| **40-59** | Low | General web sources, standard TLDs |
| **0-39** | Very Low | Blogs, wordpress, personal sites, non-HTTPS |

### Agent Capabilities

```
┌─────────────────────────────────────────────────────────────────┐
│                      LEAD RESEARCHER                             │
├─────────────────────────────────────────────────────────────────┤
│  • Web search via DuckDuckGo                                     │
│  • Source credibility assessment                                 │
│  • Multi-perspective gathering                                   │
│  • Key findings extraction                                       │
│  • Statistical data compilation                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PROFESSIONAL FACT-CHECKER                      │
├─────────────────────────────────────────────────────────────────┤
│  • Contradiction detection                                       │
│  • Bias identification                                           │
│  • Technical accuracy verification                               │
│  • Missing perspective flagging                                  │
│  • Unsubstantiated claim detection                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SENIOR TECHNICAL WRITER                        │
├─────────────────────────────────────────────────────────────────┤
│  • Research synthesis                                            │
│  • Concern acknowledgment                                        │
│  • Balanced perspective presentation                             │
│  • Source attribution                                            │
│  • ~300-500 word comprehensive summary                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations and transitions |
| **Shadcn/UI** | Component library |
| **Lucide React** | Icon system |
| **Sonner** | Toast notifications |
| **React Router** | Page navigation |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Python web framework |
| **CrewAI** | Multi-agent orchestration |
| **Motor** | Async MongoDB driver |
| **SSE-Starlette** | Server-sent events |
| **DuckDuckGo Search** | Web search tool |
| **Pydantic** | Data validation |
| **ReportLab** | PDF generation |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **MongoDB** | Document database |
| **Uvicorn** | ASGI server |
| **GPT-5.2** | Comprehensive research LLM |
| **GPT-4o Mini** | Fast Mode LLM |
| **Emergent Integrations** | LLM proxy service |

---

## Project Structure

```
/app
├── backend/
│   ├── server.py              # FastAPI + CrewAI + PDF + Credibility scoring
│   ├── requirements.txt       # Python dependencies (includes reportlab)
│   └── .env                   # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── App.js             # Dashboard, History, Templates, Credibility UI
│   │   ├── App.css            # Custom styles
│   │   ├── index.css          # Global styles & Tailwind
│   │   └── components/
│   │       └── ui/            # Shadcn UI components
│   ├── public/
│   ├── package.json           # Node dependencies
│   ├── tailwind.config.js     # Tailwind configuration
│   └── .env                   # Frontend environment variables
│
├── memory/
│   └── PRD.md                 # Product requirements document
│
├── test_reports/              # Testing agent reports
│
└── README.md                  # This file
```

---

## Backend Architecture

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                   │
│                         React Dashboard                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────┐             │
│  │Dashboard  │ │ Templates │ │  History  │ │  Export    │             │
│  │  (/)      │ │   Grid    │ │(/history) │ │(PDF/MD/JSON)│             │
│  └───────────┘ └───────────┘ └───────────┘ └────────────┘             │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                    HTTP/SSE     │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           FASTAPI BACKEND                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        API ROUTER (/api)                         │   │
│  │  POST /research/start        GET /templates                     │   │
│  │  GET /research/stream/{id}   GET /research                      │   │
│  │  GET /research/{id}          DELETE /research/{id}              │   │
│  │  GET /research/{id}/export/pdf                                  │   │
│  │  GET /research/{id}/export/markdown                             │   │
│  │  GET /research/{id}/export/json                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │            CREWAI + CREDIBILITY SCORING + PDF GEN                │   │
│  │                                                                   │   │
│  │   ┌──────────┐      ┌──────────┐      ┌──────────┐              │   │
│  │   │Researcher│ ───▶ │Fact-Check│ ───▶ │  Writer  │              │   │
│  │   └──────────┘      └──────────┘      └──────────┘              │   │
│  │         │                                     │                   │   │
│  │         ▼                                     ▼                   │   │
│  │   ┌──────────┐                        ┌──────────┐                │   │
│  │   │DuckDuckGo│                        │  URL     │                │   │
│  │   │  Search  │                        │Extraction│                │   │
│  │   └──────────┘                        └──────────┘                │   │
│  │                                              │                    │   │
│  │                                              ▼                    │   │
│  │                                        ┌──────────┐               │   │
│  │                                        │Credibility│               │   │
│  │                                        │ Scoring  │               │   │
│  │                                        └──────────┘               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
┌─────────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│      MongoDB        │ │   Emergent LLM  │ │   DuckDuckGo    │
│   (Sessions DB)     │ │   Proxy (GPT)   │ │      API        │
└─────────────────────┘ └─────────────────┘ └─────────────────┘
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Health check |
| GET | `/api/templates` | Get 6 research templates |
| POST | `/api/research/start` | Start new research (with fast_mode option) |
| GET | `/api/research/stream/{id}` | SSE stream for real-time updates |
| GET | `/api/research/{id}` | Get session details |
| GET | `/api/research` | List all sessions |
| DELETE | `/api/research/{id}` | Delete a session |
| GET | `/api/research/{id}/export/pdf` | Export as PDF (NEW) |
| GET | `/api/research/{id}/export/markdown` | Export as Markdown |
| GET | `/api/research/{id}/export/json` | Export as JSON |

### Request Flow

1. **User selects template or types topic** → Fills topic input
2. **User toggles Fast Mode** → Chooses GPT-4o Mini or GPT-5.2
3. **POST `/api/research/start`** → Session created in MongoDB
4. **Background task spawned** → CrewAI crew begins execution
5. **Client connects to SSE** → Real-time progress updates
6. **Agents execute sequentially** → Researcher → Fact-Checker → Writer
7. **URLs extracted** → Credibility scoring applied
8. **Research completes** → Final report stored with sources
9. **User exports** → PDF/Markdown/JSON download

---

## Database Schema

### Research Sessions Collection

```javascript
{
  "id": "uuid-string",           // Unique session identifier
  "topic": "string",             // Research topic
  "status": "string",            // pending | researching | completed | error
  "progress": 0-100,             // Progress percentage
  "current_agent": "string",     // Currently active agent
  "researcher_output": "string", // Lead Researcher's findings
  "fact_checker_output": "string", // Fact-Checker's analysis
  "writer_output": "string",     // Technical Writer's report
  "contradictions_found": ["string"], // Issues identified
  "sources": [                   // NEW: Scored sources
    {
      "url": "https://example.com",
      "credibility_score": 85,
      "credibility_level": "high",
      "reasons": ["Trusted source: nature.com", "HTTPS enabled"]
    }
  ],
  "credibility_score": 78.5,     // NEW: Overall average credibility
  "final_report": "string",      // Complete synthesized report
  "error_message": "string",     // User-friendly error message
  "created_at": "ISO-8601",      // Creation timestamp
  "completed_at": "ISO-8601"     // Completion timestamp
}
```

---

## Security Features

| Feature | Implementation |
|---------|----------------|
| **CORS Protection** | Configurable origins via environment variable |
| **Input Validation** | Pydantic models for all request/response data |
| **Environment Secrets** | API keys stored in `.env`, never hardcoded |
| **MongoDB ObjectId Exclusion** | `_id` fields excluded from all API responses |
| **Error Sanitization** | Internal errors logged, user-friendly messages to clients |
| **XSS Prevention** | HTML entities escaped in PDF generation |
| **URL Sanitization** | Special characters escaped in exports |
| **Delete Confirmation** | Frontend confirmation dialog before session deletion |

---

## Key Bug Fixes & Improvements

### Version 1.2.0 (Current)

| Issue | Resolution |
|-------|------------|
| **Research Too Slow (~90s)** | Added Fast Mode with GPT-4o Mini (~15-20s, 4-5x faster) |
| **No PDF Export** | Implemented PDF export with reportlab and color-coded credibility |
| **No Template Presets** | Added 6 pre-configured research templates |
| **No Source Validation** | Automatic credibility scoring (0-100) for all extracted URLs |
| **PDF Parse Errors** | Added XML escaping and markdown-to-HTML conversion |
| **Model Name Issues** | Updated to use correct model names (gpt-4o-mini, gpt-5.2) |
| **Verbose Agent Output** | Reduced verbosity for faster processing |
| **No Iteration Limits** | Added `max_iter=2` on agents to prevent infinite loops |

### Version 1.1.0

| Issue | Resolution |
|-------|------------|
| **SSE Connection Drops** | Automatic reconnection with 3-second retry delay |
| **No Progress Visibility** | Real-time progress bar (0-100%) with agent tracking |
| **Missing History View** | Created dedicated `/history` page |
| **No Export Options** | Added Markdown and JSON export endpoints |
| **Cryptic Error Messages** | User-friendly error parsing for budget/auth/timeout |
| **Session Cleanup** | Added delete endpoint with confirmation |

### Version 1.0.0

| Issue | Resolution |
|-------|------------|
| **LLM Authentication Failure** | Configured CrewAI LLM with Emergent proxy `base_url` |
| **SSE Connection Timeout** | Implemented 30-second heartbeat |
| **Pydantic Version Conflict** | Resolved dependency conflicts |
| **Async Event Loop** | Proper thread isolation for CrewAI |

---

## Performance Optimizations

### Speed Optimizations (v1.2.0)

| Optimization | Impact |
|--------------|--------|
| **GPT-4o Mini in Fast Mode** | ~4-5x faster inference (15-20s vs 90s) |
| **Reduced max_tokens** | 1500 tokens vs 2500 in fast mode |
| **Lower temperature (0.5)** | More focused, deterministic responses |
| **max_iter=2 on agents** | Prevents unnecessary iterations |
| **Reduced verbosity** | No verbose logging during CrewAI execution |
| **Fewer search results** | 3 sources in fast mode vs 5 in standard |
| **Shorter output targets** | 300 words in fast mode vs 500 in standard |

### General Performance

| Optimization | Impact |
|--------------|--------|
| **Async MongoDB Operations** | Non-blocking database I/O with Motor driver |
| **Background Task Execution** | `asyncio.create_task()` for non-blocking research |
| **Thread Pool for CrewAI** | `asyncio.to_thread()` prevents event loop blocking |
| **SSE Event Queuing** | Efficient pub/sub pattern for multi-client support |
| **URL Regex Caching** | Compiled patterns for source extraction |
| **Progress Batching** | Progress updates throttled to prevent UI flooding |

---

## Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#09090b` | Main app background |
| Surface | `#18181b` | Cards and panels |
| Border | `#27272a` | Dividers and outlines |
| Text Primary | `#fafafa` | Headings and body |
| Text Secondary | `#a1a1aa` | Muted text |
| Researcher | `#0ea5e9` | Blue - Lead Researcher |
| Fact-Checker | `#f97316` | Orange - Critic |
| Writer | `#10b981` | Green - Technical Writer |
| Active Status | `#22c55e` | Processing indicator |
| Error Status | `#ef4444` | Error states |
| Warning Status | `#eab308` | Warnings |

### Credibility Color Coding

| Score | Color | Level |
|-------|-------|-------|
| 80-100 | Green (`#22c55e`) | High credibility |
| 60-79 | Orange (`#f97316`) | Medium credibility |
| 40-59 | Yellow (`#eab308`) | Low credibility |
| 0-39 | Red (`#ef4444`) | Very low credibility |

### Typography

| Element | Font | Weight |
|---------|------|--------|
| UI Text | IBM Plex Sans | 300-700 |
| Terminal/Code | JetBrains Mono | 400-500 |

---

## Environment Variables

### Backend (`/app/backend/.env`)

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=sk-emergent-xxxxx
```

### Frontend (`/app/frontend/.env`)

```env
REACT_APP_BACKEND_URL=https://your-domain.com
WDS_SOCKET_PORT=443
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB 6.0+
- Emergent LLM Key (or OpenAI API key)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/mars-research-system.git
cd mars-research-system
```

2. **Install backend dependencies**
```bash
cd backend
pip install -r requirements.txt
```

3. **Install frontend dependencies**
```bash
cd ../frontend
yarn install
```

4. **Configure environment variables**
```bash
# Add your EMERGENT_LLM_KEY to backend/.env
# Add REACT_APP_BACKEND_URL to frontend/.env
```

5. **Start services**
```bash
# Backend
cd backend && uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend && yarn start
```

6. **Access the application**
```
Dashboard: http://localhost:3000
History:   http://localhost:3000/history
```

### Usage Guide

1. **Quick Start with Template**: Click any template card (Market Analysis, Tech Deep Dive, etc.)
2. **Custom Topic**: Type your research question in the input field
3. **Toggle Fast Mode**: Switch on for 4-5x faster results with GPT-4o Mini
4. **Start Research**: Click "Start Research" to begin
5. **Watch Live Feeds**: See agents work in real-time via terminal feeds
6. **View Results**: Check the final report, sources, and credibility scores
7. **Export**: Download as PDF, Markdown, or JSON
8. **History**: Browse past sessions at `/history`

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution

- [x] ~~Research session history page~~
- [x] ~~Markdown/JSON export functionality~~
- [x] ~~PDF export~~
- [x] ~~Progress indicators~~
- [x] ~~Research templates~~
- [x] ~~Source credibility scoring~~
- [ ] Custom agent configuration UI
- [ ] Additional LLM provider support
- [ ] Collaborative research (multi-user)
- [ ] Advanced credibility scoring (ML-based)
- [ ] Real-time source verification
- [ ] Custom credibility rules editor
- [ ] Research scheduling/automation

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 MARS Research System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## Acknowledgement

- **[CrewAI](https://crewai.com/)** - Multi-agent orchestration framework
- **[OpenAI](https://openai.com/)** - GPT-5.2 and GPT-4o Mini language models
- **[Emergent](https://emergent.sh/)** - Universal LLM key infrastructure
- **[DuckDuckGo](https://duckduckgo.com/)** - Privacy-focused search API
- **[Shadcn/UI](https://ui.shadcn.com/)** - Beautiful component library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[ReportLab](https://www.reportlab.com/)** - PDF generation library

---

## Support

- **Documentation**: [docs.mars-research.io](https://docs.mars-research.io)
- **Issues**: [GitHub Issues](https://github.com/your-org/mars-research-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/mars-research-system/discussions)
- **Email**: support@mars-research.io

### Common Issues

| Issue | Solution |
|-------|----------|
| **Budget exceeded error** | Add balance: Profile → Universal Key → Add Balance |
| **Authentication failed** | Verify EMERGENT_LLM_KEY in backend/.env |
| **Connection interrupted** | System auto-reconnects in 3 seconds |
| **Research stuck** | Enable Fast Mode for quicker results |
| **PDF generation fails** | Check logs; sanitizer handles most cases |
| **Slow research (>60s)** | Enable Fast Mode toggle for ~15-20s completion |

---

## Project Info

| | |
|---|---|
| **Version** | 1.2.0 |
| **Status** | Production Ready |
| **Last Updated** | January 2026 |
| **Maintainers** | MARS Team |
| **Language** | Python, JavaScript |
| **Frameworks** | FastAPI, React, CrewAI |
| **Database** | MongoDB |
| **LLM** | GPT-5.2 / GPT-4o Mini via Emergent |

### Changelog

#### v1.2.0 (Current)
- Added PDF export with color-coded credibility scores
- Added 6 research templates (Market Analysis, Tech Deep Dive, Scientific Review, Policy Analysis, Trend Forecast, Competitive Intelligence)
- Added automatic source credibility scoring (0-100)
- Added Fast Mode toggle for 4-5x faster research
- Optimized CrewAI agents (max_iter=2, reduced verbosity, focused prompts)
- Fixed PDF generation with XML escaping and markdown handling

#### v1.1.0
- Added Research History page (`/history`)
- Added Markdown and JSON export
- Added progress indicators with percentage
- Added session delete functionality
- Improved SSE reconnection handling
- Improved error messages

#### v1.0.0
- Initial release with three-agent architecture
- Real-time terminal feeds
- Sequential process workflow
- Dark mode dashboard

---

<div align="center">

**Built with AI, for better research**

[Report Bug](https://github.com/your-org/mars-research-system/issues) • [Request Feature](https://github.com/your-org/mars-research-system/issues) • [Star on GitHub](https://github.com/your-org/mars-research-system)

</div>
