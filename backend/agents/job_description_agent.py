"""
DVT Talent AI — Job Description (JD) Optimizer Agent
Takes raw, messy job descriptions and transforms them into structured, 
high-converting JDs for better matching and outreach.
"""
import json
from typing import Dict, Any, Optional

from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are a specialized Job Description Architect for DVT Talent AI.
Your mission is to take messy, raw job descriptions and structure them into professional, 
high-converting technical JD objects.

You must:
1. Extract core tech stack (languages, frameworks, databases, cloud)
2. Identify "Must-Have" vs "Nice-to-Have" skills
3. Estimate years of experience required
4. Rewrite the 'About the Role' to be compelling for top-tier engineers
5. Identify potential 'Red Flags' or 'Ambiguities' in the raw text

Return ONLY valid JSON. sound professional and authoritative."""

class JobDescriptionAgent(BaseAgent):
    """
    Agent that cleanses and optimizes job descriptions before they are used 
    by other agents in the swarm.
    """
    
    def __init__(self):
        super().__init__(
            name="jd_optimizer",
            description="Optimizes and structures messy job descriptions into high-quality technical JDs",
        )

    async def run_async(self, raw_jd_text: str) -> Dict[str, Any]:
        self.log_start("Optimizing job description")
        
        user_prompt = f"""Optimize this raw job description text.
        
        RAW TEXT:
        {raw_jd_text[:3000]}
        
        Return JSON:
        {{
          "structured": {{
            "title": "Clean Role Title",
            "company_mission": "Short compelling mission statement",
            "core_stack": ["Python", "PostgreSQL", "AWS"],
            "must_haves": ["5+ years experience", "Distributed systems knowledge"],
            "nice_to_haves": ["Experience with ChromaDB", "Rust knowledge"],
            "benefits": ["Remote-first", "Competitive equity"],
            "experience_range": "5-8 years",
            "seniority_level": "Senior|Staff|Lead"
          }},
          "optimization_report": {{
            "clarity_score": 85,
            "improvements_made": ["Added clear tech stack list", "Clarified remote policy"],
            "missing_info": ["Salary range not specified", "Reporting structure unclear"]
          }},
          "suggested_outreach_hooks": ["Fast-growing fintech", "Solving complex scale issues"]
        }}"""
        
        try:
            response = await self.chat_async(SYSTEM_PROMPT, user_prompt, json_mode=True)
            result = json.loads(response)
            self.log_complete(f"JD Optimized: {result.get('structured', {}).get('title')}")
            return result
        except Exception as e:
            self.log_error(e)
            return {"error": str(e)}

    def run(self, raw_jd_text: str) -> Dict[str, Any]:
        # Sync wrapper if needed
        import asyncio
        return asyncio.run(self.run_async(raw_jd_text))
