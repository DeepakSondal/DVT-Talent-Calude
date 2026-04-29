"""
DVT Talent AI — Outreach Agent (Pydantic AI Version)
Handles hyper-personalized communication across LinkedIn and Email.
"""
from typing import List, Optional
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from backend.agents.pydantic_config import get_pydantic_model, AgentDeps

class OutreachDraft(BaseModel):
    subject: str
    body: str
    platform: str = Field(description="LinkedIn, Email, or SMS")
    personalization_score: int = Field(ge=0, le=100)

class OutreachSynthesis(BaseModel):
    status: str = Field(description="drafted, pending_approval, or sent")
    drafts: List[OutreachDraft]
    next_follow_up_days: int

outreach_agent = Agent(
    get_pydantic_model(),
    deps_type=AgentDeps,
    result_type=OutreachSynthesis,
    system_prompt=(
        "You are an Elite Outreach Agent for DVT Talent AI. "
        "Your goal is to draft hyper-personalized outreach sequences that don't sound like AI. "
        "Use candidate details to build rapport and explain 'Why them' and 'Why now'."
    ),
)
