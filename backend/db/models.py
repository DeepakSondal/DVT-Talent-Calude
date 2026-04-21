"""
DVT Talent AI — Database Models
Full PostgreSQL schema with SQLAlchemy async ORM
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, JSON, Enum, Index
    # FIX [M-02]: Removed unused BigInteger import
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func
import enum

from config import settings


# ── Engine & Session ────────────────────────────────────────────────────────
# Fallback to an in-memory DB if no URL is provided (prevents crashes during import/testing)
db_url = settings.database_url or "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    db_url,
    echo=settings.app_env == "development",
    # [NEW] Enterprise Hardening: Connection Pooling
    # Uses settings to handle high concurrency during pilots
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=30,
    pool_recycle=1800,
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# ── Base ─────────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Enums ────────────────────────────────────────────────────────────────────
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    RECRUITER = "recruiter"
    VIEWER = "viewer"


class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


class CandidateStatus(str, enum.Enum):
    SOURCED = "sourced"
    SCREENED = "screened"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    INTERVIEWING = "interviewing"
    OFFERED = "offered"
    PLACED = "placed"
    REJECTED = "rejected"


class EmailStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENT = "sent"
    OPENED = "opened"
    CLICKED = "clicked"
    REPLIED = "replied"
    BOUNCED = "bounced"
    UNSUBSCRIBED = "unsubscribed"


class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class AgentTaskStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    AWAITING_INPUT = "awaiting_input" # [NEW] Copilot Mode Pause State
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"


# ── Models ───────────────────────────────────────────────────────────────────
class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True)
    is_active = Column(Boolean, default=True)
    settings = Column(JSON, default=dict)
    subscription_plan = Column(String(50), default="starter")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.RECRUITER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(500))
    preferences = Column(JSON, default=dict)
    last_login = Column(DateTime(timezone=True))
    provider = Column(String(50))  # e.g. "google", "github", "linkedin"
    provider_id = Column(String(255))

    # Relationships
    tenant = relationship("Tenant")
    leads = relationship("Lead", back_populates="owner")
    campaigns = relationship("EmailCampaign", back_populates="owner")


class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    name = Column(String(255), nullable=False, index=True)
    domain = Column(String(255), unique=True)
    website = Column(String(500))
    linkedin_url = Column(String(500))
    industry = Column(String(100))
    size = Column(String(50))  # e.g. "51-200", "1001-5000"
    location = Column(String(255))
    description = Column(Text)
    tech_stack = Column(JSON, default=list)
    hiring_signals = Column(JSON, default=list)  # evidence they're hiring
    open_roles_count = Column(Integer, default=0)
    funding_stage = Column(String(100))
    revenue_range = Column(String(100))
    score = Column(Float, default=0.0)  # AI-computed prospect score
    is_client = Column(Boolean, default=False)
    meta_data = Column("metadata", JSON, default=dict)
    last_enriched = Column(DateTime(timezone=True))

    # Relationships
    leads = relationship("Lead", back_populates="company")
    jobs = relationship("Job", back_populates="company")

    __table_args__ = (
        Index("ix_companies_industry", "industry"),
        Index("ix_companies_score", "score"),
    )


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), index=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"))
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW, index=True)
    source = Column(String(100))  # how it was found
    score = Column(Float, default=0.0)
    notes = Column(Text)
    next_action = Column(String(255))
    next_action_date = Column(DateTime(timezone=True))
    value_estimate = Column(Float)
    meta_data = Column("metadata", JSON, default=dict)

    # Relationships
    owner = relationship("User", back_populates="leads")
    company = relationship("Company", back_populates="leads")
    contact = relationship("Contact")
    activities = relationship("Activity", back_populates="lead")


class Contact(Base, TimestampMixin):
    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), index=True)
    phone = Column(String(50))
    title = Column(String(255))
    department = Column(String(100))
    seniority = Column(String(50))
    linkedin_url = Column(String(500))
    twitter_url = Column(String(500))
    is_decision_maker = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    do_not_contact = Column(Boolean, default=False)
    meta_data = Column("metadata", JSON, default=dict)

    company = relationship("Company")

    # FIX: Removed duplicate ix_contacts_email (email column already has index=True)


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    requirements = Column(Text)
    location = Column(String(255))
    remote = Column(Boolean, default=False)
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    skills_required = Column(JSON, default=list)
    experience_years = Column(Integer)
    job_type = Column(String(50))
    source_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    posted_at = Column(DateTime(timezone=True))
    embedding_id = Column(String(255))  # ChromaDB reference

    company = relationship("Company", back_populates="jobs")
    candidates = relationship("JobCandidate", back_populates="job")
    # FIX [H-04]: Added missing back_populates target for Interview.job
    interviews = relationship("Interview", back_populates="job")


class Candidate(Base, TimestampMixin):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(50))
    title = Column(String(255))
    location = Column(String(255))
    linkedin_url = Column(String(500))
    github_url = Column(String(500))
    portfolio_url = Column(String(500))
    skills = Column(JSON, default=list)
    experience_years = Column(Integer)
    current_company = Column(String(255))
    current_salary = Column(Integer)
    expected_salary = Column(Integer)
    availability = Column(String(100))
    status = Column(Enum(CandidateStatus), default=CandidateStatus.SOURCED, index=True)
    source = Column(String(100))
    score = Column(Float, default=0.0)
    embedding_id = Column(String(255))  # ChromaDB reference
    ai_summary = Column(Text)
    do_not_contact = Column(Boolean, default=False)
    meta_data = Column("metadata", JSON, default=dict)

    resumes = relationship("Resume", back_populates="candidate")
    job_applications = relationship("JobCandidate", back_populates="candidate")
    emails_received = relationship("EmailSent", back_populates="candidate")
    interviews = relationship("Interview", back_populates="candidate")


class Resume(Base, TimestampMixin):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"), index=True)
    file_name = Column(String(255))
    file_url = Column(String(500))
    raw_text = Column(Text)
    parsed_data = Column(JSON, default=dict)
    score = Column(Float, default=0.0)
    embedding_id = Column(String(255))
    is_current = Column(Boolean, default=True)

    candidate = relationship("Candidate", back_populates="resumes")


class JobCandidate(Base, TimestampMixin):
    __tablename__ = "job_candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), index=True)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"), index=True)
    match_score = Column(Float, default=0.0)
    status = Column(Enum(CandidateStatus), default=CandidateStatus.SOURCED)
    notes = Column(Text)
    ai_reasoning = Column(Text)

    job = relationship("Job", back_populates="candidates")
    candidate = relationship("Candidate", back_populates="job_applications")


class EmailCampaign(Base, TimestampMixin):
    __tablename__ = "email_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    name = Column(String(255), nullable=False)
    campaign_type = Column(String(50))  # "candidate_outreach", "client_outreach"
    target_type = Column(String(50))   # "candidate" | "contact"
    subject_template = Column(Text)
    body_template = Column(Text)
    is_active = Column(Boolean, default=True)
    send_days = Column(JSON, default=list)  # ["Monday", "Tuesday"]
    send_time = Column(String(10))     # "09:00"
    total_sent = Column(Integer, default=0)
    total_opened = Column(Integer, default=0)
    total_replied = Column(Integer, default=0)
    meta_data = Column("metadata", JSON, default=dict)

    owner = relationship("User", back_populates="campaigns")
    emails = relationship("EmailSent", back_populates="campaign")


class EmailSent(Base, TimestampMixin):
    __tablename__ = "emails_sent"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("email_campaigns.id"), index=True)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"))
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"))
    to_email = Column(String(255), nullable=False)
    subject = Column(Text, nullable=False)
    body = Column(Text, nullable=False)
    status = Column(Enum(EmailStatus), default=EmailStatus.DRAFT, index=True)
    sent_at = Column(DateTime(timezone=True))
    opened_at = Column(DateTime(timezone=True))
    replied_at = Column(DateTime(timezone=True))
    microsite_url = Column(String(500))
    clicks_count = Column(Integer, default=0)
    gmail_message_id = Column(String(255))
    tracking_id = Column(String(255), unique=True, default=lambda: str(uuid.uuid4()))
    meta_data = Column("metadata", JSON, default=dict)

    campaign = relationship("EmailCampaign", back_populates="emails")
    candidate = relationship("Candidate", back_populates="emails_received")


class Interview(Base, TimestampMixin):
    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"), index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), index=True)
    interviewer_email = Column(String(255))
    scheduled_at = Column(DateTime(timezone=True))
    duration_minutes = Column(Integer, default=60)
    meeting_url = Column(String(500))
    status = Column(Enum(InterviewStatus), default=InterviewStatus.SCHEDULED)
    notes = Column(Text)
    feedback = Column(JSON, default=dict)
    calendar_event_id = Column(String(255))

    candidate = relationship("Candidate", back_populates="interviews")
    # FIX [H-04]: Added job back-reference
    job = relationship("Job", back_populates="interviews")


class Activity(Base, TimestampMixin):
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    activity_type = Column(String(50))  # "email_sent", "call", "note", "status_change"
    description = Column(Text)
    meta_data = Column("metadata", JSON, default=dict)

    lead = relationship("Lead", back_populates="activities")


class AgentTask(Base, TimestampMixin):
    __tablename__ = "agent_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    agent_name = Column(String(100), nullable=False, index=True)
    task_type = Column(String(100), nullable=False)
    status = Column(Enum(AgentTaskStatus), default=AgentTaskStatus.PENDING, index=True)
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    error_message = Column(Text)
    retries = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    celery_task_id = Column(String(255))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # [NEW] Copilot Mode State Tracking
    pipeline_mode = Column(String(50), default="autonomous") # 'autonomous' or 'copilot'
    current_checkpoint = Column(String(100)) # 'discovery_complete', 'sourcing_complete', etc.


class CreditBalance(Base, TimestampMixin):
    __tablename__ = "credit_balances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), unique=True)
    balance = Column(Integer, default=0)
    last_recharge = Column(DateTime(timezone=True))
    total_spent = Column(Integer, default=0)


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    action = Column(String(100), nullable=False)  # e.g. "VIEW_CANDIDATE", "UPDATE_CAMPAIGN"
    entity_type = Column(String(50))
    entity_id = Column(UUID(as_uuid=True))
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    meta_data = Column("metadata", JSON, default=dict)


class AnalyticsEvent(Base, TimestampMixin):
    __tablename__ = "analytics_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50))  # "lead", "candidate", "email", etc.
    entity_id = Column(UUID(as_uuid=True))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    properties = Column(JSON, default=dict)

    __table_args__ = (
        Index("ix_analytics_events_type_date", "event_type", "created_at"),
    )
