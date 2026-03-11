"""Dashboard summary endpoint — aggregates stats for the overview page."""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter
from sqlalchemy import Float, case, cast, func, select
from sqlalchemy.orm import selectinload

from deps import CurrentUser, DbSession
from models.application import Application
from models.job import Job
from models.job_match_score import JobMatchScore
from schemas.application import ApplicationDetail
from schemas.dashboard import (
    ATSBreakdown,
    DashboardQueue,
    DashboardStats,
    DashboardSummary,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    user: CurrentUser,
    db: DbSession,
) -> DashboardSummary:
    """Return aggregated dashboard data in a single request."""
    now = datetime.now(timezone.utc)
    week_start = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # ── Application stats (single query) ────────────────────────────────
    stats_stmt = select(
        func.count(Application.id).label("total"),
        func.count(case((Application.status == "applied", 1))).label("applied"),
        func.count(case((Application.status == "pending_review", 1))).label("pending_review"),
        func.count(case((Application.status == "queued", 1))).label("queued"),
        func.count(case((Application.status == "in_progress", 1))).label("in_progress"),
        func.count(case((Application.status == "failed", 1))).label("failed"),
        func.count(case((Application.status == "skipped", 1))).label("skipped"),
        func.count(case((Application.created_at >= week_start, 1))).label("this_week"),
        func.count(case((Application.created_at >= today_start, 1))).label("today"),
    ).where(Application.user_id == user.id)

    stats_result = await db.execute(stats_stmt)
    row = stats_result.one()

    applied = row.applied
    failed = row.failed
    denominator = applied + failed
    success_rate = round((applied / denominator) * 100, 1) if denominator > 0 else 0.0

    # ── Average match score ─────────────────────────────────────────────
    avg_stmt = select(func.avg(JobMatchScore.score)).where(
        JobMatchScore.user_id == user.id
    )
    avg_result = await db.execute(avg_stmt)
    avg_score_raw = avg_result.scalar_one_or_none()
    avg_match_score = round(avg_score_raw, 1) if avg_score_raw is not None else None

    stats = DashboardStats(
        total=row.total,
        applied=applied,
        pending_review=row.pending_review,
        queued=row.queued,
        in_progress=row.in_progress,
        failed=failed,
        skipped=row.skipped,
        this_week=row.this_week,
        today=row.today,
        success_rate=success_rate,
        avg_match_score=avg_match_score,
    )

    queue = DashboardQueue(
        queue_depth=row.queued,
        pending_review_count=row.pending_review,
        in_progress_count=row.in_progress,
    )

    # ── Recent applications (last 8) ────────────────────────────────────
    recent_stmt = (
        select(Application)
        .options(selectinload(Application.job))
        .where(Application.user_id == user.id)
        .order_by(Application.created_at.desc())
        .limit(8)
    )
    recent_result = await db.execute(recent_stmt)
    recent_apps = recent_result.scalars().all()
    recent_applications = [ApplicationDetail.model_validate(a) for a in recent_apps]

    # ── ATS breakdown ───────────────────────────────────────────────────
    ats_stmt = (
        select(
            Job.ats_platform,
            func.count(Application.id).label("application_count"),
            func.count(case((Application.status == "applied", 1))).label("ats_applied"),
            func.count(
                case((Application.status.in_(["applied", "failed"]), 1))
            ).label("ats_total"),
        )
        .join(Job, Application.job_id == Job.id)
        .where(
            Application.user_id == user.id,
            Job.ats_platform.isnot(None),
        )
        .group_by(Job.ats_platform)
        .order_by(func.count(Application.id).desc())
    )
    ats_result = await db.execute(ats_stmt)
    ats_rows = ats_result.all()

    ats_breakdown = []
    for ats_row in ats_rows:
        ats_name = ats_row.ats_platform or "unknown"
        ats_total = ats_row.ats_total
        ats_success = round((ats_row.ats_applied / ats_total) * 100, 1) if ats_total > 0 else 0.0
        ats_breakdown.append(ATSBreakdown(
            ats_name=ats_name,
            display_name=ats_name.replace("_", " ").title(),
            application_count=ats_row.application_count,
            success_rate=ats_success,
        ))

    return DashboardSummary(
        stats=stats,
        queue=queue,
        recent_applications=recent_applications,
        ats_breakdown=ats_breakdown,
    )
