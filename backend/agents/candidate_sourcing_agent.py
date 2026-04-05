"""
DVT Talent AI — Candidate Sourcing Agent
Finds qualified developers via GitHub, LinkedIn, job boards, and web search.
Sources: GitHub, LinkedIn, Stack Overflow, AngelList, Dice, Monster, Indeed
"""
import json
from typing import Dict, List, Any, Optional

import httpx

from agents.base_agent import BaseAgent
from config import settings


SYSTEM_PROMPT = """You are a Candidate Sourcing Agent for DVT Talent AI.
Your mission: find qualified software engineers and technical candidates.

For each candidate, extract:
- Full name (first + last)
- Email (if visible)
- Current title/role
- Location
- Years of experience (estimate from profile)
- Top skills (list)
- Current company
- GitHub/LinkedIn/portfolio URLs
- Why they're a strong candidate
- Availability signal (actively looking? open to work?)
- Source platform

Return ONLY valid JSON. No extra text."""


class CandidateSourcingAgent(BaseAgent):
    """
    Sources candidates from multiple free and API-based platforms:
    - GitHub: by language, stars, contributions
    - LinkedIn: via web scraping signals
    - Stack Overflow: Developer stories
    - Dice.com / Monster.com: Job seeker profiles
    - Indeed: Resume search
    - AngelList/Wellfound: Startup talent
    """

    def __init__(self):
        super().__init__(
            name="candidate_sourcing",
            description="Sources qualified technical candidates from GitHub, LinkedIn, job boards",
        )

    def run(
        self,
        job_title: str,
        skills: List[str],
        location: Optional[str] = None,
        experience_years: int = 3,
        limit: int = 20,
    ) -> Dict[str, Any]:
        self.log_start(f"Sourcing candidates for: {job_title} | Skills: {skills}")
        all_candidates = []

        try:
            # Source from GitHub
            github_candidates = self._source_from_github(skills, location, limit // 3)
            all_candidates.extend(github_candidates)

            # Source from job boards via web search
            web_candidates = self._source_from_web(job_title, skills, location, limit // 3)
            all_candidates.extend(web_candidates)

            # Source from LinkedIn signals
            linkedin_candidates = self._source_from_linkedin_signals(job_title, skills, location, limit // 3)
            all_candidates.extend(linkedin_candidates)

            # Deduplicate by email/name
            all_candidates = self._deduplicate(all_candidates)

        except Exception as e:
            self.log_error(e)

        self.log_complete(f"Sourced {len(all_candidates)} candidates for {job_title}")
        return {
            "candidates": all_candidates[:limit],
            "total_found": len(all_candidates),
            "job_title": job_title,
            "skills": skills,
        }

    def _source_from_github(self, skills: List[str], location: Optional[str], limit: int) -> List[dict]:
        """Find developers via GitHub Search API"""
        candidates = []
        if not settings.github_token:
            self.log.warning("github_token_missing", msg="GitHub sourcing skipped")
            return candidates

        skill_query = " OR ".join([f"language:{s.lower()}" for s in skills[:3]])
        location_query = f" location:{location}" if location else ""
        query = f"{skill_query}{location_query} followers:>50"

        try:
            headers = {
                "Authorization": f"token {settings.github_token}",
                "Accept": "application/vnd.github.v3+json",
            }
            with httpx.Client(timeout=30) as client:
                resp = client.get(
                    "https://api.github.com/search/users",
                    headers=headers,
                    params={"q": query, "sort": "followers", "per_page": min(limit, 30)},
                )
                if resp.status_code == 200:
                    users = resp.json().get("items", [])
                    import time
                    for user in users[:limit]:
                        # Fetch full profile
                        time.sleep(1) # GitHub API rate limiting
                        profile_resp = client.get(
                            f"https://api.github.com/users/{user['login']}",
                            headers=headers,
                        )
                        if profile_resp.status_code == 200:
                            profile = profile_resp.json()
                            candidates.append({
                                "first_name": (profile.get("name") or user["login"]).split()[0] if (profile.get("name") or user["login"]) else user["login"],
                                "last_name": " ".join((profile.get("name") or "").split()[1:]) or "",
                                "email": profile.get("email"),
                                "title": profile.get("bio", "")[:100] if profile.get("bio") else "Software Engineer",
                                "location": profile.get("location"),
                                "github_url": user["html_url"],
                                "skills": skills,
                                "source": "github",
                                "github_repos": profile.get("public_repos", 0),
                                "github_followers": profile.get("followers", 0),
                            })
        except Exception as e:
            self.log.warning("github_search_failed", error=str(e))

        return candidates

    def _source_from_web(self, job_title: str, skills: List[str], location: Optional[str], limit: int) -> List[dict]:
        """Find candidates via web search on Dice, Monster, Stack Overflow, etc."""
        skills_str = " ".join(skills[:3])
        location_str = location or "United States"
        queries = [
            f'site:linkedin.com/in "open to work" "{job_title}" {skills_str}',
            f'site:stackoverflow.com/users "{job_title}" "{skills[0] if skills else "Python"}"',
            f'"{job_title}" resume {skills_str} "{location_str}" filetype:pdf OR site:dice.com',
            f'site:wellfound.com/u "{job_title}" {skills_str}',
        ]

        raw_results = []
        for q in queries[:2]:
            raw_results.extend(self.search_web(q, num_results=5))

        if not raw_results:
            return []

        return self._extract_candidates_with_ai(raw_results, job_title, skills, location, limit)

    def _source_from_linkedin_signals(self, job_title: str, skills: List[str], location: Optional[str], limit: int) -> List[dict]:
        """Find candidates via LinkedIn public signals"""
        skills_str = " ".join(skills[:2])
        location_str = location or ""
        queries = [
            f'site:linkedin.com/in "{job_title}" {skills_str} {location_str}',
            f'linkedin.com/in "{job_title}" "{skills[0] if skills else "Python"}" "#opentowork"',
        ]
        raw_results = []
        for q in queries:
            raw_results.extend(self.search_web(q, num_results=5))

        return self._extract_candidates_with_ai(raw_results, job_title, skills, location, limit)

    def _extract_candidates_with_ai(
        self,
        results: List[dict],
        job_title: str,
        skills: List[str],
        location: Optional[str],
        limit: int,
    ) -> List[dict]:
        snippets = "\n\n".join([
            f"Title: {r.get('title', '')}\nURL: {r.get('link', '')}\nSnippet: {r.get('snippet', '')}"
            for r in results[:12]
        ])

        user_prompt = f"""Find up to {limit} qualified candidates for: {job_title}
Required skills: {', '.join(skills)}
Location: {location or 'Any'}

Search results:
{snippets}

Return JSON:
{{
  "candidates": [
    {{
      "first_name": "Alex",
      "last_name": "Johnson",
      "email": null,
      "title": "Senior Software Engineer",
      "location": "San Francisco, CA",
      "linkedin_url": "https://linkedin.com/in/alexjohnson",
      "github_url": null,
      "skills": ["Python", "AWS", "Docker"],
      "experience_years": 6,
      "current_company": "Acme Corp",
      "source": "linkedin",
      "availability_signal": "open to work",
      "why_good_fit": "Strong Python background with cloud experience"
    }}
  ]
}}"""

        try:
            response = self.chat(SYSTEM_PROMPT, user_prompt, json_mode=True, temperature=0.2)
            data = json.loads(response)
            return data.get("candidates", [])
        except Exception as e:
            self.log.warning("candidate_extraction_failed", error=str(e))
            return []

    def _deduplicate(self, candidates: List[dict]) -> List[dict]:
        """Remove duplicates by email or name"""
        import uuid
        seen = set()
        unique = []
        for c in candidates:
            key = c.get("email") or f"{c.get('first_name', '')}{c.get('last_name', '')}".lower()
            if not key:
                key = str(uuid.uuid4())
            if key not in seen:
                seen.add(key)
                unique.append(c)
        return unique
