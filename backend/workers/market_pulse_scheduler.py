"""
DVT Talent AI — Market Pulse Scheduler
Daily heartbeat that triggers autonomous discovery swarm.
"""
import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from agents.orchestrator import AgentOrchestrator

log = structlog.get_logger(__name__)

class MarketPulseScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.orchestrator = AgentOrchestrator()

    async def trigger_market_pulse(self):
        """
        Executes the broad-spectrum discovery scan for high-growth sectors.
        """
        sectors = ["Generative AI", "Cybersecurity", "Fintech", "HealthTech"]
        log.info("triggering_market_pulse", sectors=sectors)
        
        for sector in sectors:
            try:
                # Trigger parallel discovery for each sector using the simplified pipeline
                await self.orchestrator.run_full_pipeline(
                    industry=sector, 
                    location="Global"
                )
            except Exception as e:
                log.error("market_pulse_sector_failed", sector=sector, error=str(e))

    def start(self):
        """ Schedule the pulse to run every 24 hours """
        # Run once immediately on startup, then every 24 hours
        self.scheduler.add_job(self.trigger_market_pulse, 'interval', hours=24)
        self.scheduler.start()
        log.info("market_pulse_scheduler_started", interval="24h")

    def shutdown(self):
        self.scheduler.shutdown()
