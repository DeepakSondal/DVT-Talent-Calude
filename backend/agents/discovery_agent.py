"""
DVT Talent AI — Discovery Agent
Merges Market Intelligence, Lead Discovery, and Job Description optimization.
Replaces: MarketIntelligenceAgent, LeadDiscoveryAgent, JobDescriptionAgent.
"""
import json
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime

from agents.base_agent import BaseAgent
from config import settings

SYSTEM_PROMPT = """You are a Discovery Agent for DVT Talent AI. 
Your mission is a three-fold discovery process:
1. MARKET: Identify companies in a specific industry/location that are actively hiring.
2. LEADS: Find HR/Engineering decision makers (VP Eng, CTO, Head of Talent) at those companies.
3. JOB ARCHITECTURE: Generate or optimize professional technical job descriptions.

For market discovery, extract: Company name, domain, industry, size, hiring signals, and prospect score (0-100).
For lead discovery, extract: Full name, title, email (guess if needed), and LinkedIn URL.
For JD optimization, extract: Title, core stack, must-haves, nice-to-haves, and experience range.

Respond ONLY with valid JSON. No extra text."""

class DiscoveryAgent(BaseAgent):
    """
    Unified discovery engine that:
    - Scans the market for hiring signals.
    - Finds decision makers at target companies.
    - Optimizes/Generates high-converting job descriptions.
    """

    def __init__(self, memory=None, event_bus=None):
        super().__init__(
            name="discovery",
            description="Scans market for hiring companies, finds decision makers, and optimizes JDs",
            memory=memory,
            event_bus=event_bus
        )

    async def run_async(
        self, 
        industry: str = "technology", 
        location: str = "United States", 
        limit: int = 10,
        raw_jd: Optional[str] = None
    ) -> Dict[str, Any]:
        self.log_start(f"Starting discovery for {industry} in {location}")
        
        results = {
            "companies": [],
            "leads": [],
            "optimized_jd": None,
            "timestamp": datetime.utcnow().isoformat()
        }

        try:
            # 1. Market Discovery (Parallel Search)
            companies = await self._discover_companies(industry, location, limit)
            results["companies"] = companies

            # 2. Lead Discovery for each company (Limited to top matches to avoid rate limits)
            lead_tasks = [self._discover_leads(c["name"], c["domain"]) for c in companies[:5]]
            leads_lists = await asyncio.gather(*lead_tasks)
            results["leads"] = [item for sublist in leads_lists for item in sublist]

            # 3. JD Optimization (if provided)
            if raw_jd:
                results["optimized_jd"] = await self._optimize_jd(raw_jd)

            # Signal progress
            for company in companies:
                await self.emit("new_company_discovered", company)

        except Exception as e:
            self.log_error(e)

        self.log_complete(f"Discovery complete. Found {len(results['companies'])} companies and {len(results['leads'])} leads.")
        return results

    async def _discover_companies(self, industry: str, location: str, limit: int) -> List[dict]:
        queries = [
            f'site:linkedin.com/jobs "{industry}" "software engineer" "hiring" 2024',
            f'"we are hiring" "{industry}" "senior engineer" site:greenhouse.io OR site:lever.co',
            f'"{industry}" startup "raised" million "Series" hiring engineers 2024',
        ]
        
        search_tasks = [self.search_web_async(q, num_results=5) for q in queries]
        search_results_list = await asyncio.gather(*search_tasks)
        raw_results = [r for sublist in search_results_list for r in sublist]

        if not raw_results:
            return []

        prompt = f"Identify {limit} companies actively hiring tech talent in {industry} @ {location}. Results: {json.dumps(raw_results[:15])}"
        
        try:
            response = await self.chat_async(SYSTEM_PROMPT, prompt, json_mode=True)
            return json.loads(response).get("companies", [])
        except:
            return []

    async def _discover_leads(self, company_name: str, company_domain: str) -> List[dict]:
        query = f'site:linkedin.com/in "{company_name}" ("VP Engineering" OR "CTO" OR "Head of Talent")'
        raw_results = await self.search_web_async(query, num_results=5)
        
        prompt = f"Find decision makers at {company_name} ({company_domain}). Results: {json.dumps(raw_results)}"
        
        try:
            response = await self.chat_async(SYSTEM_PROMPT, prompt, json_mode=True)
            return json.loads(response).get("contacts", [])
        except:
            return []

    async def _optimize_jd(self, raw_jd: str) -> Dict[str, Any]:
        prompt = f"Optimize this job description: {raw_jd[:2000]}"
        try:
            response = await self.chat_async(SYSTEM_PROMPT, prompt, json_mode=True)
            return json.loads(response).get("structured", {})
        except:
            return {"error": "JD optimization failed"}
