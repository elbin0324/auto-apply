import logging
import math
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.application import Application
from models.job import Job
from models.job_match_score import JobMatchScore
from schemas.application import ApplicationListResponse, ApplicationStats
from schemas.auto_apply import ApplyResult, ProgressUpdate
from infra.event_publisher import publish_user_event
from services.ats_registry_service import record_result as record_ats_result

logger = logging.getLogger(__name__)


async def _attach_match_scores(
    db: AsyncSession,
    user_id: uuid.UUID,
    applications: list[Application],
) -> None:
    """Batch-load match scores and set them on each application's job."""
    job_ids = [app.job.id for app in applications if app.job]
    if not job_ids:
        return

    stmt = select(JobMatchScore.job_id, JobMatchScore.score, JobMatchScore.factors).where(
        JobMatchScore.user_id == user_id,
        JobMatchScore.job_id.in_(job_ids),
    )
    rows = await db.execute(stmt)
    scores = {row.job_id: (row.score, row.factors) for row in rows}

    for app in applications:
        if app.job and app.job.id in scores:
            score, factors = scores[app.job.id]
            app.job.match_score = score
            app.job.match_factors = factors


async def list_applications(
    db: AsyncSession,
    user_id: uuid.UUID,
    status_filter: str | None,
    date_from: datetime | None,
    date_to: datetime | None,
    page: int,
    per_page: int,
) -> ApplicationListResponse:
    base = select(Application).where(Application.user_id == user_id)

    if status_filter:
        statuses = [s.strip() for s in status_filter.split(",") if s.strip()]
        if len(statuses) == 1:
            base = base.where(Application.status == statuses[0])
        else:
            base = base.where(Application.status.in_(statuses))
    if date_from:
        base = base.where(Application.created_at >= date_from)
    if date_to:
        base = base.where(Application.created_at <= date_to)

    # Count total
    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    # Fetch page
    stmt = (
        base.options(selectinload(Application.job))
        .order_by(Application.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    result = await db.execute(stmt)
    applications = list(result.scalars().all())

    await _attach_match_scores(db, user_id, applications)

    return ApplicationListResponse(
        applications=applications,
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, math.ceil(total / per_page)),
    )


async def get_application(
    db: AsyncSession,
    user_id: uuid.UUID,
    application_id: uuid.UUID,
) -> Application:
    stmt = (
        select(Application)
        .options(selectinload(Application.job))
        .where(Application.id == application_id, Application.user_id == user_id)
    )
    result = await db.execute(stmt)
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    await _attach_match_scores(db, user_id, [application])

    return application


async def get_application_stats(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> ApplicationStats:
    now = datetime.now(timezone.utc)
    # Monday 00:00 UTC of current week
    week_start = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    stmt = select(
        func.count(Application.id).label("total"),
        func.count(case((Application.status == "applied", 1))).label("applied"),
        func.count(
            case(
                (
                    Application.status.in_(
                        ["queued", "pending_review", "in_progress"]
                    ),
                    1,
                )
            )
        ).label("pending"),
        func.count(case((Application.status == "queued", 1))).label("queued"),
        func.count(case((Application.status == "in_progress", 1))).label("in_progress"),
        func.count(case((Application.status == "failed", 1))).label("failed"),
        func.count(case((Application.status == "skipped", 1))).label("skipped"),
        func.count(case((Application.created_at >= week_start, 1))).label(
            "this_week"
        ),
        func.count(case((Application.created_at >= today_start, 1))).label(
            "today"
        ),
    ).where(Application.user_id == user_id)

    result = await db.execute(stmt)
    row = result.one()

    applied = row.applied
    failed = row.failed
    denominator = applied + failed
    success_rate = round((applied / denominator) * 100, 1) if denominator > 0 else 0.0

    return ApplicationStats(
        total=row.total,
        applied=applied,
        pending=row.pending,
        queued=row.queued,
        in_progress=row.in_progress,
        failed=failed,
        skipped=row.skipped,
        this_week=row.this_week,
        today=row.today,
        success_rate=success_rate,
    )


async def process_progress_update(
    db: AsyncSession,
    update: ProgressUpdate,
) -> Application:
    """Process a progress update from the runner, updating phase info."""
    stmt = select(Application).where(Application.id == uuid.UUID(update.task_id))
    row = await db.execute(stmt)
    application = row.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {update.task_id} not found",
        )

    # Skip if already in a terminal state
    if application.status in ("applied", "failed", "skipped", "withdrawn"):
        return application

    application.current_phase = update.phase
    application.phase_message = update.message

    # Auto-transition queued → in_progress on first progress update
    if application.status == "queued":
        application.status = "in_progress"

    await db.flush()

    await publish_user_event(
        application.user_id,
        "progress",
        {
            "application_id": str(application.id),
            "status": application.status,
            "current_phase": application.current_phase,
            "phase_message": application.phase_message,
        },
    )

    logger.info(
        "Progress update for application %s: phase=%s message=%s",
        application.id,
        update.phase,
        update.message,
    )

    return application


async def reap_stale_applications(
    db: AsyncSession,
    timeout_minutes: int = 10,
) -> int:
    """Mark stale in_progress/queued applications as failed.

    Applications stuck in non-terminal states for longer than *timeout_minutes*
    are presumed to have been dropped by the runner (crash, network issue, etc.).
    """
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=timeout_minutes)

    stmt = select(Application).where(
        Application.status.in_(["in_progress", "queued"]),
        Application.updated_at < cutoff,
    )
    result = await db.execute(stmt)
    stale = list(result.scalars().all())

    for app in stale:
        app.status = "failed"
        app.current_phase = "failed"
        app.error_message = (
            f"Timed out: no progress for {timeout_minutes} minutes"
        )

    if stale:
        await db.flush()
        logger.info("Reaped %d stale applications (cutoff=%s)", len(stale), cutoff)

    return len(stale)


async def process_agent_result(
    db: AsyncSession,
    result: ApplyResult,
) -> Application:
    stmt = select(Application).where(Application.id == result.application_id)
    row = await db.execute(stmt)
    application = row.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {result.application_id} not found",
        )

    # Determine outcome based on runner's status string
    if result.success:
        # For extract_only mode, move to pending_review instead of applied
        if application.task_mode == "extract_only":
            application.status = "pending_review"
        else:
            application.status = "applied"
            application.applied_at = datetime.now(timezone.utc)
        application.current_phase = "completed"
    elif result.status == "needs_review":
        application.status = "pending_review"
        application.current_phase = "completed"
    else:
        application.status = "failed"
        application.current_phase = "failed"
        # Use runner's reason field, fall back to legacy error_message
        application.error_message = result.reason or result.error_message

    # Handle screenshot — prefer screenshot_urls list, fall back to single
    if result.screenshot_urls:
        application.screenshot_url = result.screenshot_urls[0]
    elif result.screenshot_url:
        application.screenshot_url = result.screenshot_url

    # Store generated application artifact if present
    if result.generated_application:
        application.generated_application = result.generated_application.model_dump(mode="json")

    # Merge metadata
    if result.metadata:
        application.metadata_ = result.metadata

    # Track ATS success/failure stats
    if application.job_id:
        job = await db.get(Job, application.job_id)
        if job and job.ats_platform:
            await record_ats_result(db, job.ats_platform, result.success)

    await db.flush()

    await publish_user_event(
        application.user_id,
        "result",
        {
            "application_id": str(application.id),
            "status": application.status,
            "current_phase": application.current_phase,
        },
    )

    logger.info(
        "Processed agent result for application %s: status=%s",
        application.id,
        application.status,
    )

    return application
