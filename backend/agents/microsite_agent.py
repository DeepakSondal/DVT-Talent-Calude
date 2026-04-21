"""
DVT Talent AI — Microsite Agent
Generates hyper-personalized landing pages for outreach.
"""
from typing import Dict, Any
from agents.base_agent import BaseAgent

class MicrositeAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="microsite_generator",
            description="Generates personalized candidate landing pages"
        )

    async def generate_microsite(self, candidate: Dict[str, Any], job: Dict[str, Any]) -> str:
        """ 
        Generates a personalized content block for a microsite.
        Returns a JSON blob that the frontend can render.
        """
        self.log_start(f"Generating microsite for {candidate.get('first_name')}")
        
        prompt = f"""Generate a personalized pitch for this candidate.
        
        CANDIDATE: {candidate.get('first_name')} {candidate.get('last_name')}. Skills: {candidate.get('skills')}
        JOB: {job.get('title')} at {job.get('company_name')}.
        
        Return JSON with:
        - title: Personal pitch title
        - headline: Hook line
        - value_proposition: Why this role fits them
        - why_now: Why they should jump now
        """
        
        try:
            res = await self.chat_async(self.description, prompt, json_mode=True)
            return res
        except:
            return "{}"
