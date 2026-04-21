"""
DVT Talent AI — Market Pulse Alerts
Background listener for funding news, hiring spikes, and competitor movement.
"""
import asyncio
import structlog
from datetime import datetime
from agents.market_intelligence_agent import MarketIntelligenceAgent
from db.models import AsyncSessionLocal, Company
from sqlalchemy import select

log = structlog.get_logger(__name__)

async def check_market_pulse():
    """ periodically check for market shifts for key companies """
    log.info("market_pulse_check_started")
    agent = MarketIntelligenceAgent()
    
    async with AsyncSessionLocal() as session:
        # Check active clients' competitors or high-score prospects
        stmt = select(Company).where(Company.score > 80).limit(5)
        res = await session.execute(stmt)
        companies = res.scalars().all()
        
        for company in companies:
            try:
                # Perform deep intelligence pulse
                pulse_data = await agent.research_company_async(company.name, company.domain)
                
                # Check for "Trigger Events"
                has_funding = any("funding" in signal.lower() for signal in pulse_data.get("hiring_signals", []))
                hiring_spike = pulse_data.get("open_roles_count", 0) > (company.open_roles_count or 0) + 5
                
                if has_funding or hiring_spike:
                    log.info("market_pulse_trigger", company=company.name, funding=has_funding, spike=hiring_spike)
                    # Emit Pulse Signal
                    from agents.orchestrator import AgentOrchestrator
                    orch = AgentOrchestrator()
                    await orch._emit_signal(
                        "market_pulse", 
                        f"ALERT: {company.name} showing high hiring intent!",
                        {"company": company.name, "funding": has_funding, "spike": hiring_spike}
                    )
            except Exception as e:
                log.error("pulse_failed", company=company.name, error=str(e))

if __name__ == "__main__":
    asyncio.run(check_market_pulse())
