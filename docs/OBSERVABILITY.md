# DVT Talent AI — Observability Guide

This document covers the complete observability stack for DVT Talent AI, including error tracking, metrics, dashboards, alerting, and health checks.

---

## Overview

| Tool | Purpose | Port |
|---|---|---|
| **Sentry** | Exception tracking, performance tracing | Cloud (external) |
| **Prometheus** | Metrics scraping & storage | `9090` |
| **Grafana** | Metrics dashboards | `3001` |
| **Alertmanager** | Alert routing (Slack, email) | `9093` |
| **Health Endpoints** | Real-time deep health checks | `8000` |

---

## 1. Sentry Error Tracking

### Setup
Add your DSN to the backend `.env` file:
```env
SENTRY_DSN=https://your_key@o0.ingest.sentry.io/your_project_id
APP_ENV=production
```

Sentry will automatically:
- Capture all unhandled FastAPI exceptions
- Trace SQLAlchemy database queries
- Trace Redis operations
- Trace Celery task execution
- Create performance spans on every `@sentry_sdk.trace` decorated agent method

### What Gets Traced
| Method | Tracing |
|---|---|
| `BaseAgent.chat()` | `@sentry_sdk.trace` ✅ |
| `BaseAgent.chat_async()` | `@sentry_sdk.trace` ✅ |
| All FastAPI routes | Auto via `FastApiIntegration` ✅ |
| All Celery tasks | Auto via `CeleryIntegration` ✅ |
| SQLAlchemy queries | Auto via `SqlalchemyIntegration` ✅ |

> [!NOTE]
> `send_default_pii=False` is enforced to comply with GDPR. Candidate names/emails will NOT be sent to Sentry.

---

## 2. Starting the Monitoring Stack

The monitoring services run as a Docker Compose overlay. Start them alongside the main stack:

```bash
# Start everything including monitoring
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Start monitoring stack only (if main stack is already running)
docker compose -f docker-compose.monitoring.yml up -d
```

### Default URLs
| Service | URL | Credentials |
|---|---|---|
| **Grafana** | http://localhost:3001 | admin / dvt_admin_2026 |
| **Prometheus** | http://localhost:9090 | No auth |
| **Alertmanager** | http://localhost:9093 | No auth |

> [!IMPORTANT]
> Change the Grafana password in production by setting `GRAFANA_PASSWORD` in your `.env` file.

---

## 3. Grafana Dashboard

The DVT Operations Dashboard is auto-provisioned on startup. It includes:

| Panel | Metric |
|---|---|
| API Request Rate | `rate(http_requests_total[1m])` |
| Error Rate (%) | `rate(http_requests_total{status=~"5.."}[5m])` |
| P99 Latency | `histogram_quantile(0.99, ...)` |
| API Up/Down | `up{job="dvt-api"}` |
| Request Rate by Endpoint | Breakdown by route handler |
| API Latency Percentiles | P50 / P95 / P99 over time |
| Agent Task Success vs Failure | `rate(agent_tasks_total{status=...})` |
| DB & Redis Connection Pool | Pool utilization over time |

---

## 4. Health Check Endpoints

All health endpoints are available without authentication:

```bash
# Quick liveness check
GET /health

# PostgreSQL deep check  
GET /health/db

# Redis round-trip ping
GET /health/redis

# LLM API key + connectivity (makes a live 1-token call)
GET /health/llm

# Composite check — returns 503 if ANY system is unhealthy
GET /health/all
```

### Example Response (healthy)
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy", "database": "postgresql" },
    "redis": { "status": "healthy", "service": "redis", "latency_ms": 1.2 }
  }
}
```

---

## 5. Alerting

### Prometheus Alert Rules
Defined in `docker/monitoring/alert_rules.yml`. Fires on:
- `APIDown` — API unreachable for > 1 min
- `HighErrorRate` — Error rate > 5% for > 2 min
- `HighP99Latency` — P99 > 3s for > 5 min
- `RedisDown` — Redis unreachable for > 30 sec
- `CeleryWorkerDown` — No workers for > 2 min
- `AgentTaskFailureSpike` — Task failure rate > 0.1/s

### Slack Webhook Alerting (Python)
The `backend/api/alerts.py` script sends **transition-based** alerts — it only fires when a service goes DOWN or RECOVERS (no alert storms).

```bash
# Run manually
python -m api.alerts

# Add to cron (every 5 min)
*/5 * * * * cd /app && python -m api.alerts >> /var/log/dvt-alerts.log 2>&1
```

Configure in `.env`:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 6. Configuration Reference

| Variable | Purpose | Required |
|---|---|---|
| `SENTRY_DSN` | Sentry error tracking DSN | No (disables Sentry if absent) |
| `SLACK_WEBHOOK_URL` | Slack alerts webhook | No |
| `GRAFANA_PASSWORD` | Grafana admin password | Recommended |
| `APP_ENV` | Sentry environment tag (`production`, `staging`) | Yes |

---

## 7. File Structure

```
docker/monitoring/
├── prometheus.yml          # Scrape config
├── alert_rules.yml         # Prometheus alerting rules
├── alertmanager.yml        # Alertmanager → Slack routing
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── prometheus.yml     # Auto-connects Grafana to Prometheus
        └── dashboards/
            ├── dashboards.yml     # Dashboard provider config
            └── dvt_dashboard.json # Pre-built DVT Operations dashboard

backend/
├── api/
│   ├── routes/
│   │   ├── health.py       # /health, /health/db, /health/redis, /health/llm
│   │   └── monitoring.py   # Real Redis SCAN + Celery inspect data
│   └── alerts.py           # Standalone Slack alerting script
└── agents/
    └── base_agent.py       # @sentry_sdk.trace on all LLM calls
```
