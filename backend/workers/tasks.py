"""
DVT Talent AI — Celery Tasks (Simplified & Persistent)
Unified task execution for the 5-agent model with DB synchronization.
"""
import base64
import json
import structlog
import asyncio
from typing import Any, Dict, Optional
from datetime import datetime

import redis
from sqlalchemy import create_engine, text
from workers.celery_app import celery_app
from config import settings
from agents.orchestrator import AgentOrchestrator
from agents.discovery_agent import DiscoveryAgent
from agents.sourcing_agent import SourcingAgent
from agents.outreach_agent import OutreachAgent
from agents.analytics_agent import AnalyticsAgent
from agents.screening_agent import ScreeningAgent

log = structlog.get_logger(__name__)

def broadcast_signal(message: str, signal_type: str = "agent_info"):
    """Publish a signal to Redis for the WebSocket relay to pick up"""
    try:
        r = redis.from_url(settings.redis_url)
        r.publish("dvt_signals", json.dumps({
            "type": signal_type,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }))
    except Exception as e:
        log.error("broadcast_failed", error=str(e))

# ── Unified Runner ──────────────────────────────────────────────────────────

@celery_app.task(bind=True, name="workers.tasks.run_agent_task", max_retries=3)
def run_agent_task(self, agent_name: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    """Run any single agent by name (Discovery, Sourcing, Outreach, Analytics, Screening)"""
    log.info("celery_task_started", task="run_agent_task", agent=agent_name)
    try:
        broadcast_signal(f"Agent '{agent_name}' initiated...", "agent_start")
        
        agents_map = {
            "discovery": DiscoveryAgent,
            "sourcing": SourcingAgent,
            "outreach": OutreachAgent,
            "analytics": AnalyticsAgent,
            "screening": ScreeningAgent
        }
        
        if agent_name not in agents_map:
            raise ValueError(f"Unknown agent: {agent_name}")
            
        agent = agents_map[agent_name]()
        if hasattr(agent, "run_async"):
            result = asyncio.run(agent.run_async(**(params or {})))
        else:
            result = agent.run(**(params or {}))
            
        broadcast_signal(f"Agent '{agent_name}' completed successfully.", "agent_success")
        log.info("celery_task_completed", task="run_agent_task", agent=agent_name)
        return result
    except Exception as exc:
        log.error("celery_task_failed", task="run_agent_task", agent=agent_name, error=str(exc))
        raise self.retry(exc=exc, countdown=60)

@celery_app.task(bind=True, name="workers.tasks.run_full_autonomous_pipeline", max_retries=1)
def run_full_autonomous_pipeline(
    self,
    industry: str = "technology",
    location: str = "United States",
    send_emails: bool = False,
    mock_mode: bool = False,
) -> Dict[str, Any]:
    """Run the complete end-to-end 5-agent pipeline"""
    log.info("celery_task_started", task="full_pipeline", industry=industry, mock=mock_mode)
    try:
        orchestrator = AgentOrchestrator()
        result = asyncio.run(orchestrator.run_full_pipeline(
            industry=industry,
            location=location,
            mock_mode=mock_mode
        ))
        log.info("celery_task_completed", task="full_pipeline")
        return result
    except Exception as exc:
        log.error("celery_task_failed", task="full_pipeline", error=str(exc))
        raise self.retry(exc=exc, countdown=300)

# ── Specialized Tasks (Legacy Support & Granular Control) ───────────────────

@celery_app.task(bind=True, name="workers.tasks.analyze_resume_task", max_retries=3)
def analyze_resume_task(
    self,
    resume_id: str,
    file_content_b64: str,
    filename: str,
    job_description: Optional[str] = None,
) -> Dict[str, Any]:
    """Parse and analyze a resume using SourcingAgent"""
    log.info("celery_task_started", task="analyze_resume", resume_id=resume_id)
    try:
        agent = SourcingAgent()
        file_bytes = base64.b64decode(file_content_b64)
        
        # In a real impl, we'd use a PDF/Docx parser here. 
        # For now, passing placeholder or extracted text if available.
        raw_text = file_bytes.decode("utf-8", errors="ignore")
        
        result = asyncio.run(agent.run_async(
            job_description=job_description or "Software Engineer",
            limit=1
        ))
        
        # Persist results
        _update_resume_in_db(resume_id, result, raw_text)
        return result
    except Exception as exc:
        log.error("celery_task_failed", task="analyze_resume", error=str(exc))
        raise self.retry(exc=exc, countdown=30)

@celery_app.task(bind=True, name="workers.tasks.score_candidate_task", max_retries=3)
def score_candidate_task(self, candidate_id: str, job_id: Optional[str] = None) -> Dict[str, Any]:
    """Score a candidate using SourcingAgent"""
    log.info("celery_task_started", task="score_candidate", candidate_id=candidate_id)
    try:
        engine = create_engine(settings.database_sync_url)
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT raw_text FROM resumes WHERE candidate_id = :cid AND is_current = TRUE LIMIT 1"),
                {"cid": candidate_id}
            ).fetchone()
            
            if not row or not row[0]:
                return {"candidate_id": candidate_id, "status": "no_resume", "score": 0}
            
            jd_text = "Software Engineer"
            if job_id:
                jd_row = conn.execute(
                    text("SELECT description FROM jobs WHERE id = :jid"),
                    {"jid": job_id}
                ).fetchone()
                if jd_row: jd_text = jd_row[0]

        agent = SourcingAgent()
        result = asyncio.run(agent.run_async(job_description=jd_text, limit=1))
        
        with engine.connect() as conn:
            conn.execute(
                text("UPDATE candidates SET score = :score, ai_summary = :summary WHERE id = :cid"),
                {"score": result.get("candidates", [{}])[0].get("score", 0), 
                 "summary": result.get("candidates", [{}])[0].get("analysis", ""), 
                 "cid": candidate_id}
            )
            conn.commit()
            
        return {"candidate_id": candidate_id, "status": "scored"}
    except Exception as exc:
        log.error("score_candidate_failed", error=str(exc))
        raise self.retry(exc=exc, countdown=30)

# ── DB Helpers (Synchronous) ───────────────────────────────────────────────

def _update_resume_in_db(resume_id: str, analysis: dict, raw_text: str = ""):
    try:
        engine = create_engine(settings.database_sync_url)
        with engine.connect() as conn:
            conn.execute(
                text("""
                    UPDATE resumes
                    SET score = :score,
                        parsed_data = :parsed_data,
                        raw_text = :raw_text,
                        updated_at = NOW()
                    WHERE id = :resume_id
                """),
                {
                    "resume_id": resume_id,
                    "score": analysis.get("score", 0),
                    "parsed_data": json.dumps(analysis.get("parsed", {})),
                    "raw_text": raw_text,
                }
            )
            conn.commit()
    except Exception as e:
        log.error("db_update_failed", table="resumes", error=str(e))

def _update_company_in_db(company_id: str, research: dict):
    try:
        engine = create_engine(settings.database_sync_url)
        with engine.connect() as conn:
            conn.execute(
                text("""
                    UPDATE companies
                    SET tech_stack = :tech_stack,
                        score = :score,
                        open_roles_count = :open_roles,
                        last_enriched = NOW(),
                        description = :desc,
                        metadata = :metadata
                    WHERE id = :company_id
                """),
                {
                    "company_id": company_id,
                    "tech_stack": research.get("tech_stack", []),
                    "score": research.get("score", 0),
                    "open_roles": research.get("open_roles", 0),
                    "desc": research.get("description", ""),
                    "metadata": json.dumps(research.get("metadata", {})),
                }
            )
            conn.commit()
    except Exception as e:
        log.error("db_update_failed", table="companies", error=str(e))
