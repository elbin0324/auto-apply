import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from deps import CurrentUser, DbSession
from models.application import Application
from models.job import Job
from schemas.auto_apply import (
    ApplyTask,
    AutoApplyConfigResponse,
    AutoApplyConfigUpdate,
    QueueStatus,
)
from services.auto_apply_service import (
    build_user_profile_for_agent,
    get_or_create_config,
    get_queue_status,
    run_matching_for_user,
)
from services.queue_service import push_apply_task

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auto-apply", tags=["auto-apply"])


# ── Config CRUD ──────────────────────────────────────────────────────────────


@router.get("/config", response_model=AutoApplyConfigResponse)
async def get_config(
    user: CurrentUser, db: DbSession
) -> AutoApplyConfigResponse:
    config = await get_or_create_config(db, user.id)
    return AutoApplyConfigResponse.model_validate(config)


@router.put("/config", response_model=AutoApplyConfigResponse)
async def update_config(
    body: AutoApplyConfigUpdate, user: CurrentUser, db: DbSession
) -> AutoApplyConfigResponse:
    config = await get_or_create_config(db, user.id)

    had_titles = bool(config.target_titles)
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    await db.flush()

    # First-time trigger: if config now has titles and titles just changed, fetch immediately
    now_has_titles = bool(config.target_titles)
    if config.is_active and now_has_titles and (not had_titles or "target_titles" in update_data):
        from infra.task_queue import enqueue_fetch_jobs
        await enqueue_fetch_jobs(user.id, recent_only=False, source="config_update")

    return AutoApplyConfigResponse.model_validate(config)


# ── Start / Stop ─────────────────────────────────────────────────────────────


@router.post("/start")
async def start_auto_apply(user: CurrentUser, db: DbSession) -> dict:
    from services.auto_apply_service import count_user_scores
    from infra.task_queue import enqueue_fetch_jobs

    config = await get_or_create_config(db, user.id)

    if not config.target_titles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configure at least one target job title before starting.",
        )

    config.is_active = True
    await db.flush()

    # Check if user already has scored jobs
    score_count = await count_user_scores(db, user.id)

    if score_count == 0:
        # First time: trigger immediate fetch + score pipeline
        await enqueue_fetch_jobs(user.id, recent_only=False, source="auto_apply_start")
        return {"status": "started", "is_active": True, "finding_jobs": True}

    # Already has scores: run matching based on apply_mode
    match_stats = await run_matching_for_user(db, user.id, config)
    return {"status": "started", "is_active": True, "finding_jobs": False, **match_stats}


@router.post("/stop")
async def stop_auto_apply(user: CurrentUser, db: DbSession) -> dict:
    config = await get_or_create_config(db, user.id)
    config.is_active = False
    await db.flush()

    result = await db.execute(
        select(Application).where(
            Application.user_id == user.id,
            Application.status.in_(["queued", "pending_review"]),
        )
    )
    pending_apps = result.scalars().all()
    skipped_count = 0
    for app_row in pending_apps:
        app_row.status = "skipped"
        skipped_count += 1
    if skipped_count:
        await db.flush()

    return {
        "status": "stopped",
        "is_active": False,
        "applications_skipped": skipped_count,
    }


# ── Queue status ─────────────────────────────────────────────────────────────


@router.get("/queue", response_model=QueueStatus)
async def get_queue(user: CurrentUser, db: DbSession) -> QueueStatus:
    return await get_queue_status(db, user.id)


# ── Review ───────────────────────────────────────────────────────────────────


@router.post("/review/{application_id}")
async def review_application(
    application_id: UUID,
    user: CurrentUser,
    db: DbSession,
    action: str = Query(pattern="^(approve|reject)$"),
) -> dict:
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    if application.status != "pending_review":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application is not pending review (current: {application.status})",
        )

    if action == "approve":
        application.status = "queued"
        application.task_mode = "full_auto"
        await db.flush()

        job_result = await db.execute(
            select(Job.url).where(Job.id == application.job_id)
        )
        job_url = job_result.scalar_one_or_none() or ""

        user_profile, resume_text, resume_url = await build_user_profile_for_agent(
            db, user.id
        )

        task = ApplyTask(
            application_id=application.id,
            user_id=user.id,
            job_id=application.job_id,
            job_url=job_url,
            resume_url=resume_url or application.resume_used_url,
            resume_text=resume_text,
            user_profile=user_profile,
            mode="full_auto",
        )
        await push_apply_task(task)
        return {"application_id": str(application_id), "status": "queued"}

    application.status = "skipped"
    await db.flush()
    return {"application_id": str(application_id), "status": "skipped"}
