"""
DVT Talent AI — Analytics API
Dashboard KPIs, funnel metrics, campaign performance
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from db.models import (
    Company, Lead, Candidate, EmailSent, Interview,
    LeadStatus, CandidateStatus, EmailStatus, get_db
)
from api.routes.auth import get_current_user, User

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_kpis(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Main dashboard KPIs"""
    since = datetime.utcnow() - timedelta(days=days)

    # Companies discovered
    companies_total = (await db.execute(select(func.count(Company.id)))).scalar()
    companies_new = (await db.execute(
        select(func.count(Company.id)).where(Company.created_at >= since)
    )).scalar()

    # Leads
    leads_total = (await db.execute(select(func.count(Lead.id)))).scalar()
    leads_new = (await db.execute(
        select(func.count(Lead.id)).where(Lead.created_at >= since)
    )).scalar()
    leads_won = (await db.execute(
        select(func.count(Lead.id)).where(Lead.status == LeadStatus.WON)
    )).scalar()

    # Candidates
    candidates_total = (await db.execute(select(func.count(Candidate.id)))).scalar()
    candidates_new = (await db.execute(
        select(func.count(Candidate.id)).where(Candidate.created_at >= since)
    )).scalar()
    candidates_placed = (await db.execute(
        select(func.count(Candidate.id)).where(Candidate.status == CandidateStatus.PLACED)
    )).scalar()

    # Emails
    emails_sent = (await db.execute(
        select(func.count(EmailSent.id)).where(
            and_(EmailSent.created_at >= since, EmailSent.status != EmailStatus.DRAFT)
        )
    )).scalar()
    emails_opened = (await db.execute(
        select(func.count(EmailSent.id)).where(
            and_(EmailSent.created_at >= since, EmailSent.status == EmailStatus.OPENED)
        )
    )).scalar()
    emails_replied = (await db.execute(
        select(func.count(EmailSent.id)).where(
            and_(EmailSent.created_at >= since, EmailSent.status == EmailStatus.REPLIED)
        )
    )).scalar()

    # Interviews
    interviews_scheduled = (await db.execute(
        select(func.count(Interview.id)).where(Interview.created_at >= since)
    )).scalar()

    open_rate = round((emails_opened / emails_sent * 100) if emails_sent > 0 else 0, 1)
    reply_rate = round((emails_replied / emails_sent * 100) if emails_sent > 0 else 0, 1)
    win_rate = round((leads_won / leads_total * 100) if leads_total > 0 else 0, 1)
    placement_rate = round((candidates_placed / candidates_total * 100) if candidates_total > 0 else 0, 1)

    return {
        "period_days": days,
        "companies": {
            "total": companies_total,
            "new_this_period": companies_new,
        },
        "leads": {
            "total": leads_total,
            "new_this_period": leads_new,
            "won": leads_won,
            "win_rate": win_rate,
        },
        "candidates": {
            "total": candidates_total,
            "new_this_period": candidates_new,
            "placed": candidates_placed,
            "placement_rate": placement_rate,
        },
        "outreach": {
            "emails_sent": emails_sent,
            "emails_opened": emails_opened,
            "emails_replied": emails_replied,
            "open_rate": open_rate,
            "reply_rate": reply_rate,
        },
        "interviews": {
            "scheduled": interviews_scheduled,
        },
    }


@router.get("/lead-funnel")
async def get_lead_funnel(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lead pipeline funnel breakdown"""
    stages = [s.value for s in LeadStatus]
    funnel = []
    for stage in stages:
        count = (await db.execute(
            select(func.count(Lead.id)).where(Lead.status == stage)
        )).scalar()
        funnel.append({"stage": stage, "count": count})
    return {"funnel": funnel}


@router.get("/candidate-funnel")
async def get_candidate_funnel(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Candidate pipeline funnel breakdown"""
    stages = [s.value for s in CandidateStatus]
    funnel = []
    for stage in stages:
        count = (await db.execute(
            select(func.count(Candidate.id)).where(Candidate.status == stage)
        )).scalar()
        funnel.append({"stage": stage, "count": count})
    return {"funnel": funnel}


@router.get("/email-performance")
async def get_email_performance(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Daily email performance over time"""
    since = datetime.utcnow() - timedelta(days=days)
    # Group by day
    result = await db.execute(
        select(
            func.date(EmailSent.sent_at).label("date"),
            func.count(EmailSent.id).label("sent"),
            func.count(EmailSent.opened_at).label("opened"),
            func.count(EmailSent.replied_at).label("replied"),
        )
        .where(EmailSent.sent_at >= since)
        .group_by(func.date(EmailSent.sent_at))
        .order_by(func.date(EmailSent.sent_at))
    )
    rows = result.all()
    return {
        "data": [
            {
                "date": str(r.date),
                "sent": r.sent,
                "opened": r.opened,
                "replied": r.replied,
                "open_rate": round((r.opened / r.sent * 100) if r.sent > 0 else 0, 1),
            }
            for r in rows
        ]
    }


@router.get("/top-industries")
async def get_top_industries(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Top industries by company count"""
    result = await db.execute(
        select(Company.industry, func.count(Company.id).label("count"))
        .where(Company.industry.isnot(None))
        .group_by(Company.industry)
        .order_by(func.count(Company.id).desc())
        .limit(limit)
    )
    rows = result.all()
    return {"industries": [{"industry": r.industry, "count": r.count} for r in rows]}
