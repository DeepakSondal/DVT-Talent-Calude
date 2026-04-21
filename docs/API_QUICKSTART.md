# DVT Talent AI — API Quickstart (v1.0)

Integrate the power of the recruiter swarm into your custom workflows.

## 🔑 Authentication
All requests require a Bearer Token in the `Authorization` header.
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
     -d "username=admin@dvt.ai&password=password"
```

## 🛰️ Triggering a Discovery Swarm
Initiate a full DAG pipeline for a specific industry and location.
```python
import requests

API_URL = "http://localhost:8000/api/v1/agents/trigger-dag"
headers = {"Authorization": "Bearer YOUR_TOKEN"}
payload = {
    "industry": "Generative AI",
    "location": "London",
    "sectors": ["Fintech", "HealthTech"]
}

response = requests.post(API_URL, json=payload, headers=headers)
print(response.json()) # Returns task_id for tracking
```

## 📊 Fetching Live Signals
Get the latest 50 signals for your custom monitoring dashboard.
```bash
GET /api/v1/monitoring/signals/recent?limit=50
```
