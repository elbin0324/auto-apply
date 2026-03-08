import logging
import math
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.application import Application
from schemas.application import ApplicationListResponse, ApplicationStats
from schemas.auto_apply import ApplyResult, ProgressUpdate

logger = logging.getLogger(__name__)


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
        base = base.where(Application.status == status_filter)
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
    applications = result.scalars().all()

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
        func.count(case((Application.status == "failed", 1))).label("failed"),
        func.count(case((Application.status == "skipped", 1))).label("skipped"),
        func.count(case((Application.created_at >= week_start, 1))).label(
            "this_week"
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
        failed=failed,
        skipped=row.skipped,
        this_week=row.this_week,
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

    logger.info(
        "Progress update for application %s: phase=%s message=%s",
        application.id,
        update.phase,
        update.message,
    )

    return application


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
        application.generated_application = result.generated_application.model_dump()

    # Merge metadata
    if result.metadata:
        application.metadata_ = result.metadata

    await db.flush()

    logger.info(
        "Processed agent result for application %s: status=%s",
        application.id,
        application.status,
    )

    return application
