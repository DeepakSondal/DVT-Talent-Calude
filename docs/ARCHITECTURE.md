# DVT Talent AI — System Architecture

## Overview

DVT Talent AI is a fully autonomous AI-powered recruiting & sales SaaS platform.
It operates as a virtual recruiting agency, discovering companies, finding candidates,
sending outreach, and managing pipelines — all without manual intervention.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        DVT TALENT AI PLATFORM                         │
├──────────────────────────────────────────────────────────────────────┤
│  FRONTEND (Next.js + TypeScript + TailwindCSS + ShadCN)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Pipeline │ │Candidates│ │Campaigns │ │Analytics │ │ Settings │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
├───────┼─────────────┼────────────┼─────────────┼────────────┼────────┤
│  REST API + WebSocket  (HTTPS / JWT Auth)                             │
├──────────────────────────────────────────────────────────────────────┤
│  BACKEND API LAYER (FastAPI + Python 3.11)                           │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Auth │ Companies │ Leads │ Candidates │ Campaigns │ Analytics│    │
│  └──────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────┤
│  AGENT ORCHESTRATOR (CrewAI + LangGraph)                             │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              Task Queue (Redis + Celery)                        │  │
│  └────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  AGENT LAYER — 10 Autonomous AI Agents                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Market  │ │   Lead   │ │ Company  │ │Candidate │ │  Resume  │  │
│  │Intel.    │ │Discovery │ │Research  │ │Sourcing  │ │Analysis  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Outreach │ │Interview │ │   CRM    │ │Analytics │ │Learning  │  │
│  │  Agent   │ │Scheduling│ │Management│ │  Agent   │ │  Agent   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                           │
│  ┌─────────────────────┐   ┌────────────────────┐  ┌─────────────┐  │
│  │   PostgreSQL 15     │   │    ChromaDB         │  │    Redis    │  │
│  │  (Relational Data)  │   │  (Vector Search)    │  │  (Cache +   │  │
│  │                     │   │                     │  │   Queue)    │  │
│  └─────────────────────┘   └────────────────────┘  └─────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  EXTERNAL INTEGRATIONS                                                │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌──────────┐ ┌───────┐ ┌──────────┐  │
│  │ Kimi │ │DeepSeek│ │Serper│ │  Apify   │ │ Gmail │ │  GitHub  │  │
│  │  API │ │  API   │ │  API │ │(Scraping)│ │  API  │ │   API    │  │
│  └──────┘ └────────┘ └──────┘ └──────────┘ └───────┘ └──────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## Agent Communication Protocol

Agents communicate through:
1. **Shared Memory** — Redis-backed shared state
2. **Structured Tasks** — Pydantic task models passed via queue
3. **Event Bus** — PostgreSQL NOTIFY + async listeners
4. **Vector Memory** — ChromaDB for semantic retrieval

## Data Flow

```
Daily Scheduler → Market Intelligence Agent → finds 50+ hiring companies
                ↓
              Lead Discovery Agent → finds decision makers for each company
                ↓
              Company Research Agent → deep dives into each company
                ↓
              Candidate Sourcing Agent → finds 10+ candidates per role
                ↓
              Resume Analysis Agent → scores & ranks all candidates
                ↓
              Outreach Agent → writes & sends personalized emails
                ↓
              CRM Management Agent → updates pipeline states
                ↓
              Analytics Agent → calculates performance metrics
                ↓
              Learning Agent → improves prompts based on open rates
```
