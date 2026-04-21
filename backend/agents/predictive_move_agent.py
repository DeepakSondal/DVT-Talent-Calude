"""
DVT Talent AI — Predictive Move Agent
Predicts a candidate's "Propensity to Leave" their current role.
Uses market signals, company health, and tenure analytics.
"""
from typing import Dict, Any, List
from agents.base_agent import BaseAgent
import json

class PredictiveMoveAgent(BaseAgent):
    def __init__(self, memory=None, event_bus=None):
        super().__init__(
            name="predictive_move",
            description="Predicts the likelihood of a candidate being open to a new role based on macro-signals",
            memory=memory,
            event_bus=event_bus
        )

    async def run_async(self, candidate_data: Dict[str, Any], company_news: List[str] = None) -> Dict[str, Any]:
        """Calculates a Propensity Score (0-100)"""
        self.log_start(f"Analyzing move propensity for {candidate_data.get('email')}")
        
        prompt = f"""
        ACT AS: A Behavioral Talent Analyst.
        CANDIDATE: {json.dumps(candidate_data)}
        COMPANY NEWS: {json.dumps(company_news or [])}
        
        CALCULATE: Propensity to Leave Score (0-100).
        FACTORS:
        1. Tenure: 2-3 years in a role is peak 'move' window.
        2. Company Signals: Are there layoffs? Stock drops? Glassdoor sentiment?
        3. Career Progression: Is the candidate 'stagnant' in their current role?
        
        Respond with JSON:
        {{
            "propensity_score": int,
            "confidence": float,
            "primary_trigger": "string (e.g., tenure peak)",
            "outreach_angle": "recommended hook for the message"
        }}
        """
        
        try:
            response = await self.chat_async("You are a high-accuracy predictive analyst.", prompt, json_mode=True, complexity="simple")
            return json.loads(response)
        except Exception as e:
            self.log_error(e)
            return {"propensity_score": 50, "primary_trigger": "unknown"}
