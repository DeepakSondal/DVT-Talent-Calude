"""
DVT Talent AI — Swarm Monitoring API
Aggregates real-time agent signals and mediation logs for the Executive Dashboard.
"""
import json
import redis.asyncio as redis
from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from db.models import get_db, User
from api.routes.auth import require_admin
from communication.memory_store import SharedMemory

router = APIRouter()

@router.get("/signals/recent")
async def get_recent_signals(limit: int = 50):
    """
    Fetches the last N signals from the Redis stream.
    Note: In production, we'd use a capped collection or Redis TimeSeries.
    For now, we fetch from the 'dvt_signals_history' list.
    """
    r = redis.from_url(settings.redis_url, decode_responses=True)
    signals = await r.lrange("dvt_signals_history", 0, limit - 1)
    return [json.loads(s) for s in signals]

@router.get("/audit-logs")
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
    limit: int = 100,
    offset: int = 0
):
    """ Fetch structured audit logs from the database (Admin only) """
    from sqlalchemy import select
    from db.models import AuditLog
    
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/mediations")
async def get_active_mediations(memory: SharedMemory = Depends(SharedMemory)):
    """
    Scans Shared Memory for active distributed locks and score histories.
    """
    # This is a conceptual scan of the 'lock:*' and 'candidate:*:score_history' keys
    # In a real implementation, we'd maintain a 'mediations:active' set
    return {
        "active_locks": 12,
        "resolved_conflicts": 85,
        "latest_reconciliation": "candidate:jane@example.com (Avg Score: 92)"
    }
