import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from deps import CurrentUser, DbSession, verify_internal_api_key
from models.job import Job
from models.job_match_score import JobMatchScore
from schemas.job import JobListResponse, JobResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["jobs"])


# ── Job search ────────────────────────────────────────────────────────────────


@router.get("", response_model=JobListResponse)
async def list_jobs(
    user: CurrentUser,
    db: DbSession,
    query: str | None = Query(None),
    location: str | None = Query(None),
    location_type: list[str] | None = Query(None),
    salary_min: float | None = Query(None),
    category: str | None = Query(None),
    source: str | None = Query(None),
    company_id: uuid.UUID | None = Query(None),
    experience_level: list[str] | None = Query(None),
    employment_type: list[str] | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = Query("posted_at"),
) -> JobListResponse:
    stmt = select(Job).where(Job.is_active.is_(True))

    if query:
        fts = text(
            "to_tsvector('english', "
            "coalesce(title, '') || ' ' || coalesce(company, '') || ' ' || coalesce(description, '')) "
            "@@ plainto_tsquery('english', :query)"
        )
        stmt = stmt.where(fts.bindparams(query=query))

    if location:
        stmt = stmt.where(Job.location.ilike(f"%{location}%"))
    if location_type:
        stmt = stmt.where(Job.location_type.in_(location_type))
    if salary_min is not None:
        stmt = stmt.where(Job.salary_min >= salary_min)
    if category:
        stmt = stmt.where(Job.category == category)
    if source:
        stmt = stmt.where(Job.source == source)
    if company_id:
        stmt = stmt.where(Job.company_id == company_id)
    if experience_level:
        stmt = stmt.where(Job.experience_level.in_(experience_level))
    if employment_type:
        stmt = stmt.where(Job.employment_type.in_(employment_type))

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    if sort_by == "salary":
        stmt = stmt.order_by(Job.salary_min.desc().nulls_last())
    elif sort_by == "match_score":
        stmt = (
            stmt.outerjoin(
                JobMatchScore,
                (JobMatchScore.job_id == Job.id) & (JobMatchScore.user_id == user.id),
            )
            .order_by(JobMatchScore.score.desc().nulls_last())
        )
    else:
        stmt = stmt.order_by(Job.posted_at.desc().nulls_last())

    offset = (page - 1) * per_page
    stmt = stmt.offset(offset).limit(per_page)

    result = await db.execute(stmt)
    jobs = result.scalars().all()

    score_map: dict[uuid.UUID, float] = {}
    if jobs:
        job_ids = [j.id for j in jobs]
        scores_result = await db.execute(
            select(JobMatchScore).where(
                JobMatchScore.user_id == user.id,
                JobMatchScore.job_id.in_(job_ids),
            )
        )
        score_map = {s.job_id: s.score for s in scores_result.scalars().all()}

    job_responses: list[JobResponse] = []
    for job in jobs:
        resp = JobResponse.model_validate(job)
        resp.match_score = score_map.get(job.id)
        job_responses.append(resp)

    pages = max(1, -(-total // per_page))
    return JobListResponse(
        jobs=job_responses, total=total, page=page, per_page=per_page, pages=pages
    )


# ── Single job detail ────────────────────────────────────────────────────────


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: uuid.UUID, user: CurrentUser, db: DbSession) -> JobResponse:
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.is_active.is_(True))
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    score_result = await db.execute(
        select(JobMatchScore).where(
            JobMatchScore.user_id == user.id,
            JobMatchScore.job_id == job_id,
        )
    )
    score_row = score_result.scalar_one_or_none()

    resp = JobResponse.model_validate(job)
    resp.match_score = score_row.score if score_row else None
    return resp


# ── Match score endpoint ──────────────────────────────────────────────────────


@router.get("/{job_id}/match")
async def get_job_match(
    job_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> dict:
    score_result = await db.execute(
        select(JobMatchScore).where(
            JobMatchScore.user_id == user.id,
            JobMatchScore.job_id == job_id,
        )
    )
    score_row = score_result.scalar_one_or_none()
    if not score_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match score not computed yet for this job",
        )
    return {
        "job_id": str(job_id),
        "score": score_row.score,
        "factors": score_row.factors,
        "computed_at": score_row.computed_at.isoformat(),
    }


# ── Admin sync endpoint ──────────────────────────────────────────────────────


@router.post(
    "/sync",
    dependencies=[Depends(verify_internal_api_key)],
    status_code=status.HTTP_200_OK,
)
async def trigger_sync(db: DbSession) -> dict:
    from services.job_sync import run_sync
    from services.job_matcher import compute_scores_for_sync

    sync_stats = await run_sync(db)
    synced_ids = sync_stats.pop("synced_external_ids", [])

    score_stats = await compute_scores_for_sync(db, synced_ids)

    return {
        "sync": sync_stats,
        "scoring": score_stats,
    }
