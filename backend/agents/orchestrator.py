"""
DVT Talent AI — Simplified Agent Orchestrator
Coordinates the 5 core agents in a streamlined pipeline.
"""
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import structlog

from config import settings
from agents.discovery_agent import DiscoveryAgent
from agents.sourcing_agent import SourcingAgent
from agents.outreach_agent import OutreachAgent
from agents.analytics_agent import AnalyticsAgent
from agents.screening_agent import ScreeningAgent
from agents.critic_agent import CriticAgent
from agents.market_iq_agent import MarketIntelligenceAgent

log = structlog.get_logger(__name__)

class AgentOrchestrator:
    """
    Coordinates the simplified DVT Talent AI pipeline:
    1. Discovery -> Market scan, lead finding, JD prep.
    2. Sourcing  -> Global talent search, resume scoring, integrity check.
    3. Outreach  -> Multichannel communication (locked for conflict resolution).
    4. Analytics -> Performance reporting.
    5. Screening -> Technical screen (optional).
    """
    
    def __init__(self):
        self.agents = {
            "discovery": DiscoveryAgent(),
            "sourcing": SourcingAgent(),
            "outreach": OutreachAgent(),
            "analytics": AnalyticsAgent(),
            "screening": ScreeningAgent(),
            "critic": CriticAgent(),
            "market_iq": MarketIntelligenceAgent()
        }

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

        try:
            # [NEW] Elite Market Intelligence (Market IQ)
            # Before Discovery, we scan the macro market trends
            market_iq_res = await self.agents["market_iq"].run_async(industry=industry, location=location)
            results["stages"]["market_iq"] = market_iq_res
            
            # [NEW] Elite Gap 1: Speculative Parallelism
            # Discovery and Sourcing now start at the same time to reduce latency.
            # Sourcing uses a 'base' JD while Discovery generates the 'optimized' one.
            
            discovery_task = asyncio.create_task(self.agents["discovery"].run_async(industry=industry, location=location))
            base_jd = f"Software Engineer in {industry}, {location}" # Speculative fallback
            sourcing_task = asyncio.create_task(self.agents["sourcing"].run_async(job_description=base_jd))
            
            discovery_res, sourcing_res = await asyncio.gather(discovery_task, sourcing_task)
            
            # [NEW] Elite Logic Audit (LEAN-SAAS)
            # Pass results through Critic to ensure no hallucinations
            audit_res = await self.agents["critic"].audit_report(sourcing_res, context=f"Job: {industry} in {location}")
            if not audit_res.get("passed"):
                log.warning("sourcing_report_refining", issues=audit_res.get("issues"))
                # Potential re-run logic would go here
            
            results["stages"]["discovery"] = discovery_res
            results["stages"]["sourcing"] = sourcing_res
            
            # 3. Outreach
            candidates = sourcing_res.get("candidates", [])
            outreach_res = []
            if candidates:
                # Run outreach for top candidates
                for cand in candidates[:5]:
                    out_res = await self.agents["outreach"].run_async(
                        candidate=cand, 
                        job={"title": jd, "company_name": "DVT Partners"},
                        enable_microsite=enable_microsite
                    )
                    outreach_res.append(out_res)
            results["stages"]["outreach"] = outreach_res
            
            # 4. Analytics
            analytics_res = await self.agents["analytics"].run_async()
            results["stages"]["analytics"] = analytics_res
            
            # 5. Selective Screening & Verification (LEAN-SAAS)
            # Only run expensive AI-led screening on Top 80th percentile candidates
            if enable_screening or settings.get("ENABLE_SCREENING", False):
                screening_res = []
                # [NEW] Cost Control: Filter for high match_score
                top_candidates = [c for c in candidates if c.get("match_score", 0) >= 80]
                
                for cand in top_candidates[:3]:
                    scr_res = await self.agents["screening"].run_async(candidate=cand, job={"title": jd})
                    screening_res.append(scr_res)
                results["stages"]["screening"] = screening_res

        except Exception as e:
            log.error("pipeline_failed", error=str(e))
            results["error"] = str(e)

        results["duration_seconds"] = (datetime.utcnow() - pipeline_start).total_seconds()
        return results

    # ── COPILOT MODE: Stateful Phase Execution ──────────────────────────────
    async def run_discovery_phase(self, industry: str, location: str) -> Dict[str, Any]:
        """Phase 1: Generates Market IQ and Job Description for user approval."""
        results = {}
        results["market_iq"] = await self.agents["market_iq"].run_async(industry, location)
        results["discovery"] = await self.agents["discovery"].run_async(industry, location)
        # Returns so the user can manually edit the JD before sourcing
        return results

    async def run_sourcing_phase(self, job_description: str, location: str) -> Dict[str, Any]:
        """Phase 2: Finds candidates based on the manual/approved JD and passes logic audit."""
        results = {}
        sourcing_res = await self.agents["sourcing"].run_async(job_description=job_description)
        
        # Audit the AI's findings
        audit_res = await self.agents["critic"].audit_report(sourcing_res, context=f"Job: {job_description[:50]}")
        sourcing_res["audit_passed"] = audit_res.get("passed", True)
        sourcing_res["audit_issues"] = audit_res.get("issues", [])
        
        results["sourcing"] = sourcing_res
        # Returns so user can manually delete bad candidates before outreach
        return results

    async def run_outreach_phase(self, approved_candidates: List[Dict[str, Any]], job: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Phase 3: Screens and drafts emails only for user-approved candidates."""
        results = []
        for cand in approved_candidates:
            # 1. Screen
            scr_res = await self.agents["screening"].run_async(candidate=cand, job=job)
            
            # 2. Outreach
            out_res = await self.agents["outreach"].run_async(candidate=cand, job=job)
            
            cand_result = {"candidate_id": cand.get("id"), "screening": scr_res, "outreach": out_res}
            results.append(cand_result)
            
        return results
