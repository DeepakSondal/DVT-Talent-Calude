"""
DVT Talent AI — Leads API  (FIXED [H-01]: was 7-line stub)
Full CRUD + pipeline management
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Lead, LeadStatus, Activity, get_db
from api.routes.auth import get_current_user, User

router = APIRouter()


class LeadCreate(BaseModel):
    company_id: UUID
    contact_id: Optional[UUID] = None
    source: Optional[str] = "manual"
    notes: Optional[str] = None
    value_estimate: Optional[float] = None


class LeadUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    notes: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None
    value_estimate: Optional[float] = None
    score: Optional[float] = None


class LeadOut(BaseModel):
    id: UUID
    company_id: Optional[UUID]
    contact_id: Optional[UUID]
    status: LeadStatus
    source: Optional[str]
    score: float
    notes: Optional[str]
    next_action: Optional[str]
    next_action_date: Optional[datetime]
    value_estimate: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("")
async def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Lead).where(Lead.owner_id == current_user.id)
    count_q = select(func.count(Lead.id)).where(Lead.owner_id == current_user.id)
    if status:
        query = query.where(Lead.status == status)
        count_q = count_q.where(Lead.status == status)
    total = (await db.execute(count_q)).scalar()
    query = query.order_by(desc(Lead.score)).offset((page - 1) * page_size).limit(page_size)
    items = (await db.execute(query)).scalars().all()
    return {"items": [LeadOut.model_validate(i) for i in items], "total": total, "page": page, "page_size": page_size}


@router.post("", status_code=201)
async def create_lead(data: LeadCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    lead = Lead(**data.model_dump(exclude_none=True), owner_id=current_user.id)
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return LeadOut.model_validate(lead)


@router.get("/{lead_id}")
async def get_lead(lead_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Lead).where(Lead.id == lead_id, Lead.owner_id == current_user.id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadOut.model_validate(lead)


@router.patch("/{lead_id}")
async def update_lead(lead_id: UUID, data: LeadUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Lead).where(Lead.id == lead_id, Lead.owner_id == current_user.id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    old_status = lead.status
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(lead, field, value)
    if data.status and data.status != old_status:
        db.add(Activity(lead_id=lead_id, user_id=current_user.id, activity_type="status_change", description=f"Status: {old_status} → {data.status}"))
    await db.commit()
    await db.refresh(lead)
    return LeadOut.model_validate(lead)


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(lead_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Lead).where(Lead.id == lead_id, Lead.owner_id == current_user.id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    await db.delete(lead)
    await db.commit()
