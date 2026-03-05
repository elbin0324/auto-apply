"""Admin panel endpoints — all require admin role."""

import logging
import uuid

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import delete, func, select, update

from deps import AdminUser, DbSession
from models.application import Application
from models.auto_apply_config import AutoApplyConfig
from models.job import Job
from models.profile import Profile
from models.user import User
from config import get_settings
from schemas.admin import (
    AdminOverview,
    AdminQueueStatus,
    AdminUserListResponse,
    AdminUserSummary,
    DLQItem,
    DLQOverview,
    DLQReplayResult,
    DLQStatus,
    QueueDepths,
    QueuePurgeResult,
    TriggerResult,
    WipeResult,
    WorkerStatus,
    WorkersOverview,
)
from services.queue_service import get_queue_depth
from workers.queues.enrich import get_enrich_queue_depth
from workers.queues.score import get_score_queue_depth
from infra.task_queue import FETCH_JOBS_QUEUE

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
    from infra.redis_pool import get_redis

    apply_depth = await get_queue_depth()
    score_depth = await get_score_queue_depth()
    enrich_depth = await get_enrich_queue_depth()
    fetch_depth = await get_redis().llen(FETCH_JOBS_QUEUE)

    return AdminOverview(
        user_count=user_count,
        job_count=job_count,
        active_job_count=active_job_count,
        application_counts=application_counts,
        total_applications=total_applications,
        queue_depths=QueueDepths(
            fetch_jobs=fetch_depth,
            score_jobs=score_depth,
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
    from infra.redis_pool import get_redis

    apply_depth = await get_queue_depth()
    score_depth = await get_score_queue_depth()
    enrich_depth = await get_enrich_queue_depth()
    fetch_depth = await get_redis().llen(FETCH_JOBS_QUEUE)

    return AdminQueueStatus(
        fetch_jobs_queue_depth=fetch_depth,
        score_jobs_queue_depth=score_depth,
        apply_queue_depth=apply_depth,
        enrich_queue_depth=enrich_depth,
    )


# ── Data management ──────────────────────────────────────────────────────────


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


# ── Workers ──────────────────────────────────────────────────────────────────


@router.get("/workers", response_model=WorkersOverview)
async def get_workers(admin: AdminUser) -> WorkersOverview:
    """Live worker status from Redis heartbeats."""
    from infra.worker_heartbeat import get_all_worker_statuses

    statuses = await get_all_worker_statuses()
    return WorkersOverview(
        workers=[WorkerStatus(**s) for s in statuses]
    )


# ── Manual Triggers ──────────────────────────────────────────────────────────


@router.post("/triggers/fetch", response_model=TriggerResult)
async def trigger_fetch(admin: AdminUser, db: DbSession) -> TriggerResult:
    """Enqueue job-fetch tasks for all active users."""
    from infra.task_queue import enqueue_fetch_jobs

    settings = get_settings()
    if not settings.rapidapi_key:
        return TriggerResult(
            triggered="job_fetch",
            detail="RapidAPI key not configured",
        )

    result = await db.execute(
        select(AutoApplyConfig).where(AutoApplyConfig.is_active.is_(True))
    )
    configs = list(result.scalars().all())

    if not configs:
        return TriggerResult(triggered="job_fetch", detail="No active users found")

    for config in configs:
        await enqueue_fetch_jobs(
            config.user_id, recent_only=False, source="admin_trigger"
        )

    return TriggerResult(
        triggered="job_fetch",
        detail=f"Enqueued fetch tasks for {len(configs)} users",
    )


@router.post("/triggers/fetch/{user_id}", response_model=TriggerResult)
async def trigger_fetch_for_user(
    user_id: uuid.UUID, admin: AdminUser, db: DbSession
) -> TriggerResult:
    """Enqueue a job-fetch task for a single user."""
    from infra.task_queue import enqueue_fetch_jobs

    settings = get_settings()
    if not settings.rapidapi_key:
        return TriggerResult(
            triggered="job_fetch_user",
            detail="RapidAPI key not configured",
        )

    # Verify user exists and has an active config
    config_result = await db.execute(
        select(AutoApplyConfig).where(AutoApplyConfig.user_id == user_id)
    )
    config = config_result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="No auto-apply config for this user")
    if not config.target_titles:
        return TriggerResult(
            triggered="job_fetch_user",
            detail="User has no target titles configured",
        )

    await enqueue_fetch_jobs(user_id, recent_only=False, source="admin_trigger")
    return TriggerResult(
        triggered="job_fetch_user",
        detail=f"Enqueued fetch task for user {user_id}",
    )


@router.post("/triggers/enrich", response_model=TriggerResult)
async def trigger_enrich(admin: AdminUser, db: DbSession) -> TriggerResult:
    """Immediately enqueue un-enriched jobs for LLM enrichment."""
    from infra.task_queue import enqueue_enrich_jobs

    settings = get_settings()
    result = await db.execute(
        select(Job.id)
        .where(
            Job.is_active.is_(True),
            Job.description.isnot(None),
            Job.enriched_at.is_(None),
        )
        .limit(settings.enrichment_batch_size)
    )
    job_ids = list(result.scalars().all())

    if not job_ids:
        return TriggerResult(triggered="job_enrich", detail="No un-enriched jobs found")

    await enqueue_enrich_jobs(job_ids, source="admin_trigger")

    return TriggerResult(
        triggered="job_enrich",
        detail=f"Pushed {len(job_ids)} un-enriched jobs for enrichment",
    )


@router.post("/triggers/rescore", response_model=TriggerResult)
async def trigger_rescore(admin: AdminUser, db: DbSession) -> TriggerResult:
    """Enqueue per-user rescoring tasks for all active users.

    Unlike /triggers/fetch, this does NOT re-fetch from external APIs — it rescores
    existing jobs in the DB. Useful after deploying a new scoring model or
    switching from heuristic to LLM scoring.
    """
    from infra.task_queue import enqueue_score_jobs

    result = await db.execute(
        select(AutoApplyConfig.user_id).where(AutoApplyConfig.is_active.is_(True))
    )
    user_ids = list(result.scalars().all())

    if not user_ids:
        return TriggerResult(triggered="rescore", detail="No active users found")

    for uid in user_ids:
        await enqueue_score_jobs(uid, source="admin_rescore", force=True)

    return TriggerResult(
        triggered="rescore",
        detail=f"Enqueued rescore tasks for {len(user_ids)} users",
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
    "fetch_jobs": "fetch:jobs",
    "score_jobs": "score:jobs",
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
    from infra.redis_pool import get_redis

    redis_key = PURGEABLE_QUEUES[queue_name]
    redis = get_redis()
    length = await redis.llen(redis_key)
    if length > 0:
        await redis.delete(redis_key)
    return QueuePurgeResult(purged=length, queue=queue_name)


# ── Dead-Letter Queues ──────────────────────────────────────────────────────


@router.get("/dlq", response_model=DLQOverview)
async def get_dlq_overview(admin: AdminUser) -> DLQOverview:
    """Overview of all dead-letter queues."""
    from infra.dlq_service import get_dlq_depths

    depths = await get_dlq_depths()
    return DLQOverview(queues=depths, total=sum(depths.values()))


@router.get("/dlq/{queue_name}", response_model=DLQStatus)
async def get_dlq_detail(
    queue_name: str,
    admin: AdminUser,
    count: int = Query(default=10, ge=1, le=100),
) -> DLQStatus:
    """Peek at items in a specific dead-letter queue."""
    from infra.dlq_service import peek_dlq

    items = await peek_dlq(queue_name, count=count)
    return DLQStatus(
        queue_name=queue_name,
        depth=len(items),
        items=[DLQItem(**item) for item in items],
    )


@router.post("/dlq/{queue_name}/replay", response_model=DLQReplayResult)
async def replay_dlq(queue_name: str, admin: AdminUser) -> DLQReplayResult:
    """Replay one item from a DLQ back to its original queue."""
    from infra.dlq_service import replay_dlq_item

    replayed = await replay_dlq_item(queue_name)
    return DLQReplayResult(replayed=replayed, queue_name=queue_name)


@router.delete("/dlq/{queue_name}", response_model=QueuePurgeResult)
async def purge_dlq_queue(queue_name: str, admin: AdminUser) -> QueuePurgeResult:
    """Purge all items from a dead-letter queue."""
    from infra.dlq_service import purge_dlq

    purged = await purge_dlq(queue_name)
    return QueuePurgeResult(purged=purged, queue=f"dlq:{queue_name}")


# ── Task History ──────────────────────────────────────────────────────────────


@router.get("/tasks")
async def get_recent_tasks(
    admin: AdminUser,
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[dict]:
    """Recent task lifecycle events from Redis (task:status:* hashes).

    Useful for debugging: see which tasks ran, how long they took, and which failed.
    """
    from infra.redis_pool import get_redis

    redis = get_redis()
    tasks = []
    async for key in redis.scan_iter("task:status:*", count=200):
        data = await redis.hgetall(key)
        if not data:
            continue
        if status_filter and data.get("status") != status_filter:
            continue
        tasks.append(data)
        if len(tasks) >= limit:
            break

    # Sort by created_at descending (most recent first)
    tasks.sort(key=lambda t: t.get("created_at", ""), reverse=True)
    return tasks
