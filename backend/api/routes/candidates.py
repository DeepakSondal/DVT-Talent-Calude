"""
DVT Talent AI — Candidates API
Full candidate lifecycle management with AI scoring
"""
from typing import List, Optional
from uuid import UUID
import base64

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel, EmailStr
from datetime import datetime

from db.models import Candidate, Resume, CandidateStatus, get_db
from api.routes.auth import get_current_user, User

router = APIRouter()


class CandidateCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    skills: Optional[List[str]] = []
    experience_years: Optional[int] = None
    source: Optional[str] = "manual"


class CandidateOut(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    title: Optional[str]
    location: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    skills: Optional[List[str]]
    experience_years: Optional[int]
    current_company: Optional[str]
    status: str
    source: Optional[str]
    score: float
    ai_summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateList(BaseModel):
    items: List[CandidateOut]
    total: int
    page: int
    page_size: int


@router.get("", response_model=CandidateList)
async def list_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    min_score: Optional[float] = None,
    skill: Optional[str] = None,
    source: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Candidate)
    count_query = select(func.count(Candidate.id))

    if search:
        search_filter = (
            Candidate.first_name.ilike(f"%{search}%") |
            Candidate.last_name.ilike(f"%{search}%") |
            Candidate.email.ilike(f"%{search}%") |
            Candidate.title.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if status:
        query = query.where(Candidate.status == status)
        count_query = count_query.where(Candidate.status == status)

    if min_score is not None:
        query = query.where(Candidate.score >= min_score)
        count_query = count_query.where(Candidate.score >= min_score)

    if source:
        query = query.where(Candidate.source == source)
        count_query = count_query.where(Candidate.source == source)

    total = (await db.execute(count_query)).scalar()
    query = query.order_by(desc(Candidate.score)).offset((page - 1) * page_size).limit(page_size)
    candidates = (await db.execute(query)).scalars().all()

    return CandidateList(items=candidates, total=total, page=page, page_size=page_size)


@router.post("", response_model=CandidateOut, status_code=201)
async def create_candidate(
    data: CandidateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check duplicate
    existing = (await db.execute(select(Candidate).where(Candidate.email == data.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Candidate with this email already exists")

    candidate = Candidate(**data.model_dump())
    db.add(candidate)
    await db.commit()
    await db.refresh(candidate)
    return candidate


@router.get("/{candidate_id}", response_model=CandidateOut)
async def get_candidate(
    candidate_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.patch("/{candidate_id}/status")
async def update_candidate_status(
    candidate_id: UUID,
    status: CandidateStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    candidate.status = status
    await db.commit()
    return {"status": "updated", "new_status": status.value}


@router.post("/{candidate_id}/resume")
async def upload_resume(
    candidate_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload & AI-analyze resume"""
    if not file.filename.endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, TXT files allowed")

    content = await file.read()

    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Mark old resumes as not current
    old_resumes = (await db.execute(
        select(Resume).where(Resume.candidate_id == candidate_id, Resume.is_current == True)
    )).scalars().all()
    for r in old_resumes:
        r.is_current = False

    resume = Resume(
        candidate_id=candidate_id,
        file_name=file.filename,
        is_current=True,
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)

    # Background: parse + score resume
    background_tasks.add_task(
        analyze_resume_background,
        str(resume.id),
        content,
        file.filename,
    )

    return {"message": "Resume uploaded, analysis started", "resume_id": str(resume.id)}


@router.post("/{candidate_id}/score")
async def score_candidate(
    candidate_id: UUID,
    job_id: Optional[UUID] = None,
    # FIX [C-04]: Removed mutable default `BackgroundTasks()` — breaks FastAPI DI
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger AI scoring for a candidate"""
    if background_tasks is None:
        background_tasks = BackgroundTasks()
    background_tasks.add_task(score_candidate_background, str(candidate_id), str(job_id) if job_id else None)
    return {"message": "Scoring started", "candidate_id": str(candidate_id)}


async def analyze_resume_background(resume_id: str, content: bytes, filename: str):
    from workers.tasks import analyze_resume_task
    analyze_resume_task.delay(resume_id, base64.b64encode(content).decode(), filename)


async def score_candidate_background(candidate_id: str, job_id: Optional[str]):
    from workers.tasks import score_candidate_task
    score_candidate_task.delay(candidate_id, job_id)
