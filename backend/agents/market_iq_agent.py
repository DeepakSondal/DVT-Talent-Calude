"""
DVT Talent AI — Market Intelligence Agent (Market IQ)
Analyzes macro-trends, competitor hiring signals, and skill demand.
Provides a "God View" of the talent market.
"""
from typing import Dict, Any, List
from agents.base_agent import BaseAgent
import json
from datetime import datetime

class MarketIntelligenceAgent(BaseAgent):
    def __init__(self, memory=None, event_bus=None):
        super().__init__(
            name="market_iq",
            description="Analyzes talent market trends, skill demand surges, and competitor hiring velocity",
            memory=memory,
            event_bus=event_bus
        )

    async def run_async(self, industry: str, location: str) -> Dict[str, Any]:
        """Performs a Macro-Market analysis for a specific sector"""
        self.log_start(f"Generating Market IQ report for {industry} in {location}")
        
        # 1. Gather Macro Data (External Search)
        # We look for news, layoffs, and hiring surges in the specific sector
        queries = [
            f"hiring trends in {industry} {location} {datetime.now().year}",
            f"top skills demanded for {industry} in {location}",
            f"competitor hiring companies in {industry} {location}"
        ]
        
        market_evidence = []
        for q in queries:
            results = await self.search_web_async(q, num_results=3)
            market_evidence.extend(results)

        # 2. Synthesize Intelligence
        # Use LLM to identify shifts and recommendations
        prompt = f"""
        ACT AS: A Senior Talent Strategy Consultant.
        TASK: Synthesize this market evidence into a 'Market IQ' report.
        
        INDUSTRY: {industry}
        LOCATION: {location}
        EVIDENCE: {json.dumps(market_evidence)}
        
        OUTPUT JSON:
        {{
            "market_state": "hot/neutral/cool",
            "trending_skills": ["list", "of", "surging", "skills"],
            "competitor_activity": "summary of who is hiring",
            "salary_sentiment": "estimated market movement",
            "strategic_advice": "what the recruiter should do differently"
        }}
        """
        
        try:
            # We use complex routing here because Market Strategy requires high-level synthesis
            response = await self.chat_async("You are a Market IQ Analyst.", prompt, json_mode=True, complexity="complex")
            result = json.loads(response)
            
            self.log_complete(f"Market IQ generated for {industry}")
            return result
        except Exception as e:
            self.log_error(e)
            return {"error": "Failed to generate market intelligence"}
