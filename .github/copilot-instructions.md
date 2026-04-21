# GitHub Copilot Workspace Instructions

## What this repository is

DVT Talent AI is a full-stack AI recruiting and outreach platform.
- Backend: `backend/` — FastAPI, Celery, PostgreSQL, Redis, agent orchestration.
- Frontend: `frontend/` — Next.js 14, TypeScript, TailwindCSS.
- Infrastructure: `docker/`, `docker-compose.yml`, `docker-compose.prod.yml`.
- Docs: `README.md`, `docs/SETUP.md`, `docs/ARCHITECTURE.md`.

## Primary goals for Copilot

Help developers with:
- Backend API routes, auth, database models, and agent logic.
- Celery worker/task setup and asynchronous job flow.
- Frontend page components, API client usage, and UI styling.
- Local development commands and docker-based environment setup.
- Adding or updating docs and architecture notes.

## Key directories

- `backend/`: Python backend code, agent classes, API routes, workers, tests.
- `frontend/`: Next.js app, UI components, styles, client code.
- `docker/`: Nginx and Postgres configuration used by Docker Compose.
- `docs/`: setup and architecture guidance.

## How to run and test

Use the documented local workflow in `docs/SETUP.md`.

Quick commands:
- Backend install: `cd backend && pip install -r requirements.txt`
- Backend dev server: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- Celery worker: `cd backend && celery -A workers.celery_app worker --loglevel=info`
- Frontend dev: `cd frontend && npm install && npm run dev`
- Docker compose: `docker compose up postgres redis chromadb -d`

Tests are in `backend/tests/` and use `pytest`.

## Conventions

- Python backend targets Python 3.11.
- Frontend uses Next.js 14, TypeScript, TailwindCSS, and ShadCN-style components.
- Backend environment is configured through `backend/.env`.
- Agent orchestration and AI behavior are implemented in `backend/agents/`.
- Prefer existing docs and setup guides instead of inventing new setup steps.

## What to review first for changes

- `backend/main.py` and `backend/api/routes/` for API changes.
- `backend/agents/` for autonomous agent logic.
- `backend/workers/` for Celery and task orchestration.
- `frontend/src/app/` and `frontend/src/components/` for UI/UX work.

## When to ask questions

Ask the user when requirements are unclear, especially:
- business logic or AI prompt intent
- expected UI behavior for dashboard or campaign screens
- which external API/integration should be used
- whether a change belongs in backend, frontend, or docs

## Important links

- `README.md` — high-level project overview
- `docs/SETUP.md` — local development and deployment setup
- `docs/ARCHITECTURE.md` — system architecture and data flow
