import logging
import uuid

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select, text

from deps import CurrentUser, DbSession
from models.application import Application
from models.auto_apply_config import AutoApplyConfig
from models.job import Job
from models.job_match_score import JobMatchScore
from schemas.job import JobListResponse, JobResponse
from services.job_scope import apply_config_scope

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["jobs"])


# ── Personalized job feed ────────────────────────────────────────────────────


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
    experience_level: list[str] | None = Query(None),
    employment_type: list[str] | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = Query("match_score"),
) -> JobListResponse:
    """List jobs scored for the current user (personalized feed).

    Only returns jobs that have a JobMatchScore for this user.
    Includes application pipeline status for queue management.
    """
    # Load user's config (may be None)
    config_result = await db.execute(
        select(AutoApplyConfig).where(AutoApplyConfig.user_id == user.id)
    )
    config = config_result.scalar_one_or_none()

    # Base query: INNER JOIN on JobMatchScore scopes to user's scored jobs
    stmt = (
        select(
            Job,
            JobMatchScore.score,
            JobMatchScore.factors.label("match_factors"),
            Application.id.label("application_id"),
            Application.status.label("application_status"),
        )
        .join(
            JobMatchScore,
            (JobMatchScore.job_id == Job.id) & (JobMatchScore.user_id == user.id),
        )
        .outerjoin(
            Application,
            (Application.job_id == Job.id) & (Application.user_id == user.id),
        )
    )

    # Unified config scope (handles is_active + user preference filters)
    stmt = apply_config_scope(stmt, config)

    # Status filter
    if status_filter == "new":
        stmt = stmt.where(Application.id.is_(None))
    elif status_filter in ("pending_review", "queued", "applied", "skipped", "in_progress", "failed"):
        stmt = stmt.where(Application.status == status_filter)

    # Content filters
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
    if experience_level:
        stmt = stmt.where(Job.experience_level.in_(experience_level))
    if employment_type:
        stmt = stmt.where(Job.employment_type.in_(employment_type))

    # Count total before pagination
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    # Sorting
    if sort_by == "salary":
        stmt = stmt.order_by(Job.salary_min.desc().nulls_last())
    elif sort_by == "match_score":
        stmt = stmt.order_by(JobMatchScore.score.desc().nulls_last())
    else:
        stmt = stmt.order_by(Job.posted_at.desc().nulls_last())

    # Pagination
    offset = (page - 1) * per_page
    stmt = stmt.offset(offset).limit(per_page)

    result = await db.execute(stmt)
    rows = result.all()

    job_responses: list[JobResponse] = []
    for row in rows:
        job = row[0]
        resp = JobResponse.model_validate(job)
        resp.match_score = row[1]
        resp.match_factors = row[2]
        resp.application_id = str(row[3]) if row[3] else None
        resp.application_status = row[4]
        job_responses.append(resp)

    pages = max(1, -(-total // per_page))
    return JobListResponse(
        jobs=job_responses, total=total, page=page, per_page=per_page, pages=pages
    )


# ── Single job detail ────────────────────────────────────────────────────────


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: uuid.UUID, user: CurrentUser, db: DbSession) -> JobResponse:
    result = await db.execute(
        select(
            Job,
            JobMatchScore.score,
            JobMatchScore.factors.label("match_factors"),
            Application.id.label("application_id"),
            Application.status.label("application_status"),
        )
        .outerjoin(
            JobMatchScore,
            (JobMatchScore.job_id == Job.id) & (JobMatchScore.user_id == user.id),
        )
        .outerjoin(
            Application,
            (Application.job_id == Job.id) & (Application.user_id == user.id),
        )
        .where(Job.id == job_id, Job.is_active.is_(True))
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    job = row[0]
    resp = JobResponse.model_validate(job)
    resp.match_score = row[1]
    resp.match_factors = row[2]
    resp.application_id = str(row[3]) if row[3] else None
    resp.application_status = row[4]
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


# ── Rescore ──────────────────────────────────────────────────────────────────


@router.post("/rescore")
async def rescore_jobs(
    user: CurrentUser,
    db: DbSession,
    force: bool = Query(False),
) -> dict:
    """Rescore all active jobs for the current user via the score queue.

    Useful after updating profile, skills, or preferences. Enqueues a single
    per-user scoring task — does not re-fetch from external APIs.

    Set force=true to clear existing scores and rescore all filtered jobs.
    """
    from infra.task_queue import enqueue_score_jobs

    await enqueue_score_jobs(user.id, source="user_rescore", force=force)

    return {
        "detail": "Queued scoring task for user",
        "force": force,
    }


# ── Job actions (queue management) ───────────────────────────────────────────


@router.post("/{job_id}/queue")
async def queue_job(job_id: uuid.UUID, user: CurrentUser, db: DbSession) -> dict:
    """Manually queue a job for auto-apply. Creates Application with status 'queued'."""
    from schemas.auto_apply import ApplyTask
    from services.auto_apply_service import build_user_profile_for_agent, count_applications_today
    from services.queue_service import push_apply_task

    # Verify job exists and is active
    job_result = await db.execute(
        select(Job).where(Job.id == job_id, Job.is_active.is_(True))
    )
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    # Verify user has a score for this job
    score_result = await db.execute(
        select(JobMatchScore).where(
            JobMatchScore.user_id == user.id, JobMatchScore.job_id == job_id
        )
    )
    if not score_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No match score for this job")

    # Check existing application
    app_result = await db.execute(
        select(Application).where(
            Application.user_id == user.id, Application.job_id == job_id
        )
    )
    existing_app = app_result.scalar_one_or_none()

    if existing_app:
        if existing_app.status == "skipped":
            # Re-queue a previously skipped job
            existing_app.status = "queued"
            application = existing_app
        elif existing_app.status in ("queued", "in_progress"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Job is already {existing_app.status}",
            )
        elif existing_app.status == "applied":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already applied to this job",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot queue job with status '{existing_app.status}'",
            )
    else:
        # Check daily limit
        from models.auto_apply_config import AutoApplyConfig

        config_result = await db.execute(
            select(AutoApplyConfig).where(AutoApplyConfig.user_id == user.id)
        )
        config = config_result.scalar_one_or_none()
        daily_limit = config.daily_apply_limit if config else 25

        applied_today = await count_applications_today(db, user.id)
        if applied_today >= daily_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Daily application limit reached ({daily_limit})",
            )

        application = Application(
            user_id=user.id,
            job_id=job_id,
            status="queued",
        )
        db.add(application)

    await db.flush()

    # Build and push apply task
    user_profile, resume_text, resume_url = await build_user_profile_for_agent(db, user.id)
    task = ApplyTask(
        application_id=application.id,
        user_id=user.id,
        job_id=job_id,
        job_url=job.apply_url or job.url,
        resume_url=resume_url,
        resume_text=resume_text,
        user_profile=user_profile,
    )
    await push_apply_task(task)

    return {"application_id": str(application.id), "status": "queued"}


@router.post("/{job_id}/skip")
async def skip_job(job_id: uuid.UUID, user: CurrentUser, db: DbSession) -> dict:
    """Skip a job. Creates or updates Application to 'skipped'."""
    # Verify job exists
    job_result = await db.execute(
        select(Job).where(Job.id == job_id, Job.is_active.is_(True))
    )
    if not job_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    # Check existing application
    app_result = await db.execute(
        select(Application).where(
            Application.user_id == user.id, Application.job_id == job_id
        )
    )
    existing_app = app_result.scalar_one_or_none()

    if existing_app:
        if existing_app.status in ("queued", "in_progress"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot skip a job that is {existing_app.status}",
            )
        if existing_app.status == "applied":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot skip a job already applied to",
            )
        if existing_app.status == "skipped":
            return {"application_id": str(existing_app.id), "status": "skipped"}
        # pending_review or failed → mark as skipped
        existing_app.status = "skipped"
        await db.flush()
        return {"application_id": str(existing_app.id), "status": "skipped"}

    # No existing application — create a skipped one
    application = Application(
        user_id=user.id,
        job_id=job_id,
        status="skipped",
    )
    db.add(application)
    await db.flush()
    return {"application_id": str(application.id), "status": "skipped"}


@router.post("/{job_id}/unskip")
async def unskip_job(job_id: uuid.UUID, user: CurrentUser, db: DbSession) -> dict:
    """Undo a skip. Deletes the 'skipped' Application so the job returns to 'new'."""
    app_result = await db.execute(
        select(Application).where(
            Application.user_id == user.id,
            Application.job_id == job_id,
            Application.status == "skipped",
        )
    )
    application = app_result.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No skipped application found for this job",
        )

    await db.delete(application)
    await db.flush()
    return {"status": "new"}
