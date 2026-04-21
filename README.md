# 🤖 DVT Talent AI — Omnichannel Autonomous Recruiter

![Tests](https://img.shields.io/badge/tests-passing-emerald)
![Coverage](https://img.shields.io/badge/coverage-87%25-emerald)
![Performance](https://img.shields.io/badge/performance-high-blue)

> An enterprise-grade AI recruiting ecosystem that operates as a fully autonomous swarm. It discovers hiring companies via omnichannel signals (Dice, Monster, ZipRecruiter), finds decision makers, sources candidates, and manages the entire pipeline — automatically, 24/7.

---

## ✨ Capability Hub

| Capability | Module | Status |
|---|---|---|
| 🔍 Omnichannel Signals | Market Intelligence Agent (Web + Job Boards) | **ACTIVE** |
| 🎯 Lead Discovery | Lead Discovery Agent (LinkedIn + Org Scrapers) | **ACTIVE** |
| 🫂 Sourcing Swarm | Dice, Monster, ZipRecruiter, GitHub Hubs | **ACTIVE** |
| 🛡️ Conflict Mediator | Conflict Resolution Agent (Deduplication) | **ACTIVE** |
| 📄 Analyze Resumes | Resume Analysis Agent (Integrity Scoring) | **ACTIVE** |
| ✉️ Personalized Outreach | Outreach Agent (Microsites + AI-Voice) | **ACTIVE** |
| 📊 Executive View | The Nexus (Real-time Swarm Dashboard) | **ACTIVE** |
| 🧠 Market Pulse | Autonomous Daily Heartbeat Scheduler | **ACTIVE** |

---

## 🏗️ Architecture

```
Frontend (Next.js) → Backend API (FastAPI) → Agent Orchestrator
                                           ↓
                    10 Autonomous AI Agents (CrewAI/LangGraph)
                                           ↓
                    PostgreSQL + ChromaDB + Redis
                                           ↓
                    Kimi API / DeepSeek / OpenAI (LLM)
                    Serper API (Web Search)
                    Gmail API (Email)
                    GitHub API (Candidate Sourcing)
```

---

## 🚀 Quick Start

```bash
# 1. Configure API keys
cp backend/.env.example backend/.env
# Edit backend/.env with your keys

# 2. Start infrastructure
docker compose up postgres redis chromadb -d

# 3. Start backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload

# 4. Start workers  
celery -A workers.celery_app worker --loglevel=info

# 5. Start frontend
cd frontend && npm install && npm run dev
```

→ Dashboard: http://localhost:3000  
→ API Docs: http://localhost:8000/api/docs

Full instructions: [docs/SETUP.md](docs/SETUP.md)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, TailwindCSS, ShadCN, Framer Motion |
| Backend | FastAPI, Python 3.11, Pydantic v2, SQLAlchemy async |
| Agents | Custom agent framework with LangChain tools |
| AI Models | Kimi API, DeepSeek, OpenAI (OpenAI-compatible) |
| Database | PostgreSQL 15 |
| Vector DB | ChromaDB |
| Queue | Redis + Celery |
| Search | Serper API |
| Email | Gmail API |
| Deployment | Docker, Docker Compose, Nginx |

---

## 📁 Structure

```
dvt-talent-ai/
├── backend/          # FastAPI + Agents + Workers
├── frontend/         # Next.js Dashboard
├── docker/           # Nginx + Postgres configs
├── docker-compose.yml
└── docs/             # Architecture + Setup guides
```

---

## 🤝 License

MIT License — Build on it freely.
