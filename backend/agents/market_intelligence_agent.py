"""
DVT Talent AI — Market Intelligence Agent
Scans the internet for hiring signals and discovers companies actively recruiting.
"""
import json
from typing import Dict, List, Any
from datetime import datetime

from agents.base_agent import BaseAgent


SYSTEM_PROMPT = """You are a Market Intelligence Agent for DVT Talent AI, a specialized recruiting firm.
Your job is to analyze search results and identify companies that are actively hiring software engineers
and technical talent.

For each company found, extract:
- Company name
- Domain/website
- Industry
- Estimated company size
- Hiring signals (job postings, growth news, funding, etc.)
- Estimated number of open technical roles
- Prospect score (0-100): how valuable is this company as a recruiting client?
- Why they are a good recruiting target

Respond ONLY with valid JSON. No extra text.
"""


class MarketIntelligenceAgent(BaseAgent):
    """
    Discovers companies that are actively hiring by:
    1. Searching job boards for recent postings
    2. Monitoring funding news (companies that raised = companies hiring)
    3. Tracking tech layoffs at competitors (displaced talent)
    4. Watching LinkedIn job growth signals
    """

    def __init__(self):
        super().__init__(
            name="market_intelligence",
            description="Scans internet for companies actively hiring tech talent",
        )

    def run(self, industry: str = "technology", location: str = "United States", limit: int = 20) -> Dict[str, Any]:
        self.log_start(f"Scanning for hiring companies in {industry}/{location}")
        companies = []

        try:
            # Strategy 1: Search for companies with active job postings
            job_queries = [
                f'site:linkedin.com/jobs "{industry}" "software engineer" "hiring" 2024',
                f'"we are hiring" "{industry}" "senior engineer" site:greenhouse.io OR site:lever.co',
                f'"{industry}" company "multiple openings" software engineer "{location}"',
                f'startups hiring "{industry}" engineers "{location}" 2024',
            ]

            raw_results = []
            for query in job_queries[:2]:  # Limit API calls
                results = self.search_web(query, num_results=5)
                raw_results.extend(results)

            # Strategy 2: Funding news = hiring signal
            funding_results = self.search_web(
                f'"{industry}" startup "raised" million "Series" hiring engineers 2024',
                num_results=5,
            )
            raw_results.extend(funding_results)

            # AI analysis of results
            if raw_results:
                seen_urls = set()
                deduped = []
                for r in raw_results:
                    url = r.get("link", "")
                    if url not in seen_urls:
                        seen_urls.add(url)
                        deduped.append(r)
                companies = self._analyze_with_ai(deduped, industry, location, limit)

        except Exception as e:
            self.log_error(e)
            companies = []

        self.log_complete(f"Discovered {len(companies)} hiring companies")
        return {"companies": companies, "scanned_at": datetime.utcnow().isoformat()}

    def _analyze_with_ai(
        self, results: List[dict], industry: str, location: str, limit: int
    ) -> List[dict]:
        """Use AI to extract structured company data from search results"""
        snippets = "\n\n".join([
            f"Title: {r.get('title', '')}\nURL: {r.get('link', '')}\nSnippet: {r.get('snippet', '')}"
            for r in results[:15]
        ])

        user_prompt = f"""Analyze these search results and identify {limit} companies actively hiring 
tech talent in {industry} in {location}.

Search Results:
{snippets}

Return JSON with this exact structure:
{{
  "companies": [
    {{
      "name": "Company Name",
      "domain": "company.com",
      "website": "https://company.com",
      "industry": "{industry}",
      "size": "51-200",
      "location": "{location}",
      "description": "Brief company description",
      "hiring_signals": ["raised Series B", "multiple job postings on LinkedIn"],
      "open_roles_count": 12,
      "score": 85,
      "prospect_reason": "Fast-growing SaaS company with strong engineering demand"
    }}
  ]
}}"""

        try:
            response = self.chat(SYSTEM_PROMPT, user_prompt, json_mode=True, temperature=0.2)
            data = json.loads(response)
            companies = data.get("companies", [])
            if not companies:
                self.log.warning("no_companies_parsed", msg="AI returned empty companies list from search results")
            return companies
        except (json.JSONDecodeError, KeyError) as e:
            self.log.warning("ai_parse_error", error=str(e))
            return []

    def discover_funded_companies(self, min_amount_million: int = 10) -> List[dict]:
        """Find recently funded companies (strong hiring signal)"""
        queries = [
            f'raised million Series funding "will use funds" hiring 2024 software',
            f'TechCrunch funding round "engineering team" 2024',
        ]
        results = []
        for q in queries:
            result = self.search_web(q, num_results=5)
            results.extend(result)

    def map_competitor_talent(self, target_company: str, top_k: int = 5) -> Dict[str, Any]:
        """
        Analyze where a target company's engineering talent is coming from.
        Logic: Scans LinkedIn and GitHub for current employees and extracts their 'Past Companies'.
        """
        self.log_start(f"Mapping talent origin for {target_company}")
        
        # Simulate search result logic
        query = f'site:linkedin.com/in "{target_company}" "past company"'
        results = self.search_web(query, num_results=10)
        
        snippets = "\n".join([r.get("snippet", "") for r in results])
        
        prompt = f"""Identify the most frequent 'Former Companies' for current employees at {target_company}.
        
        SEARCH SNIPPETS:
        {snippets}
        
        Return JSON:
        {{
          "target": "{target_company}",
          "feeder_companies": [
            {{"name": "Google", "relevance": 0.85, "count_detected": 12}},
            {{"name": "Meta", "relevance": 0.72, "count_detected": 8}}
          ],
          "advice": "Company {target_company} seems to poach heavily from [X]. Recruiter should target candidates at [X] seeking career advancement."
        }}"""
        
        try:
            response = self.chat(SYSTEM_PROMPT, prompt, json_mode=True)
            return json.loads(response)
        except Exception:
            return {"target": target_company, "feeder_companies": [], "error": "analysis_failed"}

