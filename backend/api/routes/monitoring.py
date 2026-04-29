"""
DVT Talent AI — Real-Time Monitoring API
Replaces all hardcoded mock data with live Redis SCAN and Celery inspect data.
"""
import json
import structlog
import redis.asyncio as aioredis

from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.models import get_db, User
from api.routes.auth import require_admin

log = structlog.get_logger(__name__)
router = APIRouter()


@router.get("/signals/recent", summary="Get recent agent broadcast signals")
async def get_recent_signals(limit: int = 50):
    """Fetches the last N signals from the Redis history list."""
    try:
        r = aioredis.from_url(settings.redis_url, decode_responses=True)
        signals = await r.lrange("dvt_signals_history", 0, limit - 1)
        await r.aclose()
        return [json.loads(s) for s in signals]
    except Exception as e:
        log.error("signals_fetch_failed", error=str(e))
        return []


@router.get("/mediations", summary="Get active distributed locks from Redis (real data)")
async def get_active_mediations():
    """
    Scans Redis for active distributed locks (lock:*) and score histories.
    Returns REAL data from Redis SCAN — no hardcoded values.
    """
    try:
        r = aioredis.from_url(settings.redis_url, decode_responses=True)

        # Scan for active locks
        active_locks = []
        cursor = 0
        while True:
            cursor, keys = await r.scan(cursor, match="lock:*", count=100)
            active_locks.extend(keys)
            if cursor == 0:
                break

        # Scan for candidate score history keys
        score_keys = []
        cursor = 0
        while True:
            cursor, keys = await r.scan(cursor, match="candidate:*:score_history", count=100)
            score_keys.extend(keys)
            if cursor == 0:
                break

        # Get latest score history entry
        latest_reconciliation = None
        if score_keys:
            latest_key = score_keys[0]
            latest_entry = await r.lindex(latest_key, 0)
            if latest_entry:
                latest_reconciliation = f"{latest_key}: {latest_entry}"

        await r.aclose()

        return {
            "active_locks": len(active_locks),
            "active_lock_keys": active_locks[:10],  # surface top 10 for UI
            "score_histories_tracked": len(score_keys),
            "latest_reconciliation": latest_reconciliation or "No reconciliations yet",
        }
    except Exception as e:
        log.error("mediations_fetch_failed", error=str(e))
        return {
            "active_locks": 0,
            "active_lock_keys": [],
            "score_histories_tracked": 0,
            "latest_reconciliation": f"Redis unavailable: {str(e)}",
        }


@router.get("/celery/workers", summary="Inspect live Celery workers (real data)")
async def get_celery_workers():
    """
    Uses Celery inspect to get live worker status, active tasks, and reserved tasks.
    Replaces any static worker data.
    """
    try:
        from workers.celery_app import celery_app
        inspector = celery_app.control.inspect(timeout=3.0)

        active = inspector.active() or {}
        reserved = inspector.reserved() or {}
        stats = inspector.stats() or {}

        workers_summary = []
        for worker_name, worker_stats in stats.items():
            workers_summary.append({
                "name": worker_name,
                "active_tasks": len(active.get(worker_name, [])),
                "reserved_tasks": len(reserved.get(worker_name, [])),
                "pool": worker_stats.get("pool", {}).get("implementation", "unknown"),
                "total_processed": worker_stats.get("total", {}).get("workers.tasks.run_agent_task", 0),
            })

        return {
            "online_workers": len(workers_summary),
            "workers": workers_summary,
            "active_tasks_total": sum(w["active_tasks"] for w in workers_summary),
        }
    except Exception as e:
        log.warning("celery_inspect_failed", error=str(e))
        return {
            "online_workers": 0,
            "workers": [],
            "active_tasks_total": 0,
            "note": "Celery workers may be offline or Redis unavailable.",
        }


@router.get("/audit-logs", summary="Fetch structured audit logs (Admin only)")
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
    limit: int = 100,
    offset: int = 0,
):
    """Fetch structured audit logs from the database. Admin only."""
    from sqlalchemy import select
    from db.models import AuditLog

    query = select(AuditLog).order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    return [
        {
            "id": str(entry.id),
            "user_id": str(entry.user_id) if entry.user_id else None,
            "action": entry.action,
            "resource_type": entry.resource_type,
            "resource_id": str(entry.resource_id) if entry.resource_id else None,
            "ip_address": entry.ip_address,
            "created_at": entry.created_at,
        }
        for entry in logs
    ]
