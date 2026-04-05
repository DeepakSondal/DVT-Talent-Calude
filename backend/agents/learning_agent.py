"""
DVT Talent AI — Learning Agent
Analyzes outreach performance (A/B tests) and optimizes 
template strategies based on real-world data (replies, opens).
"""
import json
from typing import Dict, List, Any

from agents.base_agent import BaseAgent

class LearningAgent(BaseAgent):
    """
    The feedback loop of the swarm. 
    Analyzes which outreach strategies are working and which are failing.
    """

    def __init__(self):
        super().__init__(
            name="learning_agent",
            description="Analyzes outreach data to optimize email templates and sourcing strategies",
        )

    async def run_async(self, campaign_stats: List[Dict[str, Any]]) -> Dict[str, Any]:
        self.log_start("Analyzing A/B testing performance")
        
        prompt = f"""Review these outreach statistics and determine the winning variation.
        
        CAMPAIGN DATA:
        {json.dumps(campaign_stats, indent=2)}
        
        Your Goal:
        1. Identify which Variation (A or B) has a higher reply rate.
        2. Identify common themes in Negative replies (why are they saying no?).
        3. Suggest a 'Challenger' template for the next round to beat the current 'Champion'.
        
        Return JSON:
        {{
          "winner": "A|B",
          "reasoning": "Why it won...",
          "negative_themes": ["Salary too low", "Not interested in [Tech]"],
          "suggested_new_challenger_angle": "Focus more on [Specific Perk]",
          "retire_variation": "Variation B because of 0% reply rate"
        }}"""
        
        try:
            # High-intelligence model for strategic analysis
            response = await self.chat_async(prompt, json_mode=True, temperature=0.2)
            result = json.loads(response)
            self.log_complete(f"Optimization complete. Winner: {result.get('winner')}")
            return result
        except Exception as e:
            self.log_error(e)
            return {"error": str(e)}

    def run(self, campaign_stats: List[Dict[str, Any]]) -> Dict[str, Any]:
        import asyncio
        return asyncio.run(self.run_async(campaign_stats))
