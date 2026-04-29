"""
DVT Talent AI — Discovery Agent (Pydantic AI Version)
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from backend.agents.pydantic_config import get_pydantic_model, AgentDeps

class OptimizedJD(BaseModel):
    title: str
    core_stack: List[str]
    must_haves: List[str]
    nice_to_haves: List[str]
    experience_range: str

class DiscoveryResult(BaseModel):
    job_description: str
    optimized_jd_details: OptimizedJD
    leads_found_count: int

discovery_agent = Agent(
    get_pydantic_model(),
    deps_type=AgentDeps,
    result_type=DiscoveryResult,
    system_prompt="You are a Discovery Agent. Find hiring signals and optimize job descriptions."
)

@discovery_agent.tool
async def search_leads(ctx: RunContext[AgentDeps], company: str) -> str:
    """Finds decision makers at a specific company."""
    return f"Found 3 leads at {company}"
