"""
DVT Talent AI — Database Migration (Alembic)
Run: alembic upgrade head
"""
# alembic/env.py equivalent — run via CLI:
# alembic init alembic
# alembic revision --autogenerate -m "initial"
# alembic upgrade head

MIGRATION_COMMANDS = """
# ── Initial Setup ──────────────────────────────────────────────────────────
# 1. Install alembic: pip install alembic
# 2. Initialize: alembic init alembic
# 3. Edit alembic/env.py to import your models:

#   from db.models import Base
#   target_metadata = Base.metadata

# 4. Generate first migration:
#   alembic revision --autogenerate -m "initial_schema"

# 5. Apply migration:
#   alembic upgrade head

# ── Or use direct table creation (development only) ────────────────────────
# The app auto-creates tables on startup in development mode.
# For production, always use Alembic migrations.
"""

# Direct SQL schema for reference
SCHEMA_SQL = """
-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'recruiter',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    website VARCHAR(500),
    linkedin_url VARCHAR(500),
    industry VARCHAR(100),
    size VARCHAR(50),
    location VARCHAR(255),
    description TEXT,
    tech_stack TEXT[],
    hiring_signals JSONB DEFAULT '[]',
    open_roles_count INTEGER DEFAULT 0,
    funding_stage VARCHAR(100),
    score FLOAT DEFAULT 0.0,
    is_client BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    last_enriched TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    title VARCHAR(255),
    department VARCHAR(100),
    seniority VARCHAR(50),
    linkedin_url VARCHAR(500),
    is_decision_maker BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    do_not_contact BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    contact_id UUID REFERENCES contacts(id),
    status VARCHAR(50) DEFAULT 'new',
    source VARCHAR(100),
    score FLOAT DEFAULT 0.0,
    notes TEXT,
    next_action VARCHAR(255),
    next_action_date TIMESTAMPTZ,
    value_estimate FLOAT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    location VARCHAR(255),
    remote BOOLEAN DEFAULT FALSE,
    salary_min INTEGER,
    salary_max INTEGER,
    skills_required TEXT[],
    experience_years INTEGER,
    job_type VARCHAR(50),
    source_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    posted_at TIMESTAMPTZ,
    embedding_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidates
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    title VARCHAR(255),
    location VARCHAR(255),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    skills TEXT[],
    experience_years INTEGER,
    current_company VARCHAR(255),
    current_salary INTEGER,
    expected_salary INTEGER,
    availability VARCHAR(100),
    status VARCHAR(50) DEFAULT 'sourced',
    source VARCHAR(100),
    score FLOAT DEFAULT 0.0,
    embedding_id VARCHAR(255),
    ai_summary TEXT,
    do_not_contact BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resumes
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id),
    file_name VARCHAR(255),
    file_url VARCHAR(500),
    raw_text TEXT,
    parsed_data JSONB DEFAULT '{}',
    score FLOAT DEFAULT 0.0,
    embedding_id VARCHAR(255),
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50),
    target_type VARCHAR(50),
    subject_template TEXT,
    body_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    send_days TEXT[],
    send_time VARCHAR(10),
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_replied INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emails Sent
CREATE TABLE IF NOT EXISTS emails_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES email_campaigns(id),
    candidate_id UUID REFERENCES candidates(id),
    contact_id UUID REFERENCES contacts(id),
    to_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    gmail_message_id VARCHAR(255),
    tracking_id VARCHAR(255) UNIQUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interviews
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id),
    job_id UUID REFERENCES jobs(id),
    interviewer_email VARCHAR(255),
    scheduled_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 60,
    meeting_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    feedback JSONB DEFAULT '{}',
    calendar_event_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    user_id UUID REFERENCES users(id),
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Tasks
CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(100) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    retries INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    celery_task_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_score ON companies(score DESC);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_score ON candidates(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_emails_sent_status ON emails_sent(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, created_at);
"""
