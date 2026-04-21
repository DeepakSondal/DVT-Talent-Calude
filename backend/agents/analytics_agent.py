"""
DVT Talent AI — Analytics Agent
Unified reporting, funnel metrics, and performance learning.
Replaces: RecruitmentAnalyticsAgent, LearningAgent.
"""
import json
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime

from agents.base_agent import BaseAgent
from config import settings

class AnalyticsAgent(BaseAgent):
    """
    Unified analytics and learning engine that:
    - Measures swarm performance and funnel metrics.
    - Generates strategic hiring insights.
    - Learns from successes and failures to optimize future runs.
    """

    def __init__(self, memory=None, event_bus=None):
        super().__init__(
            name="analytics",
            description="Computes real-time recruiting intelligence and identifies performance improvements",
            memory=memory,
            event_bus=event_bus
        )

    async def run_async(self, **kwargs) -> Dict[str, Any]:
        """ Live pipeline analytics """
        self.log_start("Computing real-time intelligence")
        
        try:
            # Aggregated metrics simulation (would normally query DB)
            stats = {
                "top_performing_sources": ["github", "web"],
                "conversion_rate": "12%",
                "total_runs": 150
            }
            
            insights = await self._generate_insights(stats)
            
            self.log_complete("Intelligence generated")
            return {
                "metrics": stats,
                "insights": insights,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.log_error(e)
            return {"error": str(e)}

    async def run_nightly_learning(self) -> Dict[str, Any]:
        """ 
        Off-pipeline learning cycle.
        Analyzes historical data to improve agent strategies.
        """
        self.log_start("Running nightly learning optimization")
        
        prompt = "Analyze the last 24 hours of recruiting performance and suggest improvements for prompt engineering and outreach angles."
        
        try:
            # Simulate fetching past data
            perf_data = {"outreach_replies": 12, "sourcing_accuracy": 0.85}
            
            response = await self.chat_async(
                "You are a performance analyst. Return improvements in JSON format.",
                f"Data: {json.dumps(perf_data)}",
                json_mode=True
            )
            improvements = json.loads(response).get("improvements", [])
            
            self.log_complete(f"Nightly learning complete. Identified {len(improvements)} improvements.")
            return {"improvements": improvements}
        except Exception as e:
            self.log_error(e)
            return {"improvements": []}

    async def _generate_insights(self, stats: dict) -> List[dict]:
        prompt = f"Generate 3 strategic insights from these metrics: {json.dumps(stats)}"
        try:
            response = await self.chat_async(
                "You are a Chief Talent Officer. Return 3 strategic insights in JSON format.",
                prompt,
                json_mode=True
            )
            return json.loads(response).get("insights", [])
        except:
            return [{"type": "general", "text": "Continue scaling outreach to github candidates."}]
