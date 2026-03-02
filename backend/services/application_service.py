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
from schemas.auto_apply import ApplyResult

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

    if result.success:
        application.status = "applied"
        application.applied_at = datetime.now(timezone.utc)
    else:
        application.status = "failed"
        application.error_message = result.error_message

    if result.screenshot_url:
        application.screenshot_url = result.screenshot_url

    if result.metadata:
        application.metadata_ = result.metadata

    await db.flush()

    logger.info(
        "Processed agent result for application %s: status=%s",
        application.id,
        application.status,
    )

    return application
