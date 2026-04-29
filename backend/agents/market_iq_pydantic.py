"""
DVT Talent AI — Market IQ Agent (Pydantic AI Version)
"""
from typing import List
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from backend.agents.pydantic_config import get_pydantic_model, AgentDeps

class MarketTrend(BaseModel):
    title: str
    impact: str = Field(description="High, Medium, or Low")
    details: str

class MarketIQReport(BaseModel):
    industry: str
    location: str
    trends: List[MarketTrend]
    hiring_difficulty: int = Field(ge=1, le=10)

market_iq_agent = Agent(
    get_pydantic_model(),
    deps_type=AgentDeps,
    result_type=MarketIQReport,
    system_prompt="You are a Market Intelligence Analyst. Analyze macro hiring trends."
)
