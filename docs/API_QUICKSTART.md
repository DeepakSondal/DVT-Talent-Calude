# DVT Talent AI — API Quickstart (v1.1)

Integrate the power of the recruiter swarm into your custom workflows.

## 🔑 Authentication
All requests require a Bearer Token in the `Authorization` header.
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
     -d "username=admin@dvttalent.com&password=your_password"
```

## 🛰️ Triggering a Pipeline (Native Swarm)
Initiate a full autonomous pipeline (Autopilot) for a specific role and location using high-performance background tasks.
```bash
POST /api/v1/agents/swarm/run
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
    "industry": "technology",
    "location": "United States",
    "send_emails": false,
    "mock_mode": false
}
```

## 👥 Starting a Copilot Workflow (HITL)
Launch a stateful discovery phase that will pause for human review of the Job Description.
```bash
POST /api/v1/copilot/discovery
Content-Type: application/json

{
    "industry": "Sales Director",
    "location": "New York",
    "tenant_id": "your-uuid-here"
}
```

## 📊 Monitoring Progress
Check the real-time status of a running agent task.
```bash
GET /api/v1/agents/status/{task_id}
```

## 📡 Live Telemetry (WebSockets)
Connect to the real-time event stream to receive agent check-ins and progress logs.
```javascript
const ws = new WebSocket("ws://127.0.0.1:8000/api/v1/ws/pipeline-events?token=<TOKEN>");
ws.onmessage = (event) => console.log("Swarm Signal:", JSON.parse(event.data));
```

## 📈 Fetching Leads
Get grouped leads for the Kanban pipeline view.
```bash
GET /api/v1/leads/pipeline
```
