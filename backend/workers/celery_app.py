"""
DVT Talent AI — Celery App Configuration
Background task queue for all agent operations
"""
from celery import Celery
from celery.schedules import crontab
from config import settings

celery_app = Celery(
    "dvt_talent_ai",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_max_retries=3,
    task_soft_time_limit=300,   # 5 minutes soft limit
    task_time_limit=600,        # 10 minutes hard limit
    result_expires=86400,       # Results expire in 24 hours
)

# ── Periodic Schedule (Autonomous Daily Operations) ─────────────────────────
celery_app.conf.beat_schedule = {
    # Full pipeline runs every morning at 7 AM UTC
    "daily-full-pipeline": {
        "task": "workers.tasks.run_full_autonomous_pipeline",
        "schedule": crontab(hour=7, minute=0),
        "args": [],
        "kwargs": {"industry": "technology", "location": "United States", "send_emails": True},
    },
    # Scan for new hiring companies every 6 hours
    "discover-companies": {
        "task": "workers.tasks.run_agent_task",
        "schedule": crontab(hour="*/6", minute=30),
        "args": ["market_intelligence"],
        "kwargs": {"industry": "technology"},
    },
    # Update CRM every 2 hours (check for email replies)
    "crm-update": {
        "task": "workers.tasks.run_agent_task",
        "schedule": crontab(minute=0, hour="*/2"),
        "args": ["crm_management"],
        "kwargs": {},
    },
    # Analytics refresh every hour
    "analytics-refresh": {
        "task": "workers.tasks.run_agent_task",
        "schedule": crontab(minute=15),
        "args": ["analytics"],
        "kwargs": {},
    },
    # Learning agent runs nightly
    "nightly-learning": {
        "task": "workers.tasks.run_agent_task",
        "schedule": crontab(hour=2, minute=0),
        "args": ["learning"],
        "kwargs": {},
    },
}

from celery.signals import worker_process_init

@worker_process_init.connect
def init_worker(**kwargs):
    import structlog
    log = structlog.get_logger()
    try:
        from agents.resume_analysis_agent import warmup_embedding_model
        log.info("warming_up_embedding_model")
        warmup_embedding_model()
        log.info("embedding_model_warmup_complete")
    except Exception as e:
        log.error("embedding_model_warmup_failed", error=str(e))
