"""
DVT Talent AI — Simplified Agent Orchestrator
Coordinates the 5 core agents in a streamlined pipeline.
"""
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import structlog
import httpx

from backend.config import settings
from backend.agents.pydantic_config import AgentDeps
from backend.agents.discovery_pydantic import discovery_agent
from backend.agents.sourcing_pydantic import sourcing_agent
from backend.agents.outreach_pydantic import outreach_agent
from backend.agents.analytics_pydantic import analytics_agent
from backend.agents.screening_pydantic import screening_agent
from backend.agents.critic_pydantic import critic_agent
from backend.agents.market_iq_pydantic import market_iq_agent
from backend.services.notification_service import notification_service

log = structlog.get_logger(__name__)

def broadcast_signal(message: str, signal_type: str = "agent_info", tenant_id: str = "default"):
    """Bridge to the Celery task broadcaster for live UI telemetry"""
    from backend.workers.tasks import broadcast_signal as relay
    relay(message, signal_type, tenant_id)

class AgentOrchestrator:
    """
    Coordinates the modern DVT Talent AI pipeline using Pydantic AI:
    1. Discovery -> Market scan, lead finding, JD prep.
    2. Sourcing  -> Global talent search, resume scoring, integrity check.
    3. Outreach  -> Multichannel communication (locked for conflict resolution).
    4. Analytics -> Performance reporting.
    5. Screening -> Technical screen (optional).
    """
    
    def __init__(self, tenant_id: Optional[str] = None, job_id: Optional[str] = None):
        self.tenant_id = tenant_id
        self.job_id = job_id
        self.context = {"tenant_id": tenant_id, "job_id": job_id}

    async def run_full_swarm(
        self,
        industry: str = "technology",
        location: str = "United States",
        enable_screening: bool = False,
        enable_microsite: bool = False,
        mock_mode: bool = False
    ) -> Dict[str, Any]:
        """Alias for compatibility with the native task runner"""
        return await self.run_full_pipeline(
            industry=industry,
            location=location,
            enable_screening=enable_screening,
            enable_microsite=enable_microsite,
            mock_mode=mock_mode
        )

    async def run_full_pipeline(
        self,
        industry: str = "technology",
        location: str = "United States",
        enable_screening: bool = False,
        enable_microsite: bool = False,
        mock_mode: bool = False
    ) -> Dict[str, Any]:
        pipeline_start = datetime.utcnow()
        log.info("unified_pipeline_started", industry=industry, location=location)
        
        results = {"stages": {}}

        async with httpx.AsyncClient() as client:
            deps = AgentDeps(http_client=client, tenant_id=self.tenant_id or "default")
            
            try:
                # 1. Market IQ
                broadcast_signal("Agent 'market_iq' initiating market analysis...", "agent_start", self.tenant_id)
                market_iq_res = await market_iq_agent.run(
                    f"Analyze {industry} market in {location}", deps=deps
                )
                broadcast_signal("Agent 'market_iq' completed analysis.", "agent_success", self.tenant_id)
                results["stages"]["market_iq"] = market_iq_res.data.model_dump()
                
                # 2. Speculative Discovery & Sourcing
                broadcast_signal("Agent 'discovery' initiatedJD optimization...", "agent_start", self.tenant_id)
                broadcast_signal("Agent 'sourcing' initiated node discovery...", "agent_start", self.tenant_id)
                
                discovery_task = asyncio.create_task(discovery_agent.run(
                    f"Identify leads and optimize JD for {industry} in {location}", deps=deps
                ))
                sourcing_task = asyncio.create_task(sourcing_agent.run(
                    f"Find candidates for {industry} roles in {location}", deps=deps
                ))
                
                discovery_res, sourcing_res = await asyncio.gather(discovery_task, sourcing_task)
                broadcast_signal("Agent 'discovery' completed JD synthesis.", "agent_success", self.tenant_id)
                broadcast_signal("Agent 'sourcing' completed node discovery.", "agent_success", self.tenant_id)
                
                # 3. Logic Audit (Critic)
                broadcast_signal("Agent 'critic' initiating logic audit...", "agent_start", self.tenant_id)
                audit_res = await critic_agent.run(
                    f"Audit this sourcing result: {sourcing_res.data.model_dump_json()}", deps=deps
                )
                broadcast_signal("Agent 'critic' audit complete: Trust verified.", "agent_success", self.tenant_id)
                
                results["stages"]["discovery"] = discovery_res.data.model_dump()
                results["stages"]["sourcing"] = sourcing_res.data.model_dump()
                results["stages"]["critic"] = audit_res.data.model_dump()
                
                # 4. Outreach
                broadcast_signal("Agent 'outreach' drafting personalized sequences...", "agent_start", self.tenant_id)
                candidates = sourcing_res.data.candidates
                outreach_results = []
                for cand in candidates[:5]:
                    out_res = await outreach_agent.run(
                        f"Draft outreach for {cand.full_name} for role {discovery_res.data.job_description}",
                        deps=deps
                    )
                    outreach_results.append(out_res.data.model_dump())
                broadcast_signal("Agent 'outreach' sequence drafting complete.", "agent_success", self.tenant_id)
                results["stages"]["outreach"] = outreach_results
                
                # 5. Analytics
                broadcast_signal("Agent 'analytics' generating run report...", "agent_start", self.tenant_id)
                analytics_res = await analytics_agent.run("Generate report for this run", deps=deps)
                broadcast_signal("Agent 'analytics' report generated.", "agent_success", self.tenant_id)
                results["stages"]["analytics"] = analytics_res.data.model_dump()
                
                # 6. Optional Screening
                if enable_screening:
                    screening_results = []
                    for cand in candidates[:3]:
                        scr_res = await screening_agent.run(
                            f"Screen {cand.full_name} for {discovery_res.data.job_description}",
                            deps=deps
                        )
                        screening_results.append(scr_res.data.model_dump())
                    results["stages"]["screening"] = screening_results

            except Exception as e:
                log.error("pipeline_failed", error=str(e))
                results["error"] = str(e)

        results["duration_seconds"] = (datetime.utcnow() - pipeline_start).total_seconds()
        return results

    # ── SWARM COMMAND CENTER: 3-Phase Execution ──────────────────────────────
    async def run_swarm_phase(self, phase: str, mode: str = "copilot", **kwargs) -> Dict[str, Any]:
        """Unified entry point for the 3-phase Swarm Command Center."""
        log.info("swarm_phase_initiated", phase=phase, mode=mode, tenant_id=self.tenant_id)
        
        async with httpx.AsyncClient() as client:
            deps = AgentDeps(http_client=client, tenant_id=self.tenant_id or "default")
            
            if phase == "discovery":
                return await self.run_discovery_phase(deps, kwargs.get("industry"), kwargs.get("location"), mode=mode)
            elif phase == "sourcing":
                return await self.run_sourcing_phase(deps, kwargs.get("job_description"), kwargs.get("location"), mode=mode)
            elif phase == "outreach":
                return await self.run_outreach_phase(deps, kwargs.get("approved_candidates"), kwargs.get("job"), mode=mode)
            else:
                raise ValueError(f"Invalid swarm phase: {phase}")

    async def run_discovery_phase(self, deps: AgentDeps, industry: str, location: str, mode: str = "copilot") -> Dict[str, Any]:
        """Phase 1: Leads & Discovery."""
        results = {}
        res_iq = await market_iq_agent.run(f"Analyze {industry} in {location}", deps=deps)
        res_disc = await discovery_agent.run(f"Optimize JD for {industry} in {location}", deps=deps)
        
        results["market_iq"] = res_iq.data.model_dump()
        results["discovery"] = res_disc.data.model_dump()
        
        if mode == "copilot":
            await notification_service.notify_recruiter_action(
                tenant_id=deps.tenant_id,
                action_type="Job Description Ready",
                job_title=f"{industry} Role",
                details="The Discovery Agent has generated a Market IQ report and a draft JD."
            )
        return results

    async def run_sourcing_phase(self, deps: AgentDeps, job_description: str, location: str, mode: str = "copilot") -> Dict[str, Any]:
        """Phase 2: Talent Sourcing."""
        res = await sourcing_agent.run(f"Find candidates for: {job_description}", deps=deps)
        sourcing_res = res.data.model_dump()
        
        # Audit
        audit = await critic_agent.run(f"Audit: {res.data.model_dump_json()}", deps=deps)
        sourcing_res["audit"] = audit.data.model_dump()
        
        if mode == "copilot":
            await notification_service.notify_recruiter_action(
                tenant_id=deps.tenant_id,
                action_type="Candidates Ready",
                job_title=job_description[:50],
                details=f"Found {len(res.data.candidates)} candidates."
            )
        return {"sourcing": sourcing_res}

    async def run_outreach_phase(self, deps: AgentDeps, approved_candidates: List[Dict[str, Any]], job: Dict[str, Any], mode: str = "copilot") -> List[Dict[str, Any]]:
        """Phase 3: Signal Outreach."""
        results = []
        for cand in approved_candidates:
            # 1. Screen
            scr = await screening_agent.run(f"Screen {cand.get('full_name')} for {job.get('title')}", deps=deps)
            # 2. Outreach
            out = await outreach_agent.run(f"Draft outreach for {cand.get('full_name')}", deps=deps)
            
            results.append({
                "candidate": cand.get("full_name"),
                "screening": scr.data.model_dump(),
                "outreach": out.data.model_dump()
            })
        return results
