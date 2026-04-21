"""
DVT Talent AI — Agents API
Manual triggers for each autonomous agent
"""
import uuid
import json
import redis.asyncio as redis
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AgentTask, AgentTaskStatus, get_db
from api.routes.auth import get_current_user, User
from agents.dag_orchestrator import AsyncDAGOrchestrator, get_orchestrator

router = APIRouter()


class SwarmTriggerSchema(BaseModel):
    industry: str
    location: str
    sectors: Optional[List[str]] = None


class AgentTrigger(BaseModel):
    agent: str
    params: Dict[str, Any]


class PipelineTrigger(BaseModel):
    industry: str = "technology"
    location: str = "United States"
    send_emails: bool = False
    mock_mode: bool = False


VALID_AGENTS = [
    "discovery",
    "sourcing",
    "outreach",
    "analytics",
    "screening",
]


@router.post("/trigger")
async def trigger_agent(
    trigger: AgentTrigger,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger an AI agent"""
    if trigger.agent not in VALID_AGENTS:
        raise HTTPException(status_code=400, detail=f"Unknown agent. Valid: {VALID_AGENTS}")

    from workers.tasks import run_agent_task
    task = run_agent_task.delay(trigger.agent, trigger.params)

    # Log to DB
    agent_task = AgentTask(
        agent_name=trigger.agent,
        task_type="manual_trigger",
        status=AgentTaskStatus.PENDING,
        input_data=trigger.params,
        celery_task_id=task.id,
        user_id=current_user.id,
    )
    db.add(agent_task)
    await db.commit()

    return {
        "message": f"Agent '{trigger.agent}' triggered",
        "celery_task_id": task.id,
        "agent_task_id": str(agent_task.id),
    }


@router.post("/swarm/run")
async def run_swarm_pipeline(
    config: PipelineTrigger,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger the unified 5-agent swarm pipeline"""
    from workers.tasks import run_full_autonomous_pipeline
    task = run_full_autonomous_pipeline.delay(
        industry=config.industry,
        location=config.location,
        send_emails=config.send_emails,
        mock_mode=config.mock_mode
    )
    return {
        "message": "Unified swarm pipeline started", 
        "celery_task_id": task.id, 
        "mock": config.mock_mode
    }


@router.get("/tasks")
async def list_agent_tasks(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List recent agent task executions"""
    from sqlalchemy import select, desc
    result = await db.execute(
        select(AgentTask).order_by(desc(AgentTask.created_at)).limit(limit)
    )
    tasks = result.scalars().all()
    return {
        "tasks": [
            {
                "id": str(t.id),
                "agent_name": t.agent_name,
                "task_type": t.task_type,
                "status": t.status.value,
                "started_at": t.started_at,
                "completed_at": t.completed_at,
                "error": t.error_message,
                "created_at": t.created_at,
            }
            for t in tasks
        ]
    }
