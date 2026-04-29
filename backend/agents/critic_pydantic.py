"""
DVT Talent AI — Critic Agent (Pydantic AI Version)
"""
from typing import List
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from backend.agents.pydantic_config import get_pydantic_model, AgentDeps

class AuditResult(BaseModel):
    passed: bool
    issues: List[str]
    hallucination_score: int = Field(ge=0, le=100)
    recommendation: str

critic_agent = Agent(
    get_pydantic_model(),
    deps_type=AgentDeps,
    result_type=AuditResult,
    system_prompt="You are a Logic Critic. Audit the output of other agents for hallucinations and errors."
)
