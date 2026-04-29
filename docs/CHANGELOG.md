# DVT Talent AI — Changelog

All notable changes to the DVT Talent AI recruitment swarm will be documented in this file.

## [1.1.0] — 2026-04-29
### Hardening: Pydantic AI & Native Swarm Orchestration

This release focuses on platform stability, modernized agent architecture, and "last mile" fixes for the Elite Pilot Workspace.

### 🚀 Swarm Modernization
- **Pydantic AI Migration**: Successfully migrated the core 7-agent roster (Discovery, Sourcing, Outreach, Analytics, Screening, Market IQ, Critic) to the Pydantic AI framework for enhanced type-safety and structured data handling.
- **Native Task Orchestration**: Transitioned the Full Swarm protocol from Celery to native **FastAPI BackgroundTasks**. This eliminates Redis/Celery overhead for pilot demonstrations and ensures instant execution.
- **Agent Resilience**: Implemented automated error handling and graceful fallbacks for agent tools and LLM providers.

### 🛡️ Database & Auth Hardening
- **Schema Repair**: Resolved `UNIQUE constraint` conflicts in the `Candidate` model, enabling multi-tenant lead scaling.
- **Identity Synthesis**: Enhanced the JWT payload with `tenant_id` to ensure secure WebSocket telemetry routing.
- **Audit Logging**: Verified system-wide audit logging for all agent-driven mutations.

### 🌐 Connectivity & UI
- **IPv4 Stability Standard**: Standardized all internal and external communication to use explicit IPv4 (`127.0.0.1`) to resolve Windows-specific `localhost` resolution issues.
- **Telemetry Stream Fix**: Repaired the WebSocket handshake protocol to ensure the "Neural Log" stream correctly displays real-time agent activity.
- **Talent Grid Export**: Fixed route shadowing issues to enable high-fidelity CSV exports of candidate dossiers.

### 🛠️ Developer Experience
- **Consolidated Documentation**: Updated `ARCHITECTURE.md` and `SETUP.md` to reflect the new leaner infrastructure.
- **Simplified Setup**: Removed mandatory Celery dependency for local swarm testing, reducing dev-env complexity.

---

## [1.0.0] — 2026-04-10
### Initial Release: The Autonomous Swarm

This release marks the transition from static recruitment tools to a fully autonomous, event-driven intelligence swarm.

### 🚀 Core Intelligence
- **Async DAG Orchestrator**: High-parallel execution of discovery and synthesis cycles.
- **Agent Roster**: 7 specialized agents (Market Intelligence, Lead Discovery, Conflict Mediator, Integrity Scorer, Voice Synth, etc.).
- **Reactive Fabric**: Redis-powered Shared Memory and Event Bus for inter-agent communication.

### 🎭 Experience & Monitoring
- **The Nexus Dashboard**: Real-time WebSocket telemetry stream (60FPS).
- **Deep Synthesis Views**: High-fidelity dossiers for candidates and leads with integrity scorecard visualization.
- **Naturalist Design System**: Premium Sage/Cream aesthetic with WCAG AA accessibility enforcement.

### 🛡️ Enterprise Governance
- **Multi-Tenancy**: Hardened database isolation using PostgreSQL RLS (Row-Level Security).
- **Audit Logs**: Verifiable timeline of all system mutations and security events.
- **Ethical Guardrails**: Automated linguistic bias detection in outreach composers.

### 🛰️ Omnichannel Connectivity
- **Sourcing Hub**: Native integrations with ZipRecruiter, Monster, and Dice.
- **Swarm Trigger**: One-click global discovery for specific high-growth sectors.
