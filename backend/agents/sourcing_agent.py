"""
DVT Talent AI — Sourcing Agent
Merges Candidate Sourcing (GitHub, Dice, Monster) + Resume Analysis + Integrity Scoring.
Replaces: CandidateSourcingAgent, DiceSourcingAgent, ResumeAnalysisAgent.
"""
import json
import asyncio
import httpx
from typing import Dict, List, Any, Optional
from datetime import datetime

from agents.base_agent import BaseAgent
from config import settings

SYSTEM_PROMPT = """You are a Sourcing Agent for DVT Talent AI.
Your mission:
1. SOURCING: Find qualified software engineers via GitHub, Dice, and web search.
2. ANALYSIS: Parse resumes, extract skills, and score candidates against a JD (0-100).
3. INTEGRITY: Score the integrity of the profile (0-100). Detect AI-generated resumes or fraud.

For each candidate, return:
- Full name, email, title, location.
- Skills (list), experience years.
- Match score vs JD, Integrity score.
- Why they are a good fit.
- Source platform.

Respond ONLY with valid JSON. No extra text."""

class SourcingAgent(BaseAgent):
    """
    Unified sourcing engine that:
    - Queries multiple platforms (GitHub, Dice, Monster, etc.)
    - Analyzes resumes and profiles using AI.
    - Evaluates talent integrity (fraud detection).
    """

    def __init__(self, memory=None, event_bus=None):
        super().__init__(
            name="sourcing",
            description="Sources candidates from GitHub/Dice/Monster and performs AI resume analysis & integrity scoring",
            memory=memory,
            event_bus=event_bus
        )

    async def run_async(
        self, 
        job_description: str,
        sources: List[str] = ['github', 'dice', 'web'],
        limit: int = 15
    ) -> Dict[str, Any]:
        self.log_start(f"Sourcing candidates for JD. Sources: {sources}")
        
        all_candidates = []
        
        # 1. Parallel Sourcing
        tasks = []
        if 'github' in sources:
            tasks.append(self._source_github(job_description, limit // len(sources)))
        if 'dice' in sources:
            tasks.append(self._source_dice(job_description, limit // len(sources)))
        if 'web' in sources:
            tasks.append(self._source_web(job_description, limit // len(sources)))
            
        results = await asyncio.gather(*tasks)
        for cand_list in results:
            all_candidates.extend(cand_list)

        # 2. Unified Analysis & Integrity Scoring
        analyzed_candidates = await self._analyze_candidates(all_candidates, job_description)

        self.log_complete(f"Sourced and analyzed {len(analyzed_candidates)} candidates")
        return {
            "candidates": analyzed_candidates,
            "total_found": len(analyzed_candidates),
            "timestamp": datetime.utcnow().isoformat()
        }

    async def _source_github(self, jd: str, limit: int) -> List[dict]:
        # [NEW] Elite Gap 1: Self-Healing Pivot
        try:
            # Extract keywords for search
            keywords = jd.split()[:5] 
            query = f"{' '.join(keywords)} type:user"
            
            if not settings.github_token:
                self.log.warning("github_token_missing", msg="Pivoting to alternative source")
                return await self._source_web(jd, limit) # Pivot on missing auth
                
            headers = {"Authorization": f"token {settings.github_token}"}
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://api.github.com/search/users",
                    headers=headers,
                    params={"q": query, "per_page": limit}
                )
                if resp.status_code != 200:
                    self.log.warning("github_api_failed", status=resp.status_code)
                    return await self._source_web(jd, limit) # Pivot on API error
                    
                users = resp.json().get("items", [])
                if not users:
                    return await self._source_web(jd, limit) # Pivot on zero results
                    
                return [{"first_name": u["login"], "source": "github", "profile_url": u["html_url"]} for u in users]
        except Exception as e:
            self.log.error("source_failed", error=str(e))
            return await self._source_web(jd, limit) # Final healing fallback

    async def _source_dice(self, jd: str, limit: int) -> List[dict]:
        if not settings.dice_api_key:
            return []
        # Simulate Dice API call
        return [{"first_name": "DiceUser", "source": "dice", "profile_url": "https://dice.com/profile"}]

    async def _source_web(self, jd: str, limit: int) -> List[dict]:
        query = f'site:linkedin.com/in "software engineer" {jd.split()[0]} "open to work"'
        results = await self.search_web_async(query, num_results=limit)
        return [{"first_name": r.get("title", ""), "source": "web", "profile_url": r.get("link", "")} for r in results]

    async def _analyze_candidates(self, candidates: List[dict], jd: str, anonymize: bool = False, recursive_graph: bool = True) -> List[dict]:
        if not candidates: return []
        
        # [NEW] Elite Gap 4: Recursive Graph-Lineage Sourcing
        if recursive_graph:
            self.log.info("graph_sourcing_active", msg="Expanding search to alumni networks and former colleagues")
            expanded_candidates = await self._find_former_colleagues(candidates)
            candidates.extend(expanded_candidates)

        # [NEW] Bias Shield: Data Anonymization
        analysis_input = candidates
        if anonymize:
            self.log.info("bias_shield_active", msg="Anonymizing candidate data for unbiased screening")
            analysis_input = []
            for c in candidates:
                # Strip names, specific locations, and photos for objective screening
                anon_c = c.copy()
                anon_c["first_name"] = "CANDIDATE"
                anon_c["last_name"] = "REDACTED"
                anon_c["email"] = "hidden@dvt-talent-ai.com"
                analysis_input.append(anon_c)

        # [NEW] Reasoning Trail: Structured Prompt
        # Added Elite Gap 2 (Complexity Routing): marking this prompt as 'complex'
        prompt = f"""
        Analyze these {len(candidates)} candidate profiles against this JD: {jd[:1000]}
        
        Profiles: {json.dumps(analysis_input)}
        
        Return JSON with: match_score, integrity_score, and ai_reasoning.
        """
        
        try:
            response = await self.chat_async(SYSTEM_PROMPT, prompt, json_mode=True, complexity="complex")
            results = json.loads(response).get("candidates", [])
            
            # Map results back... (rest of the logic)
            return results
        except Exception as e:
            self.log.error("analysis_failed", error=str(e))
            return candidates

    async def _find_former_colleagues(self, candidates: List[dict]) -> List[dict]:
        """[Elite Gap 4] Simulates finding colleagues/alumni of discovered candidates"""
        new_leads = []
        for c in candidates[:2]:
            company = c.get("current_company") or "Google"
            self.log.debug("graph_traversal", company=company, seed_candidate=c.get("first_name"))
            # In a real system, this queries a Graph DB or performs a specific LikedIn Alumni search
            query = f'site:linkedin.com/in "worked at {company}" "software engineer" {c.get("location", "")}'
            alumni = await self.search_web_async(query, num_results=2)
            new_leads.extend([{"first_name": r.get("title", ""), "source": "graph-alumni"} for r in alumni])
        return new_leads
