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
│  │ Swarm    │ │Candidates│ │Campaigns │ │Analytics │ │ Settings │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
├───────┼─────────────┼────────────┼─────────────┼────────────┼────────┤
│  REST API + WebSocket  (HTTPS / JWT Auth)                             │
├──────────────────────────────────────────────────────────────────────┤
│  BACKEND API LAYER (FastAPI + Python 3.11+)                          │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Auth │ Companies │ Leads │ Candidates │ Campaigns │ Analytics│    │
│  └──────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────┤
│  AGENT ORCHESTRATOR (Pydantic AI + FastAPI BackgroundTasks)          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              Real-time Telemetry (Redis PUB/SUB)                │  │
│  └────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  AGENT LAYER — 7 Core Autonomous AI Agents (Pydantic AI)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Market IQ │ │Discovery │ │ Sourcing │ │ Outreach │ │ Analytics│  │
│  ├──────────┤ ├──────────┤ └──────────┘ └──────────┘ └──────────┘  │
│  │ Critic   │ │ Screening│                                            │
│  └──────────┘ └──────────┘                                            │
├──────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                           │
│  ┌─────────────────────┐   ┌────────────────────┐  ┌─────────────┐  │
│  │   PostgreSQL 15     │   │    ChromaDB         │  │    Redis    │  │
│  │  (Relational Data)  │   │  (Vector Search)    │  │  (Telemetry) │  │
│  └─────────────────────┘   └────────────────────┘  └─────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  EXTERNAL INTEGRATIONS                                                │
│  ┌──────────┐ ┌────────┐ ┌──────┐ ┌──────────┐ ┌───────┐ ┌──────────┐  │
│  │ OpenAI/   │ │DeepSeek│ │Serper│ │Playwright│ │ Gmail │ │  GitHub  │  │
│  │ Anthropic │ │ (LLM)  │ │ (Web)│ │(Browser) │ │ (API) │ │ (API)    │  │
│  └──────────┘ └────────┘ └──────┘ └──────────┘ └───────┘ └──────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## Agent Communication Protocol

Agents communicate through:
1. **Shared Memory** — Redis-backed shared state.
2. **Stateful Checkpoints** — PostgreSQL task persistence for Copilot pauses.
3. **Event Bus** — Real-time progress updates via Redis PUB/SUB + WebSockets.
4. **Vector Memory** — ChromaDB for semantic retrieval of past candidate matches.

## Core Pipeline Flow

### 1. Discovery Phase (Market IQ)
The **Discovery Agent** scans macroeconomic hiring signals and competitive intelligence to identify high-intent target companies and generates optimized, high-converting Job Descriptions.

### 2. Sourcing Phase (Global Search)
The **Sourcing Agent** performs multi-channel candidate discovery across GitHub, Dice, and the Web. It uses a **Logic Critic** sub-routine to audit results and prevent hallucinations.

### 3. Outreach Phase (Personalization)
The **Outreach Agent** generates dynamic micro-sites and hyper-personalized emails based on the candidate's public footprint and psychometric profile.

### 4. Screening Phase (Verification)
The **Screening Agent** (optional) runs multi-modal ranking, scoring resumes against the JD and identifying high-propensity candidates.

### 5. Analytics Phase (Intelligence)
The **Analytics Agent** closes the loop by calculating open rates, response rates, and placement velocity to continuously refine the system's prompts.

