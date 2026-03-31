# 🤖 DVT Talent AI — Autonomous Recruiting & Sales Platform

> An enterprise-grade AI SaaS platform that operates as a fully autonomous recruiting company. It discovers hiring companies, finds decision makers, sources candidates, scores resumes, sends personalized outreach, and manages the entire pipeline — automatically, 24/7.

---

## ✨ What It Does

| Capability | How |
|---|---|
| 🔍 Find hiring companies | Market Intelligence Agent scans web for hiring signals |
| 🎯 Identify decision makers | Lead Discovery Agent finds VPs of Engineering, HR Directors |
| 👥 Source candidates | GitHub API, LinkedIn signals, Dice, Monster, Stack Overflow |
| 📄 Analyze resumes | AI scores resumes 0–100 against job descriptions |
| ✉️ Send personalized outreach | GPT-quality emails written and sent automatically |
| 📋 Manage pipelines | CRM Management Agent tracks lead and candidate stages |
| 📅 Schedule interviews | Interview Scheduling Agent books calendar slots |
| 📊 Track analytics | Dashboard with open rates, funnel metrics, placement rates |
| 🧠 Self-improve | Learning Agent optimizes prompts based on performance |

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
