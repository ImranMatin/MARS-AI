# MARS - Multi-Agent Research System

<div align="center">

![MARS Logo](https://img.shields.io/badge/MARS-Multi--Agent%20Research%20System-22c55e?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMyMmM1NWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEzIDIgMyAxNCAzIDIxIDE0IDIxIDE0IDE0IDIxIDE0IDEzIDIiLz48L3N2Zz4=)

**Deep-dive research automation powered by AI agents**

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![CrewAI](https://img.shields.io/badge/CrewAI-FF6B6B?style=flat-square&logo=openai&logoColor=white)](https://crewai.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![GPT-5.2](https://img.shields.io/badge/GPT--5.2-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Architecture](#backend-architecture) • [Contributing](#contributing)

</div>

---

## The Problem

Research is time-consuming and error-prone. Traditional approaches require:
- **Hours of manual source hunting** across multiple platforms
- **Cognitive bias blind spots** that compromise objectivity
- **Fragmented synthesis** of conflicting information
- **No systematic fact-checking** before drawing conclusions

Researchers need a system that can autonomously gather, verify, and synthesize information while maintaining intellectual rigor and transparency.

## What We Built

**MARS** (Multi-Agent Research System) is an AI-powered research automation platform that deploys a team of specialized AI agents working in sequence:

1. **Lead Researcher** - Hunts for credible sources and compiles comprehensive findings
2. **Aggressive Fact-Checker** - Scrutinizes research for contradictions, biases, and errors
3. **Technical Writer** - Synthesizes a balanced report addressing all concerns

The system provides a **live terminal feed** showing each agent's "internal monologue" as they work, giving users unprecedented visibility into AI reasoning processes.

<div align="center">
<img src="https://via.placeholder.com/800x400/09090b/22c55e?text=MARS+Dashboard+Preview" alt="MARS Dashboard" />
</div>

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

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Multi-Agent Architecture** | Three specialized AI agents (Researcher, Fact-Checker, Writer) working in sequence |
| **Live Terminal Feeds** | Real-time visualization of each agent's internal reasoning process |
| **Aggressive Fact-Checking** | Built-in skepticism that MUST find at least one issue in research findings |
| **Sequential Workflow** | Structured process ensuring thorough review before synthesis |
| **Dark Mode Dashboard** | Cyberpunk-inspired terminal aesthetic for reduced eye strain |

### New Features (v1.1.0)

| Feature | Description |
|---------|-------------|
| **Research History Page** | Browse all past research sessions with detailed view panel |
| **Export Reports** | Download completed research as Markdown (.md) or JSON files |
| **Progress Indicators** | Real-time progress bar (0-100%) showing research completion status |
| **Session Management** | Delete unwanted research sessions with confirmation dialog |
| **Improved Error Handling** | User-friendly error messages for budget limits, auth failures, timeouts |
| **SSE Reconnection** | Automatic reconnection with heartbeat monitoring for stable streaming |

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
│  • ~500 word comprehensive summary                               │
└─────────────────────────────────────────────────────────────────┘
```

### UI Features

- **Process Flow Visualization** - Visual pipeline showing agent progression with progress bar
- **Color-Coded Agent Cards** - Blue (Researcher), Orange (Fact-Checker), Green (Writer)
- **Real-Time Status Updates** - Idle/Active/Complete states with animations
- **Results Panel** - Contradictions list and final report display with export options
- **History Page** - Browse, view, and manage all research sessions
- **Responsive Design** - Works on desktop and tablet devices

### Export Formats

#### Markdown Export
```markdown
# Research Report: [Topic]

**Generated:** 2026-01-15T10:30:00Z  
**Status:** completed

---

## Executive Summary
[Final report content]

## Issues Identified
- Contradictions identified
- Potential bias detected

## Research Findings
[Researcher output]

## Fact-Check Analysis
[Fact-checker output]
```

#### JSON Export
```json
{
  "id": "uuid",
  "topic": "Research topic",
  "status": "completed",
  "progress": 100,
  "researcher_output": "...",
  "fact_checker_output": "...",
  "writer_output": "...",
  "contradictions_found": ["..."],
  "final_report": "...",
  "created_at": "ISO-8601",
  "completed_at": "ISO-8601"
}
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

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **MongoDB** | Document database |
| **Uvicorn** | ASGI server |
| **GPT-5.2** | Large language model |
| **Emergent Integrations** | LLM proxy service |

---

## Project Structure

```
/app
├── backend/
│   ├── server.py              # FastAPI application & CrewAI setup
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main React component with dashboard & history
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
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│    │  Dashboard   │  │   History    │  │   Export     │                │
│    │   (/)        │  │  (/history)  │  │   Menu       │                │
│    └──────────────┘  └──────────────┘  └──────────────┘                │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                    HTTP/SSE     │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           FASTAPI BACKEND                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        API ROUTER (/api)                         │   │
│  │  POST /research/start         GET /research/stream/{id}         │   │
│  │  GET /research/{id}           GET /research                      │   │
│  │  DELETE /research/{id}        GET /research/{id}/export/markdown │   │
│  │                               GET /research/{id}/export/json     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      CREWAI ORCHESTRATION                        │   │
│  │                                                                   │   │
│  │   ┌──────────┐      ┌──────────┐      ┌──────────┐              │   │
│  │   │Researcher│ ───▶ │Fact-Check│ ───▶ │  Writer  │              │   │
│  │   │  Agent   │      │  Agent   │      │  Agent   │              │   │
│  │   └──────────┘      └──────────┘      └──────────┘              │   │
│  │         │                                                        │   │
│  │         ▼                                                        │   │
│  │   ┌──────────┐                                                   │   │
│  │   │DuckDuckGo│                                                   │   │
│  │   │  Search  │                                                   │   │
│  │   └──────────┘                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                       │
└─────────────────────────────────┼───────────────────────────────────────┘
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
| POST | `/api/research/start` | Start new research session |
| GET | `/api/research/stream/{id}` | SSE stream for real-time updates |
| GET | `/api/research/{id}` | Get session details |
| GET | `/api/research` | List all sessions |
| DELETE | `/api/research/{id}` | Delete a session |
| GET | `/api/research/{id}/export/markdown` | Export as Markdown |
| GET | `/api/research/{id}/export/json` | Export as JSON |

### Request Flow

1. **User submits topic** → POST `/api/research/start`
2. **Session created** → Stored in MongoDB, returns `session_id`
3. **Background task spawned** → CrewAI crew begins execution
4. **Client connects to SSE** → GET `/api/research/stream/{session_id}`
5. **Progress updates streamed** → Real-time progress percentage sent
6. **Events streamed** → Agent status updates sent in real-time
7. **Research completes** → Final report stored, completion event sent
8. **User exports report** → GET `/api/research/{id}/export/markdown`

---

## Database Schema

### Research Sessions Collection

```javascript
{
  "id": "uuid-string",           // Unique session identifier
  "topic": "string",             // Research topic
  "status": "string",            // pending | researching | fact_checking | writing | completed | error
  "progress": 0-100,             // Progress percentage (NEW)
  "current_agent": "string",     // Currently active agent (NEW)
  "researcher_output": "string", // Lead Researcher's findings
  "fact_checker_output": "string", // Fact-Checker's analysis
  "writer_output": "string",     // Technical Writer's report
  "contradictions_found": [      // Array of identified issues
    "string"
  ],
  "sources": ["string"],         // List of source URLs
  "final_report": "string",      // Complete synthesized report
  "error_message": "string",     // User-friendly error message (NEW)
  "created_at": "ISO-8601",      // Session creation timestamp
  "completed_at": "ISO-8601"     // Session completion timestamp (NEW)
}
```

### Status Checks Collection

```javascript
{
  "id": "uuid-string",
  "client_name": "string",
  "timestamp": "ISO-8601"
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
| **No SQL Injection** | Motor async driver with parameterized queries |
| **Delete Confirmation** | Frontend confirmation dialog before session deletion |

---

## Key Bug Fixes & Improvements

### Version 1.1.0 (Current)

| Issue | Resolution |
|-------|------------|
| **SSE Connection Drops** | Implemented automatic reconnection with 3-second retry delay |
| **No Progress Visibility** | Added real-time progress bar (0-100%) with agent tracking |
| **Missing History View** | Created dedicated `/history` page with session list and details |
| **No Export Options** | Added Markdown and JSON export endpoints with download functionality |
| **Cryptic Error Messages** | Implemented user-friendly error parsing for budget, auth, timeout errors |
| **Session Cleanup** | Added delete endpoint with frontend confirmation dialog |
| **SSE Heartbeat Timeout** | Increased timeout handling, periodic session status checks |

### Version 1.0.0

| Issue | Resolution |
|-------|------------|
| **LLM Authentication Failure** | Configured CrewAI LLM with Emergent proxy `base_url` instead of direct OpenAI API |
| **SSE Connection Timeout** | Implemented 30-second heartbeat with graceful cleanup |
| **Pydantic Version Conflict** | Resolved dependency conflicts between CrewAI, FastAPI, and litellm |
| **Async Event Loop** | Proper thread isolation for CrewAI synchronous calls within async FastAPI |
| **MongoDB DateTime Handling** | ISO string conversion for cross-timezone compatibility |

---

## Performance Optimizations

| Optimization | Impact |
|--------------|--------|
| **Async MongoDB Operations** | Non-blocking database I/O with Motor driver |
| **Background Task Execution** | `asyncio.create_task()` for non-blocking research |
| **Thread Pool for CrewAI** | `asyncio.to_thread()` prevents event loop blocking |
| **SSE Event Queuing** | Efficient pub/sub pattern for multi-client support |
| **Selective Field Projection** | MongoDB queries exclude unnecessary fields |
| **Progress Batching** | Progress updates throttled to prevent UI flooding |
| **Heartbeat Optimization** | 30-second intervals with session status polling |

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

### Typography

| Element | Font | Weight |
|---------|------|--------|
| UI Text | IBM Plex Sans | 300-700 |
| Terminal/Code | JetBrains Mono | 400-500 |

### Animation Guidelines

- **Transitions**: Property-specific, no `transition: all`
- **Entrance**: Staggered reveals with `animation-delay`
- **Processing**: Pulse glow effect on active agents
- **Terminal Cursor**: CSS blink animation (1s step-end)
- **Progress Bar**: Smooth width transition

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
# Backend
cp backend/.env.example backend/.env
# Edit with your EMERGENT_LLM_KEY

# Frontend
cp frontend/.env.example frontend/.env
# Edit with your REACT_APP_BACKEND_URL
```

5. **Start MongoDB**
```bash
mongod --dbpath /data/db
```

6. **Start the backend**
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

7. **Start the frontend**
```bash
cd frontend
yarn start
```

8. **Access the application**
```
Dashboard: http://localhost:3000
History: http://localhost:3000/history
```

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- **Python**: Follow PEP 8, use type hints
- **JavaScript**: ESLint + Prettier configuration
- **Commits**: Conventional Commits format
- **Tests**: Include tests for new features

### Areas for Contribution

- [x] ~~Research session history page~~
- [x] ~~PDF/Markdown export functionality~~
- [x] ~~Progress indicators for research~~
- [ ] Custom agent configuration UI
- [ ] Additional LLM provider support
- [ ] Research templates feature
- [ ] PDF export (currently Markdown/JSON)
- [ ] Collaborative research (multi-user)
- [ ] Accessibility improvements

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
- **[OpenAI](https://openai.com/)** - GPT-5.2 language model
- **[Emergent](https://emergent.sh/)** - Universal LLM key infrastructure
- **[DuckDuckGo](https://duckduckgo.com/)** - Privacy-focused search API
- **[Shadcn/UI](https://ui.shadcn.com/)** - Beautiful component library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library

---

## Support

- **Documentation**: [docs.mars-research.io](https://docs.mars-research.io)
- **Issues**: [GitHub Issues](https://github.com/your-org/mars-research-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/mars-research-system/discussions)
- **Email**: support@mars-research.io

### Common Issues

| Issue | Solution |
|-------|----------|
| **Budget exceeded error** | Add more balance: Profile → Universal Key → Add Balance |
| **Authentication failed** | Verify EMERGENT_LLM_KEY in backend/.env |
| **Connection interrupted** | Check network; system auto-reconnects in 3 seconds |
| **Research stuck** | Check backend logs; may need to increase timeout |

---

## Project Info

| | |
|---|---|
| **Version** | 1.1.0 |
| **Status** | Production Ready |
| **Last Updated** | January 2026 |
| **Maintainers** | MARS Team |
| **Language** | Python, JavaScript |
| **Frameworks** | FastAPI, React, CrewAI |
| **Database** | MongoDB |
| **LLM** | GPT-5.2 via Emergent |

### Changelog

#### v1.1.0 (Current)
- Added Research History page
- Added Export (Markdown/JSON) functionality
- Added Progress indicators with percentage
- Added Session delete functionality
- Improved SSE reconnection handling
- Improved error messages for budget/auth/timeout

#### v1.0.0
- Initial release
- Three-agent architecture (Researcher, Fact-Checker, Writer)
- Real-time terminal feeds
- Sequential process workflow
- Dark mode dashboard

---

<div align="center">

**Built with AI, for better research**

[Report Bug](https://github.com/your-org/mars-research-system/issues) • [Request Feature](https://github.com/your-org/mars-research-system/issues) • [Star on GitHub](https://github.com/your-org/mars-research-system)

</div>
