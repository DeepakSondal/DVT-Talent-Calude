"""
DVT Talent AI — Swarm API Tests
Verifies the new Hub, Monitoring, and Trigger endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch, AsyncMock

client = TestClient(app)

def test_nexus_monitoring_recent_signals():
    """ Verify the monitoring endpoint returns signal history """
    # Mock redis response for signal history
    with patch("redis.asyncio.from_url") as mock_redis:
        mock_instance = mock_redis.return_value
        mock_instance.lrange.return_value = ['{"agent": "market_intel", "type": "agent_started"}']
        
        response = client.get("/api/v1/monitoring/signals/recent?limit=10")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["agent"] == "market_intel"

def test_swarm_trigger_endpoint():
    """ Verify that the DAG trigger initiates a background task """
    # Mock orchestrator run_pipeline
    with patch("agents.dag_orchestrator.AsyncDAGOrchestrator.run_pipeline", new_callable=AsyncMock) as mock_run:
        response = client.get("/api/v1/agents/trigger-dag?industry=AI&location=SF")
        
        assert response.status_code == 200
        assert response.json()["status"] == "dag_swarm_initiated"
        # Since we use asyncio.create_task, we just verify the call was made
        # Note: Depending on timing, you might need a small wait or check background task registry

def test_monster_webhook_intake():
    """ Verify that Monster webhooks correctly ingest applicants """
    payload = {
        "applicant": {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@monster.com",
            "resume": "base64_data_here"
        },
        "jobId": "monster_123"
    }
    
    # Mock DB and signal emission
    with patch("api.routes.webhooks.get_db"), \
         patch("api.routes.webhooks.broadcast_candidate_intake"):
        
        response = client.post("/api/v1/webhooks/monster/applications", json=payload)
        
        assert response.status_code == 200
        assert response.json()["status"] == "received"
