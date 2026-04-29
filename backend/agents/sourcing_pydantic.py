"""
DVT Talent AI — Sourcing Agent (Pydantic AI Version)
Implements high-fidelity candidate discovery and integrity verification.
"""
import json
from typing import List, Optional
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from backend.agents.pydantic_config import get_pydantic_model, AgentDeps
from backend.agents.tools.browser_tools import browser_tool

# ── Models ──────────────────────────────────────────────────────────────────

class Reasoning(BaseModel):
    strengths: List[str] = Field(description="Top 3 technical or cultural strengths")
    weaknesses: List[str] = Field(description="Potential areas for growth or red flags")
    alignment: str = Field(description="One-sentence executive summary of JD match")

class IntegrityScore(BaseModel):
    score: int = Field(ge=0, le=100, description="Probability that the profile is genuine (100 = high trust)")
    risk_factors: List[str] = Field(description="Signals of AI generation, bot-activity, or data mismatch")
    verdict: str = Field(description="Clear 'Trust' or 'Verify' recommendation")

class CandidateNode(BaseModel):
    full_name: str
    email: str
    title: str
    location: str
    current_company: Optional[str] = None
    match_score: int = Field(ge=0, le=100)
    skills: List[str]
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    ai_reasoning: Reasoning
    integrity_score: IntegrityScore
    source_platform: str

class SourcingSynthesis(BaseModel):
    candidates: List[CandidateNode]
    market_context: str = Field(description="AI's assessment of the current talent market for this role")

# ── Agent Definition ──────────────────────────────────────────────────────

sourcing_agent = Agent(
    get_pydantic_model(),
    deps_type=AgentDeps,
    result_type=SourcingSynthesis,
    system_prompt=(
        "You are an Elite Sourcing & Integrity Agent for DVT Talent AI. "
        "Your mission is to synthesize the best talent nodes for a specific job description. "
        "1. DISCOVER: Use tools to find candidates on GitHub and the Web. "
        "2. ANALYZE: Evaluate technical depth and JD alignment. "
        "3. AUDIT: Perform deep integrity scoring to detect fraudulent or low-quality profiles. "
        "Always provide a data-driven reasoning trail for your match scores."
    ),
)

# ── Tools ─────────────────────────────────────────────────────────────────

@sourcing_agent.tool
async def search_github_talent(ctx: RunContext[AgentDeps], keywords: str) -> str:
    """Finds top engineering talent on GitHub using technical keywords."""
    if not ctx.deps.github_token:
        return "ERROR: GitHub token missing. Skip GitHub search."
    
    url = "https://api.github.com/search/users"
    headers = {"Authorization": f"token {ctx.deps.github_token}"}
    params = {"q": f"{keywords} type:user", "per_page": 5}
    
    try:
        resp = await ctx.deps.http_client.get(url, headers=headers, params=params)
        if resp.status_code == 200:
            return json.dumps(resp.json().get("items", []))
        return f"GitHub API Error: {resp.status_code}"
    except Exception as e:
        return f"Search Failed: {str(e)}"

@sourcing_agent.tool
async def search_web_signals(ctx: RunContext[AgentDeps], query: str) -> str:
    """Scans LinkedIn and job boards for active talent signals via Serper API."""
    if not ctx.deps.serper_key:
        return "ERROR: Serper API key missing. Skip web search."
    
    url = "https://google.serper.dev/search"
    headers = {"X-API-KEY": ctx.deps.serper_key, "Content-Type": "application/json"}
    data = {"q": f"{query} site:linkedin.com/in", "num": 5}
    
    try:
        resp = await ctx.deps.http_client.post(url, headers=headers, json=data)
        return resp.text
    except Exception as e:
        return f"Web Search Failed: {str(e)}"

@sourcing_agent.tool
async def deep_research_on_web(ctx: RunContext[AgentDeps], candidate_goal: str) -> str:
    """
    Launches an autonomous browser to find 'hidden' info about a candidate.
    Use this if standard search results are incomplete or if you need to verify specific claims.
    Goal Example: 'Find the personal portfolio and latest blog post of John Doe'
    """
    return await browser_tool.execute_goal(candidate_goal)

# ── Execution Helper ──────────────────────────────────────────────────────

async def synthesize_talent(jd: str, tenant_id: str) -> SourcingSynthesis:
    """Entry point for the Sourcing Synthesis pipeline."""
    import httpx
    async with httpx.AsyncClient() as client:
        deps = AgentDeps(http_client=client, tenant_id=tenant_id)
        result = await sourcing_agent.run(
            f"Source and synthesize top talent for this role: {jd}",
            deps=deps
        )
        return result.data
