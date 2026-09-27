# MARS - Multi-Agent Research System

<div align="center">

![MARS Logo](https://img.shields.io/badge/MARS-Multi--Agent%20Research%20System-22c55e?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMyMmM1NWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEzIDIgMyAxNCAzIDIxIDE0IDIxIDE0IDE0IDIxIDE0IDEzIDIiLz48L3N2Zz4=)

**Deep-dive research automation powered by AI agents**

[![Version](https://img.shields.io/badge/version-1.4.0-22c55e?style=flat-square)](https://github.com/ImranMatin/MARS)
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
- **No verification that cited sources actually exist and are accessible**

Researchers need a system that can autonomously gather, verify, and synthesize information while maintaining intellectual rigor and transparency.

## What We Built

**MARS** (Multi-Agent Research System) is an AI-powered research automation platform that deploys a team of specialized AI agents working in sequence:

1. **Lead Researcher** - Hunts for credible sources and compiles comprehensive findings
2. **Aggressive Fact-Checker** - Scrutinizes research for contradictions, biases, and errors
3. **Technical Writer** - Synthesizes a balanced report addressing all concerns

The system provides a **live terminal feed** showing each agent's "internal monologue" as they work, **automatic credibility scoring** for all sources, **real-time URL verification** with redirect handling, **customizable agent personalities**, **6 pre-configured research templates**, **light/dark mode**, and **5 export formats** (PDF, Markdown, JSON, DOCX, LaTeX).

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
| **CrewAI** | Open-source framework for orchestrating autonomous AI agents |
| **Sequential Process** | Workflow where agents execute in order, each feeding the next |
| **SSE (Server-Sent Events)** | Server push technology for real-time HTTP updates |
| **Agent Monologue** | Internal reasoning of an AI agent shown in terminal format |
| **Fact-Checking Gate** | Requirement that Fact-Checker finds at least one issue before Writer proceeds |
| **Emergent LLM Key** | Universal API key across OpenAI, Anthropic, Google providers |
| **Credibility Score** | 0-100 rating for each source based on domain reputation |
| **URL Verification** | Real-time HTTP check that source URLs are accessible |
| **Verified URL** | Final destination URL after following redirects |
| **Fast Mode** | Optimized mode using GPT-4o Mini for 4-5x faster research |
| **Research Template** | Pre-configured prompts for common research scenarios |
| **Custom Agent Config** | User-defined personality/expertise/goal for each agent |

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Multi-Agent Architecture** | Three specialized AI agents working in sequence |
| **Live Terminal Feeds** | Real-time visualization of each agent's reasoning |
| **Aggressive Fact-Checking** | Built-in skepticism finds at least one issue |
| **Sequential Workflow** | Structured process ensuring thorough review |

### New Features (v1.3.0)

| Feature | Description |
|---------|-------------|
| **Light/Dark Mode Toggle** | Sun/Moon toggle button, persists in localStorage |
| **Navy Blue Dark Theme** | Deep navy `#0a1428` background (not black) |
| **Real-Time URL Verification** | Parallel HTTP checks with httpx, follows redirects |
| **Custom Agent Configuration** | Tabbed dialog for defining agent personalities & expertise |
| **LaTeX Export (.tex)** | Editable academic paper format with hyperlinks |
| **Word Export (.docx)** | Editable Microsoft Word document with color-coded credibility |
| **Larger Text** | h1=text-5xl (48px), body=16px, improved readability |
| **Enhanced Animations** | Framer-motion staggered reveals, hover effects, theme transitions |
| **Verified Source Links** | Links point to `verified_url` (final destination) not original |
| **Verification Badges** | Green checkmark for accessible, red alert for broken URLs |

### v1.2.0 Features

| Feature | Description |
|---------|-------------|
| **PDF Export** | Professional PDF with color-coded credibility scores |
| **Research Templates** | 6 pre-configured templates for common scenarios |
| **Source Credibility Scoring** | Automatic 0-100 rating for each source |
| **Fast Mode** | GPT-4o Mini for 4-5x faster research (~15-20 seconds) |

### v1.1.0 Features

| Feature | Description |
|---------|-------------|
| **Research History** | Browse all past research sessions with detailed view |
| **Markdown/JSON Export** | Download completed research as `.md` or `.json` |
| **Progress Indicators** | Real-time progress bar (0-100%) |
| **Session Management** | Delete sessions with confirmation dialog |
| **SSE Reconnection** | Automatic reconnection with heartbeat monitoring |

### Custom Agent Configuration

Each of the 3 agents can be customized with:

| Field | Purpose | Example |
|-------|---------|---------|
| **Expertise** | Domain knowledge | "Quantum Physics", "Healthcare Policy" |
| **Role Title** | Agent's professional title | "Senior AI Researcher" |
| **Backstory** | Personality & background | "You are a meticulous researcher with 15 years..." |
| **Custom Goal** | Override default goal | Specific research objectives |

### Export Formats

| Format | Type | Use Case |
|--------|------|----------|
| **PDF (.pdf)** | Read-only | Presentations, sharing |
| **Markdown (.md)** | Read-only | Documentation, Git repos |
| **JSON (.json)** | Read-only | Data analysis, API integration |
| **Word (.docx)** | **Editable** | Continue writing, collaborate |
| **LaTeX (.tex)** | **Editable** | Academic papers, journals |

### Research Templates

| Template | Use Case |
|----------|----------|
| **Market Analysis** | Market landscape and competitor analysis |
| **Technical Deep Dive** | In-depth analysis of emerging technologies |
| **Scientific Review** | Academic literature review |
| **Policy Analysis** | Government policy impact review |
| **Trend Forecast** | Emerging trends and future predictions |
| **Competitive Intelligence** | Company/product competitive positioning |

### Credibility Scoring System

Sources are automatically scored 0-100 based on:

| Score Range | Level | Indicators |
|-------------|-------|------------|
| **80-100** | High | nature.com, science.org, .edu, .gov, ieee.org, arxiv.org |
| **60-79** | Medium | .org domains, reputable news outlets, HTTPS |
| **40-59** | Low | General web sources, standard TLDs |
| **0-39** | Very Low | Blogs, wordpress, personal sites, non-HTTPS |

### URL Verification System

Each source URL is verified in real-time:

- **HEAD request** first (faster), falls back to GET on 405/5xx
- **Follows redirects** up to 5 hops using `httpx.AsyncClient(follow_redirects=True)`
- **Parallel verification** using `asyncio.gather()` for all sources
- **8-second timeout** per URL
- **Auto re-scoring** if redirect leads to a different domain
- Returns `verified` (bool), `verified_url` (final URL), `status_code` (int)

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Tailwind CSS** | Utility-first styling with theme variables |
| **Framer Motion** | Animations and transitions |
| **Shadcn/UI** | Component library (Dialog, Tabs, etc.) |
| **Lucide React** | Icon system |
| **Sonner** | Toast notifications |
| **React Router** | Page navigation |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Python web framework |
| **CrewAI** | Multi-agent orchestration |
| **Motor** | Async MongoDB driver |
| **httpx** | Async HTTP client for URL verification |
| **DuckDuckGo Search** | Web search tool |
| **Pydantic** | Data validation |
| **ReportLab** | PDF generation |
| **python-docx** | Word document generation |

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
│   ├── server.py              # FastAPI + CrewAI + Verification + Exports
│   ├── requirements.txt       # Includes reportlab, python-docx, httpx
│   ├── tests/
│   │   ├── test_new_features.py       # v1.3 features tests
│   │   └── test_research_features.py  # v1.2 features tests
│   └── .env                   # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── App.js             # Dashboard, History, Templates, Theme
│   │   ├── App.css            # Custom styles
│   │   ├── index.css          # Navy blue theme + light mode variables
│   │   └── components/
│   │       └── ui/            # Shadcn UI (Dialog, Tabs, etc.)
│   ├── public/
│   ├── package.json           # Includes framer-motion
│   └── .env
│
├── memory/
│   └── PRD.md
│
├── test_reports/              # Testing agent reports
│
└── README.md
```

---

## Backend Architecture

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                   │
│                   React Dashboard (Light/Dark)                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────┐             │
│  │Dashboard  │ │ Custom    │ │  History  │ │  Export    │             │
│  │+Templates │ │ Agents    │ │(/history) │ │(5 formats) │             │
│  └───────────┘ └───────────┘ └───────────┘ └────────────┘             │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                    HTTP/SSE     │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           FASTAPI BACKEND                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        API ROUTER (/api)                         │   │
│  │  POST /research/start (+ custom agent configs)                  │   │
│  │  GET /templates                                                  │   │
│  │  GET /research/stream/{id}   GET /research/{id}                 │   │
│  │  GET /research               DELETE /research/{id}              │   │
│  │  GET /research/{id}/export/pdf                                  │   │
│  │  GET /research/{id}/export/markdown                             │   │
│  │  GET /research/{id}/export/json                                 │   │
│  │  GET /research/{id}/export/docx    ← EDITABLE (NEW)             │   │
│  │  GET /research/{id}/export/latex   ← EDITABLE (NEW)             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │       CREWAI + CREDIBILITY + URL VERIFICATION + EXPORTS         │   │
│  │                                                                   │   │
│  │   ┌──────────┐      ┌──────────┐      ┌──────────┐              │   │
│  │   │Researcher│ ───▶ │Fact-Check│ ───▶ │  Writer  │              │   │
│  │   │(Custom)  │      │(Custom)  │      │(Custom)  │              │   │
│  │   └──────────┘      └──────────┘      └──────────┘              │   │
│  │         │                                     │                   │   │
│  │         ▼                                     ▼                   │   │
│  │   ┌──────────┐                        ┌──────────────┐            │   │
│  │   │DuckDuckGo│                        │URL Extraction│            │   │
│  │   │  Search  │                        │(md links +   │            │   │
│  │   └──────────┘                        │ plain URLs)  │            │   │
│  │                                        └──────┬───────┘           │   │
│  │                                               ▼                   │   │
│  │                                        ┌──────────────┐           │   │
│  │                                        │  Credibility │           │   │
│  │                                        │   Scoring    │           │   │
│  │                                        └──────┬───────┘           │   │
│  │                                               ▼                   │   │
│  │                                        ┌──────────────┐           │   │
│  │                                        │httpx Parallel│           │   │
│  │                                        │Verification  │           │   │
│  │                                        │(w/ redirects)│           │   │
│  │                                        └──────────────┘           │   │
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
| POST | `/api/auth/register` | Register with email + password + name (NEW) |
| POST | `/api/auth/login` | Login with email + password (NEW) |
| POST | `/api/auth/logout` | Logout - clears cookies (NEW) |
| GET | `/api/auth/me` | Get current authenticated user (NEW) |
| POST | `/api/auth/refresh` | Refresh access token from refresh cookie (NEW) |
| POST | `/api/auth/forgot-password` | Send password reset email (NEW) |
| POST | `/api/auth/reset-password` | Reset password with email token (NEW) |
| GET | `/api/templates` | Get 6 research templates |
| POST | `/api/research/start` | Start research (optional custom agent configs) |
| GET | `/api/research/stream/{id}` | SSE stream for real-time updates |
| GET | `/api/research/{id}` | Get session details |
| GET | `/api/research` | List all sessions |
| DELETE | `/api/research/{id}` | Delete a session |
| GET | `/api/research/{id}/export/pdf` | Export as PDF |
| GET | `/api/research/{id}/export/markdown` | Export as Markdown |
| GET | `/api/research/{id}/export/json` | Export as JSON |
| GET | `/api/research/{id}/export/docx` | **Editable Word document (NEW)** |
| GET | `/api/research/{id}/export/latex` | **Editable LaTeX paper (NEW)** |

### Custom Agent Configuration Request

```json
POST /api/research/start
{
  "topic": "Advances in quantum computing",
  "fast_mode": true,
  "researcher_config": {
    "expertise": "Quantum Physics",
    "role": "Quantum Research Scientist",
    "backstory": "Optional personality description...",
    "goal": "Optional custom goal..."
  },
  "fact_checker_config": {
    "expertise": "Physics"
  },
  "writer_config": {
    "expertise": "Scientific Writing"
  }
}
```

---

## Database Schema

### Research Sessions Collection

```javascript
{
  "id": "uuid-string",
  "topic": "string",
  "status": "string",              // pending | researching | completed | error
  "progress": 0-100,
  "current_agent": "string",
  "researcher_output": "string",
  "fact_checker_output": "string",
  "writer_output": "string",
  "contradictions_found": ["string"],
  "sources": [                      // Enhanced with verification (NEW)
    {
      "url": "https://example.com",
      "title": "string or null",
      "credibility_score": 85,
      "credibility_level": "high",
      "reasons": ["Trusted source: nature.com", "HTTPS enabled"],
      "verified": true,             // NEW: HTTP accessible
      "verified_url": "https://example.com/final-page",  // NEW: after redirects
      "status_code": 200            // NEW: HTTP status
    }
  ],
  "credibility_score": 78.5,
  "final_report": "string",
  "error_message": "string",
  "created_at": "ISO-8601",
  "completed_at": "ISO-8601"
}
```

---

## Security Features

| Feature | Implementation |
|---------|----------------|
| **CORS Protection** | Configurable origins via environment variable |
| **Input Validation** | Pydantic models for all requests including AgentConfig |
| **Environment Secrets** | API keys stored in `.env`, never hardcoded |
| **MongoDB ObjectId Exclusion** | `_id` excluded from all API responses |
| **Error Sanitization** | Internal errors logged, user-friendly to clients |
| **XSS Prevention** | HTML entities escaped in PDF generation |
| **LaTeX Escape** | Special LaTeX chars (`%`, `$`, `&`, etc.) escaped |
| **URL Sanitization** | Special characters escaped in exports |
| **URL Bot Identity** | Custom User-Agent for verification requests |
| **Verification Timeout** | 8-second timeout prevents hanging on slow URLs |
| **Delete Confirmation** | Frontend confirmation dialog |

---

## Key Bug Fixes & Improvements

### Version 1.3.0 (Current)

| Issue | Resolution |
|-------|------------|
| **Broken Source Links (BUG)** | Real-time URL verification with httpx; links use `verified_url` (final URL after redirects) |
| **URL Extraction Missed Markdown Links** | Regex now handles `[title](url)` AND plain URLs, extracts both |
| **No Dark/Light Toggle** | Added Sun/Moon toggle with localStorage persistence |
| **Background Too Dark/Generic** | Changed to distinctive navy blue `#0a1428` |
| **Text Too Small** | Increased to h1=text-5xl (48px), body=16px |
| **Weak Animations** | Added framer-motion staggered reveals, hover effects, theme transitions |
| **No Editable Exports** | Added `.docx` (python-docx) and `.tex` (LaTeX) formats |
| **No Custom Agents** | Added AgentConfig with expertise/role/backstory/goal fields via tabbed dialog |
| **Hard-Coded Agent Personas** | Agents accept optional custom config, fall back to defaults |

### Version 1.2.0

| Issue | Resolution |
|-------|------------|
| **Research Too Slow (~90s)** | Fast Mode with GPT-4o Mini (~15-20s, 4-5x faster) |
| **No PDF Export** | Implemented with reportlab and color-coded credibility |
| **No Template Presets** | Added 6 pre-configured research templates |
| **No Source Validation** | Automatic credibility scoring (0-100) |
| **PDF Parse Errors** | Added XML escaping and markdown-to-HTML conversion |

### Version 1.1.0

| Issue | Resolution |
|-------|------------|
| **SSE Connection Drops** | Automatic reconnection with 3-second retry |
| **No Progress Visibility** | Real-time progress bar (0-100%) |
| **Missing History View** | Created dedicated `/history` page |
| **No Export Options** | Added Markdown and JSON exports |
| **Cryptic Errors** | User-friendly error parsing |

### Version 1.0.0

| Issue | Resolution |
|-------|------------|
| **LLM Authentication Failure** | CrewAI LLM with Emergent proxy `base_url` |
| **SSE Connection Timeout** | 30-second heartbeat implementation |
| **Async Event Loop** | Thread isolation for CrewAI |

---

## Performance Optimizations

### URL Verification (v1.3.0)

| Optimization | Impact |
|--------------|--------|
| **Parallel Verification** | All URLs checked concurrently via `asyncio.gather()` |
| **HEAD Before GET** | Faster verification; only falls back on 405/5xx |
| **8-Second Timeout** | Prevents hanging on unresponsive URLs |
| **Bot User-Agent** | Reduces likelihood of being blocked |
| **Follow Redirects** | Up to 5 redirects tracked |

### Speed Optimizations (v1.2.0)

| Optimization | Impact |
|--------------|--------|
| **GPT-4o Mini in Fast Mode** | ~4-5x faster inference (15-20s) |
| **Reduced max_tokens** | 1500 vs 2500 in fast mode |
| **Lower temperature (0.5)** | More focused responses |
| **max_iter=2 on agents** | Prevents unnecessary iterations |
| **Reduced verbosity** | No verbose CrewAI logging |

### General Performance

| Optimization | Impact |
|--------------|--------|
| **Async MongoDB** | Non-blocking database I/O with Motor |
| **Background Tasks** | `asyncio.create_task()` for research |
| **Thread Pool for CrewAI** | `asyncio.to_thread()` prevents blocking |
| **SSE Event Queuing** | Efficient pub/sub pattern |
| **CSS Variables** | Fast theme switching without repaints |

---

## Design System

### Theme Colors

#### Dark Mode (Navy Blue)
| Variable | Hex | Usage |
|----------|-----|-------|
| `--background-1` | `#0a1428` | Main app background (deep navy) |
| `--surface-1` | `#142244` | Cards and elevated surfaces |
| `--surface-2` | `#1e2f5c` | Higher elevation |
| `--terminal-bg` | `#050b1a` | Terminal feeds (darker navy) |
| `--border-1` | `#1e3562` | Standard borders |
| `--foreground-1` | `#f0f4ff` | Primary text (blue-tinted white) |
| `--muted-1` | `#a3b0cc` | Secondary text |

#### Light Mode
| Variable | Hex | Usage |
|----------|-----|-------|
| `--background-1` | `#f8fafc` | Main app background |
| `--surface-1` | `#ffffff` | Cards and elevated surfaces |
| `--terminal-bg` | `#1e293b` | Terminal (kept dark for readability) |
| `--foreground-1` | `#0f172a` | Primary text (very dark navy) |
| `--muted-1` | `#64748b` | Secondary text |

### Agent Colors (Both Themes)
| Agent | Color |
|-------|-------|
| Researcher | `#0ea5e9` (Sky Blue) |
| Fact-Checker | `#f97316` (Orange) |
| Writer | `#10b981` (Emerald) |

### Typography

| Element | Size | Font |
|---------|------|------|
| H1 | text-5xl (48px) | IBM Plex Sans, 700 |
| H2 | text-2xl | IBM Plex Sans, 600 |
| Body | text-base (16px) | IBM Plex Sans, 400 |
| Terminal | text-sm mono | JetBrains Mono |

### Animations

- **Card entry**: Staggered fade + translateY (framer-motion)
- **Theme toggle**: Rotate + scale on hover, sun/moon crossfade
- **Agent card hover**: Lift -4px with shadow
- **Templates**: Delayed reveal on load
- **Progress bar**: Smooth width transition
- **Terminal cursor**: Blink animation
- **Beam effect**: Traces horizontally on active agents

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
- Emergent LLM Key

### Installation

```bash
# Clone
git clone https://github.com/your-org/mars-research-system.git
cd mars-research-system

# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd ../frontend && yarn install

# Configure .env files with your keys

# Start services
cd backend && uvicorn server:app --host 0.0.0.0 --port 8001 --reload
cd frontend && yarn start
```

### Usage Guide

1. **Choose a template** or type a custom research topic
2. **Toggle Fast Mode** for 4-5x faster results
3. **(Optional) Customize Agents** - Click "Customize Agents" button
   - Set expertise (e.g., "Healthcare", "AI/ML")
   - Optionally define role, backstory, and custom goal per agent
4. **Toggle Light/Dark** via the Sun/Moon icon (top-right)
5. **Start Research** - Watch live terminal feeds
6. **Review Results** - See verified sources with credibility badges
7. **Export** - Choose from 5 formats:
   - PDF, Markdown, JSON (read-only)
   - Word (.docx), LaTeX (.tex) (editable)
8. **Access History** at `/history`

---

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push and open a Pull Request

### Areas for Contribution

- [x] ~~Research session history page~~
- [x] ~~Markdown/JSON export~~
- [x] ~~PDF export~~
- [x] ~~Progress indicators~~
- [x] ~~Research templates~~
- [x] ~~Source credibility scoring~~
- [x] ~~Real-time URL verification~~
- [x] ~~LaTeX & Word exports~~
- [x] ~~Custom agent configuration~~
- [x] ~~Light/Dark mode~~
- [ ] Refactor server.py into modular structure (routes/, services/, exporters/)
- [ ] Migrate FastAPI `on_event` to lifespan handler
- [ ] Real-time collaboration (multi-user sessions)
- [ ] Voice input for research topics
- [ ] Advanced credibility scoring with ML models
- [ ] Additional LLM provider support

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 MARS Research System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## Acknowledgement

- **[CrewAI](https://crewai.com/)** - Multi-agent orchestration
- **[OpenAI](https://openai.com/)** - GPT-5.2 and GPT-4o Mini
- **[Emergent](https://emergent.sh/)** - Universal LLM key infrastructure
- **[DuckDuckGo](https://duckduckgo.com/)** - Privacy-focused search API
- **[Shadcn/UI](https://ui.shadcn.com/)** - Beautiful component library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[ReportLab](https://www.reportlab.com/)** - PDF generation
- **[python-docx](https://python-docx.readthedocs.io/)** - Word document generation
- **[httpx](https://www.python-httpx.org/)** - Async HTTP client
- **[Lucide](https://lucide.dev/)** - Beautiful open-source icons

---

## Support

- **Documentation**: [docs.mars-research.io](https://docs.mars-research.io)
- **Issues**: [GitHub Issues](https://github.com/your-org/mars-research-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/mars-research-system/discussions)
- **Email**: support@mars-research.io

### Common Issues

| Issue | Solution |
|-------|----------|
| **Budget exceeded** | Profile → Universal Key → Add Balance |
| **Authentication failed** | Verify `EMERGENT_LLM_KEY` in backend/.env |
| **Connection interrupted** | System auto-reconnects in 3 seconds |
| **Research stuck** | Enable Fast Mode toggle |
| **Sources showing 403/404** | LLM hallucinated URLs - verification correctly detects this |
| **PDF generation fails** | Check logs; sanitizer handles most cases |
| **LaTeX won't compile** | Ensure `\usepackage{hyperref}` is available |
| **DOCX opens but formatting off** | Requires Word 2010+ or LibreOffice 6+ |
| **Theme not persisting** | Check localStorage isn't disabled in browser |

---

## Project Info

| | |
|---|---|
| **Version** | 1.4.0 |
| **Status** | Production Ready |
| **Last Updated** | February 2026 |
| **Maintainers** | ImranMatin |
| **Language** | Python, JavaScript |
| **Frameworks** | FastAPI, React, CrewAI |
| **Database** | MongoDB |
| **Auth** | JWT (httpOnly cookies) + bcrypt |
| **Email** | Resend (Emergent-managed) |
| **LLM** | GPT-5.2 / GPT-4o Mini via Emergent |

### Changelog

#### v1.4.0 (Current)
- Added public Landing page with Vision, Mission, Features, and CTA sections
- Added JWT-based custom authentication (register/login/logout)
- Added Forgot Password flow with 1-hour email reset tokens via Resend
- Added protected routes (/dashboard and /history require auth)
- Added per-user session scoping (users only see their own research)
- Added Admin role (admin@mars.ai) for viewing all sessions
- Added brute-force protection (5 failed logins = 15 min lockout)
- Added User Menu with logout in dashboard header
- Security hardening: all research/export/stream endpoints require auth + ownership

#### v1.3.0
- **[BUG FIX]** Sources now link to verified/accessible URLs after redirect resolution
- Added real-time URL verification with parallel httpx requests
- Added light/dark mode toggle with navy blue dark theme (`#0a1428`)
- Added Custom Agent Configuration with tabbed UI (expertise, role, backstory, goal)
- Added Word (.docx) export - editable in Microsoft Word/LibreOffice
- Added LaTeX (.tex) export - editable academic paper format
- Increased text sizes throughout (h1=text-5xl, body=16px)
- Enhanced animations with framer-motion (staggered, hover, theme transitions)
- Verified source badges (green check / red alert) based on HTTP status

#### v1.2.0
- Added PDF export with color-coded credibility scores
- Added 6 research templates
- Added automatic source credibility scoring (0-100)
- Added Fast Mode toggle for 4-5x faster research

#### v1.1.0
- Added Research History page (`/history`)
- Added Markdown and JSON export
- Added progress indicators with percentage
- Added session delete functionality
- Improved SSE reconnection handling

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
