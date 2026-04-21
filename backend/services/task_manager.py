"""
DVT Talent AI — Task Management Service
Handles agent lifecycle, including Gap 4: Agent Kill Switch.
"""
from celery import Celery
from db.models import AsyncSessionLocal, AgentTask, AgentTaskStatus
from sqlalchemy import select, update
from config import settings
import structlog

log = structlog.get_logger()
celery_app = Celery("dvt_talent", broker=settings.celery_broker_url)

class TaskManager:
    @staticmethod
    async def stop_agent_task(task_uuid: str, tenant_id: str) -> bool:
        """
        [NEW] Gap 4: Agent Full Stop
        Revokes a running Celery task and updates DB status to 'failed'.
        """
        async with AsyncSessionLocal() as session:
            # 1. Verify task belongs to tenant
            stmt = select(AgentTask).where(
                AgentTask.id == task_uuid, 
                AgentTask.tenant_id == tenant_id
            )
            result = await session.execute(stmt)
            task_obj = result.scalar_one_or_none()
            
            if not task_obj or not task_obj.celery_task_id:
                log.warning("kill_switch_failed", reason="task_not_found", task_id=task_uuid)
                return False
            
            # 2. Revoke in Celery
            try:
                celery_app.control.revoke(task_obj.celery_task_id, terminate=True)
                log.info("celery_task_revoked", celery_id=task_obj.celery_task_id)
            except Exception as e:
                log.error("celery_revoke_failed", error=str(e))
                # Continue anyway to update DB status
            
            # 3. Update DB
            task_obj.status = AgentTaskStatus.FAILED
            task_obj.error_message = "Task terminated by user."
            await session.commit()
            
            return True
