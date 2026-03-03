"""Admin panel endpoints — all require admin role."""

import logging
import uuid

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import delete, func, select, update

from deps import AdminUser, DbSession
from models.application import Application
from models.auto_apply_config import AutoApplyConfig
from models.company import Company
from models.job import Job
from models.profile import Profile
from models.user import User
from redis.asyncio import Redis

from config import get_settings
from schemas.admin import (
    AdminOverview,
    AdminQueueStatus,
    AdminUserListResponse,
    AdminUserSummary,
    QueueDepths,
    QueuePurgeResult,
    TriggerResult,
    WipeResult,
    WorkerStatus,
    WorkersOverview,
)
from services.crawl_queue_service import count_crawl_dedup_keys, get_crawl_queue_depth
from services.enrich_queue_service import get_enrich_queue_depth
from services.queue_service import get_queue_depth
from services.score_queue_service import get_score_queue_depths

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Overview ──────────────────────────────────────────────────────────────────


@router.get("/overview", response_model=AdminOverview)
async def get_overview(admin: AdminUser, db: DbSession) -> AdminOverview:
    """System-wide statistics for the admin dashboard."""
    user_count = (await db.execute(select(func.count(User.id)))).scalar_one()
    job_count = (await db.execute(select(func.count(Job.id)))).scalar_one()
    active_job_count = (
        await db.execute(select(func.count(Job.id)).where(Job.is_active.is_(True)))
    ).scalar_one()
    company_count = (await db.execute(select(func.count(Company.id)))).scalar_one()
    active_company_count = (
        await db.execute(
            select(func.count(Company.id)).where(Company.is_active.is_(True))
        )
    ).scalar_one()

    # Application counts by status
    status_rows = (
        await db.execute(
            select(Application.status, func.count(Application.id)).group_by(
                Application.status
            )
        )
    ).all()
    application_counts = {row[0]: row[1] for row in status_rows}
    total_applications = sum(application_counts.values())

    # Queue depths
    apply_depth = await get_queue_depth()
    crawl_depth = await get_crawl_queue_depth()
    score_depths = await get_score_queue_depths()
    enrich_depth = await get_enrich_queue_depth()

    return AdminOverview(
        user_count=user_count,
        job_count=job_count,
        active_job_count=active_job_count,
        company_count=company_count,
        active_company_count=active_company_count,
        application_counts=application_counts,
        total_applications=total_applications,
        queue_depths=QueueDepths(
            crawl=crawl_depth,
            score_jobs=score_depths["score_jobs"],
            score_users=score_depths["score_users"],
            apply=apply_depth,
            enrich=enrich_depth,
        ),
    )


# ── Users ─────────────────────────────────────────────────────────────────────


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    admin: AdminUser,
    db: DbSession,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    search: str | None = Query(default=None),
) -> AdminUserListResponse:
    """List all users with profile summary and application counts."""
    # Count subqueries
    app_count_sq = (
        select(func.count(Application.id))
        .where(Application.user_id == User.id)
        .correlate(User)
        .scalar_subquery()
    )
    applied_count_sq = (
        select(func.count(Application.id))
        .where(Application.user_id == User.id, Application.status == "applied")
        .correlate(User)
        .scalar_subquery()
    )

    query = (
        select(
            User.id,
            User.email,
            User.role,
            User.created_at,
            Profile.id.isnot(None).label("has_profile"),
            Profile.full_name,
            app_count_sq.label("application_count"),
            applied_count_sq.label("applied_count"),
            func.coalesce(AutoApplyConfig.is_active, False).label(
                "auto_apply_active"
            ),
        )
        .outerjoin(Profile, Profile.user_id == User.id)
        .outerjoin(AutoApplyConfig, AutoApplyConfig.user_id == User.id)
    )

    if search:
        query = query.where(User.email.ilike(f"%{search}%"))

    # Total count
    count_query = select(func.count()).select_from(User)
    if search:
        count_query = count_query.where(User.email.ilike(f"%{search}%"))
    total = (await db.execute(count_query)).scalar_one()

    # Paginate
    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    rows = (await db.execute(query)).all()

    users = [
        AdminUserSummary(
            id=row.id,
            email=row.email,
            role=row.role,
            created_at=row.created_at,
            has_profile=bool(row.has_profile),
            full_name=row.full_name,
            application_count=row.application_count or 0,
            applied_count=row.applied_count or 0,
            auto_apply_active=bool(row.auto_apply_active),
        )
        for row in rows
    ]

    return AdminUserListResponse(
        users=users, total=total, page=page, per_page=per_page
    )


@router.get("/users/{user_id}", response_model=AdminUserSummary)
async def get_user_detail(
    user_id: uuid.UUID, admin: AdminUser, db: DbSession
) -> AdminUserSummary:
    """Single user detail."""
    app_count_sq = (
        select(func.count(Application.id))
        .where(Application.user_id == User.id)
        .correlate(User)
        .scalar_subquery()
    )
    applied_count_sq = (
        select(func.count(Application.id))
        .where(Application.user_id == User.id, Application.status == "applied")
        .correlate(User)
        .scalar_subquery()
    )

    row = (
        await db.execute(
            select(
                User.id,
                User.email,
                User.role,
                User.created_at,
                Profile.id.isnot(None).label("has_profile"),
                Profile.full_name,
                app_count_sq.label("application_count"),
                applied_count_sq.label("applied_count"),
                func.coalesce(AutoApplyConfig.is_active, False).label(
                    "auto_apply_active"
                ),
            )
            .outerjoin(Profile, Profile.user_id == User.id)
            .outerjoin(AutoApplyConfig, AutoApplyConfig.user_id == User.id)
            .where(User.id == user_id)
        )
    ).first()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return AdminUserSummary(
        id=row.id,
        email=row.email,
        role=row.role,
        created_at=row.created_at,
        has_profile=bool(row.has_profile),
        full_name=row.full_name,
        application_count=row.application_count or 0,
        applied_count=row.applied_count or 0,
        auto_apply_active=bool(row.auto_apply_active),
    )


# ── Queues ────────────────────────────────────────────────────────────────────


@router.get("/queues", response_model=AdminQueueStatus)
async def get_queues(admin: AdminUser) -> AdminQueueStatus:
    """Live queue depths for monitoring."""
    apply_depth = await get_queue_depth()
    crawl_depth = await get_crawl_queue_depth()
    score_depths = await get_score_queue_depths()
    enrich_depth = await get_enrich_queue_depth()
    dedup_keys = await count_crawl_dedup_keys()

    return AdminQueueStatus(
        crawl_queue_depth=crawl_depth,
        score_jobs_queue_depth=score_depths["score_jobs"],
        score_users_queue_depth=score_depths["score_users"],
        apply_queue_depth=apply_depth,
        enrich_queue_depth=enrich_depth,
        crawl_dedup_keys=dedup_keys,
    )


# ── Data management ──────────────────────────────────────────────────────────


@router.delete("/companies", response_model=WipeResult)
async def wipe_companies(
    admin: AdminUser,
    db: DbSession,
    hard: bool = Query(default=False),
) -> WipeResult:
    """Wipe all companies. Soft delete by default, hard delete with ?hard=true."""
    if hard:
        result = await db.execute(delete(Company))
        await db.commit()
        return WipeResult(affected=result.rowcount, action="hard_delete")
    else:
        result = await db.execute(
            update(Company).where(Company.is_active.is_(True)).values(is_active=False)
        )
        await db.commit()
        return WipeResult(affected=result.rowcount, action="soft_delete")


@router.delete("/jobs", response_model=WipeResult)
async def wipe_jobs(
    admin: AdminUser,
    db: DbSession,
    hard: bool = Query(default=False),
    source: str | None = Query(default=None),
) -> WipeResult:
    """Wipe all jobs. Optional source filter. Soft delete by default."""
    if hard:
        stmt = delete(Job)
        if source:
            stmt = stmt.where(Job.source == source)
        result = await db.execute(stmt)
        await db.commit()
        return WipeResult(affected=result.rowcount, action="hard_delete")
    else:
        stmt = update(Job).where(Job.is_active.is_(True)).values(is_active=False)
        if source:
            stmt = stmt.where(Job.source == source)
        result = await db.execute(stmt)
        await db.commit()
        return WipeResult(affected=result.rowcount, action="soft_delete")


@router.delete(
    "/companies/{company_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_company(
    company_id: uuid.UUID,
    admin: AdminUser,
    db: DbSession,
    hard: bool = Query(default=False),
) -> None:
    """Delete a single company."""
    if hard:
        result = await db.execute(delete(Company).where(Company.id == company_id))
    else:
        result = await db.execute(
            update(Company).where(Company.id == company_id).values(is_active=False)
        )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Company not found")


@router.delete("/jobs/by-company/{company_id}", response_model=WipeResult)
async def delete_jobs_by_company(
    company_id: uuid.UUID,
    admin: AdminUser,
    db: DbSession,
    hard: bool = Query(default=False),
) -> WipeResult:
    """Delete all jobs belonging to a company."""
    if hard:
        result = await db.execute(delete(Job).where(Job.company_id == company_id))
        await db.commit()
        return WipeResult(affected=result.rowcount, action="hard_delete")
    else:
        result = await db.execute(
            update(Job)
            .where(Job.company_id == company_id, Job.is_active.is_(True))
            .values(is_active=False)
        )
        await db.commit()
        return WipeResult(affected=result.rowcount, action="soft_delete")


# ── Workers ──────────────────────────────────────────────────────────────────


@router.get("/workers", response_model=WorkersOverview)
async def get_workers(admin: AdminUser) -> WorkersOverview:
    """Live worker status from Redis heartbeats."""
    from services.worker_heartbeat import get_all_worker_statuses

    statuses = await get_all_worker_statuses()
    return WorkersOverview(
        workers=[WorkerStatus(**s) for s in statuses]
    )


# ── Manual Triggers ──────────────────────────────────────────────────────────


@router.post("/triggers/crawl", response_model=TriggerResult)
async def trigger_crawl(admin: AdminUser, db: DbSession) -> TriggerResult:
    """Immediately enqueue all stale companies for crawling."""
    from services.crawl_scheduler import enqueue_stale_companies

    stats = await enqueue_stale_companies(db)
    await db.commit()
    return TriggerResult(
        triggered="crawl_schedule",
        detail=f"Enqueued {stats['enqueued']} companies ({stats['skipped_already_enqueued']} already pending)",
    )


@router.post("/triggers/rescore", response_model=TriggerResult)
async def trigger_rescore(admin: AdminUser, db: DbSession) -> TriggerResult:
    """Immediately enqueue all active users for re-scoring."""
    from schemas.crawl import ScoreUserTask
    from services.score_queue_service import push_score_user_task

    result = await db.execute(
        select(AutoApplyConfig.user_id).where(AutoApplyConfig.is_active.is_(True))
    )
    user_ids = result.scalars().all()

    enqueued = 0
    for user_id in user_ids:
        await push_score_user_task(
            ScoreUserTask(user_id=user_id, reason="admin_trigger")
        )
        enqueued += 1

    return TriggerResult(
        triggered="user_rescore",
        detail=f"Enqueued {enqueued} active users for re-scoring",
    )


@router.post("/triggers/enrich", response_model=TriggerResult)
async def trigger_enrich(admin: AdminUser, db: DbSession) -> TriggerResult:
    """Immediately enqueue un-enriched jobs for LLM enrichment."""
    import uuid as _uuid

    from schemas.enrichment import EnrichJobsTask
    from services.enrich_queue_service import push_enrich_task

    settings = get_settings()
    result = await db.execute(
        select(Job.id, Job.company_id)
        .where(
            Job.is_active.is_(True),
            Job.description.isnot(None),
            Job.enriched_at.is_(None),
        )
        .limit(settings.enrichment_batch_size)
    )
    rows = result.fetchall()

    if not rows:
        return TriggerResult(triggered="job_enrich", detail="No un-enriched jobs found")

    by_company: dict[str, list] = {}
    for job_id, company_id in rows:
        key = str(company_id) if company_id else "no_company"
        by_company.setdefault(key, []).append(job_id)

    tasks_pushed = 0
    for company_key, job_ids in by_company.items():
        company_id_val = (
            _uuid.UUID(company_key)
            if company_key != "no_company"
            else _uuid.UUID(int=0)
        )
        task = EnrichJobsTask(company_id=company_id_val, job_ids=job_ids)
        await push_enrich_task(task)
        tasks_pushed += 1

    return TriggerResult(
        triggered="job_enrich",
        detail=f"Pushed {tasks_pushed} batches for {len(rows)} un-enriched jobs",
    )


@router.post("/triggers/rematch", response_model=TriggerResult)
async def trigger_rematch(admin: AdminUser, db: DbSession) -> TriggerResult:
    """Immediately re-run matching for all active auto-apply users."""
    from services.auto_apply_service import run_matching_for_user

    result = await db.execute(
        select(AutoApplyConfig).where(AutoApplyConfig.is_active.is_(True))
    )
    active_configs = result.scalars().all()

    if not active_configs:
        return TriggerResult(
            triggered="rematch", detail="No active auto-apply users found"
        )

    users_processed = 0
    total_queued = 0

    for config in active_configs:
        try:
            stats = await run_matching_for_user(db, config.user_id, config)
            users_processed += 1
            total_queued += stats.get("queued", 0)
        except Exception:
            logger.exception("Rematch failed for user %s", config.user_id)

    await db.commit()
    return TriggerResult(
        triggered="rematch",
        detail=f"Queued {total_queued} apply tasks for {users_processed} users",
    )


# ── Queue Purge ──────────────────────────────────────────────────────────────

PURGEABLE_QUEUES = {
    "crawl": "crawl:companies",
    "score_jobs": "score:jobs",
    "score_users": "score:users",
    "enrich": "enrich:jobs",
}


@router.delete("/queues/{queue_name}", response_model=QueuePurgeResult)
async def purge_queue(queue_name: str, admin: AdminUser) -> QueuePurgeResult:
    """Purge all items from a named queue."""
    if queue_name not in PURGEABLE_QUEUES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown queue: {queue_name}. Purgeable: {list(PURGEABLE_QUEUES)}",
        )
    redis_key = PURGEABLE_QUEUES[queue_name]
    settings = get_settings()
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        length = await redis.llen(redis_key)
        if length > 0:
            await redis.delete(redis_key)
        return QueuePurgeResult(purged=length, queue=queue_name)
    finally:
        await redis.aclose()
