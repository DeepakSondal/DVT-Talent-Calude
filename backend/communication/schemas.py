"""
DVT Talent AI — Communication Schemas
Type-safe data contracts for inter-agent events.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class BaseEventModel(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source_agent: Optional[str] = None

class CompanyEvent(BaseEventModel):
    name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    hiring_signals: List[str] = Field(default_factory=list)
    source: str = "discovery"

class LeadEvent(BaseEventModel):
    first_name: str
    last_name: str
    email: str
    title: Optional[str] = None
    company_domain: Optional[str] = None

class CandidateEvent(BaseEventModel):
    first_name: str
    last_name: str
    email: str
    skills: List[str] = Field(default_factory=list)
    score: float = 0.0
    integrity_score: Optional[int] = None
    source: str = "sourcing"

class JobEvent(BaseEventModel):
    title: str
    description: str
    required_skills: List[str] = Field(default_factory=list)
    location: Optional[str] = None
