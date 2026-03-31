# DVT Talent AI — Complete Setup & Deployment Guide

## Prerequisites

- Docker 24+ & Docker Compose v2
- Node.js 20+
- Python 3.11+
- Git

---

## 🚀 Local Development Setup (15 minutes)

### 1. Clone & Configure

```bash
git clone https://github.com/yourorg/dvt-talent-ai.git
cd dvt-talent-ai

# Copy environment files
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in your API keys:
```env
# Required — at least one LLM key
KIMI_API_KEY=sk-...         # OR
DEEPSEEK_API_KEY=sk-...     # OR
OPENAI_API_KEY=sk-...

# Required for web search
SERPER_API_KEY=...

# Optional but recommended
GITHUB_TOKEN=ghp_...
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
GMAIL_SENDER_EMAIL=you@gmail.com
APIFY_API_KEY=...
```

### 2. Start Infrastructure (Docker)

```bash
# Start postgres, redis, chromadb only
docker compose up postgres redis chromadb -d

# Wait for health checks
docker compose ps
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (creates all tables)
python -c "
import asyncio
from db.models import Base, engine

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('✅ Database tables created')

asyncio.run(init())
"

# Start API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API is now running at: http://localhost:8000
Swagger docs: http://localhost:8000/api/docs

### 4. Start Celery Workers (New Terminal)

```bash
cd backend
source venv/bin/activate

# Worker (executes agent tasks)
celery -A workers.celery_app worker --loglevel=info --concurrency=4

# In another terminal — Beat scheduler (autonomous daily tasks)
celery -A workers.celery_app beat --loglevel=info
```

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev
```

Frontend is now running at: http://localhost:3000

### 6. Create First Admin User

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dvt.ai",
    "password": "password123",
    "full_name": "Admin User"
  }'
```

---

## 🐳 Full Docker Deployment (Production)

### 1. Configure Production Environment

```bash
# Copy and edit env file
cp backend/.env.example backend/.env
nano backend/.env

# Update these for production:
# APP_ENV=production
# SECRET_KEY=<generate with: openssl rand -hex 32>
# DATABASE_URL=postgresql+asyncpg://dvt_user:STRONG_PASSWORD@postgres:5432/dvt_talent
```

### 2. SSL Certificates

```bash
mkdir -p docker/nginx/ssl

# Option A: Self-signed (dev/staging)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/key.pem \
  -out docker/nginx/ssl/cert.pem \
  -subj "/CN=yourdomain.com"

# Option B: Let's Encrypt (production)
# certbot certonly --standalone -d yourdomain.com
# cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/nginx/ssl/cert.pem
# cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/nginx/ssl/key.pem
```

### 3. Build & Start All Services

```bash
# Build all images
docker compose build --no-cache

# Start everything
docker compose up -d

# Monitor startup
docker compose logs -f

# Check all services are healthy
docker compose ps
```

### Expected output:
```
NAME             STATUS
dvt-frontend     Up (healthy)
dvt-api          Up (healthy)
dvt-worker-1     Up (healthy)
dvt-worker-2     Up (healthy)
dvt-scheduler    Up
dvt-postgres     Up (healthy)
dvt-redis        Up (healthy)
dvt-chromadb     Up (healthy)
dvt-nginx        Up
```

### 4. Initialize Database

```bash
docker compose exec api python -c "
import asyncio
from db.models import Base, engine

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Database initialized')

asyncio.run(init())
"
```

### 5. Create Admin User

```bash
curl -X POST https://yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"STRONG_PASSWORD","full_name":"Admin"}'
```

---

## ☁️ Cloud Deployment

### AWS ECS / Fargate

```bash
# Install AWS CLI and configure
aws configure

# Create ECR repositories
aws ecr create-repository --repository-name dvt-talent-ai/api
aws ecr create-repository --repository-name dvt-talent-ai/frontend
aws ecr create-repository --repository-name dvt-talent-ai/worker

# Build and push images
AWS_ACCOUNT=123456789
REGION=us-east-1
ECR_BASE=$AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com

aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_BASE

# Build
docker build -t dvt-talent-ai/api --target api ./backend
docker build -t dvt-talent-ai/frontend ./frontend

# Tag & push
docker tag dvt-talent-ai/api $ECR_BASE/dvt-talent-ai/api:latest
docker push $ECR_BASE/dvt-talent-ai/api:latest
```

Use the provided `docker-compose.yml` as reference for ECS task definitions.
For RDS (PostgreSQL), ElastiCache (Redis), and managed ChromaDB, update env vars.

### DigitalOcean App Platform

```bash
# Install doctl
doctl auth init

# Deploy as App Platform
doctl apps create --spec digitalocean-app.yaml
```

### Google Cloud Run

```bash
# Build and deploy API
gcloud builds submit --tag gcr.io/PROJECT_ID/dvt-api ./backend
gcloud run deploy dvt-api --image gcr.io/PROJECT_ID/dvt-api --platform managed --region us-central1

# Build and deploy Frontend  
gcloud builds submit --tag gcr.io/PROJECT_ID/dvt-frontend ./frontend
gcloud run deploy dvt-frontend --image gcr.io/PROJECT_ID/dvt-frontend --platform managed
```

---

## 🔧 Common Operations

### View Logs
```bash
docker compose logs api -f          # API logs
docker compose logs worker -f       # Agent worker logs
docker compose logs scheduler -f    # Beat scheduler logs
```

### Scale Workers
```bash
docker compose up --scale worker=4 -d
```

### Trigger Full Pipeline Manually
```bash
curl -X POST http://localhost:8000/api/v1/agents/run-full-pipeline \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Trigger Single Agent
```bash
curl -X POST http://localhost:8000/api/v1/agents/trigger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agent": "market_intelligence", "params": {"industry": "fintech"}}'
```

### Database Backup
```bash
docker compose exec postgres pg_dump -U dvt_user dvt_talent > backup_$(date +%Y%m%d).sql
```

### Reset Everything
```bash
docker compose down -v    # WARNING: Deletes all data
docker compose up -d
```

---

## 📊 Monitoring

- **API Health**: http://localhost:8000/health
- **API Metrics** (Prometheus): http://localhost:8000/metrics
- **Celery Monitor** (Flower): 
  ```bash
  docker run -p 5555:5555 --network dvt-net mher/flower \
    celery --broker=redis://redis:6379/1 flower
  ```
  Then visit: http://localhost:5555

---

## 🔑 API Keys — Where to Get Them

| Key | Source | Cost |
|-----|--------|------|
| `KIMI_API_KEY` | https://platform.moonshot.cn | Pay-per-use |
| `DEEPSEEK_API_KEY` | https://platform.deepseek.com | Very cheap |
| `OPENAI_API_KEY` | https://platform.openai.com | Pay-per-use |
| `SERPER_API_KEY` | https://serper.dev | 2,500 free/mo |
| `APIFY_API_KEY` | https://apify.com | Free tier |
| `GITHUB_TOKEN` | https://github.com/settings/tokens | Free |
| Gmail OAuth | https://console.cloud.google.com | Free |

---

## 🏗️ Project Structure

```
dvt-talent-ai/
├── backend/
│   ├── main.py                          # FastAPI app entry
│   ├── config.py                        # Settings
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── api/routes/
│   │   ├── auth.py                      # JWT auth
│   │   ├── companies.py                 # Companies CRUD
│   │   ├── candidates.py                # Candidates + resume upload
│   │   ├── leads.py                     # Lead pipeline
│   │   ├── analytics.py                 # Dashboard KPIs
│   │   ├── agents.py                    # Agent triggers
│   │   └── websocket.py                 # Live updates
│   ├── agents/
│   │   ├── base_agent.py                # Base class
│   │   ├── orchestrator.py              # Pipeline coordinator
│   │   ├── market_intelligence_agent.py # Find hiring companies
│   │   ├── lead_discovery_agent.py      # Find decision makers
│   │   ├── candidate_sourcing_agent.py  # Source candidates
│   │   ├── resume_analysis_agent.py     # AI resume scoring
│   │   ├── outreach_agent.py            # Email writer
│   │   └── supporting_agents.py        # CRM, Analytics, Learning, etc.
│   ├── db/
│   │   ├── models.py                    # Full SQLAlchemy ORM
│   │   └── migrations.py               # Schema reference
│   └── workers/
│       ├── celery_app.py                # Celery config + beat schedule
│       └── tasks.py                     # All background tasks
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   ├── dashboard/page.tsx       # Main dashboard
│   │   │   └── auth/login/page.tsx      # Login page
│   │   └── lib/api.ts                   # API client
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker/
│   ├── nginx/nginx.conf                 # Reverse proxy
│   └── postgres/init.sql               # DB init
├── docker-compose.yml                   # Full stack
└── docs/ARCHITECTURE.md                 # System design
```

---

## 🤖 Autonomous Schedule

Once deployed, the system runs automatically:

| Time | Task |
|------|------|
| 7:00 AM UTC | Full pipeline (find companies → source candidates → send emails) |
| Every 6 hours | Market intelligence scan |
| Every 2 hours | CRM update (check email replies) |
| Every hour | Analytics refresh |
| 2:00 AM UTC | Learning agent (improve strategies) |

---

## 🚨 Troubleshooting

**API won't start**: Check `DATABASE_URL` is correct and postgres is healthy
**Agents fail**: Verify at least one LLM API key is set in `.env`
**No emails sent**: Configure Gmail OAuth credentials
**ChromaDB errors**: Ensure the container is running: `docker compose restart chromadb`
**Celery not processing**: Check Redis connection: `docker compose exec redis redis-cli ping`
