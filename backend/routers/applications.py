import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from deps import CurrentUser, DbSession, SettingsDep, verify_internal_api_key
from models.application import Application
from models.auto_apply_config import AutoApplyConfig
from models.job import Job
from schemas.application import (
    ApplicationDetail,
    ApplicationListResponse,
    ApplicationStats,
)
from schemas.auto_apply import ApplyResult, ApplyTask, ProgressUpdate, SubmitAnswersRequest
from services.application_service import (
    get_application,
    get_application_stats,
    list_applications,
    process_agent_result,
    process_progress_update,
    reap_stale_applications,
)
from services.auto_apply_service import build_user_profile_for_agent, run_matching_for_user
from services.queue_service import push_apply_task

logger = logging.getLogger(__name__)

# ── User-facing endpoints ────────────────────────────────────────────────────

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=ApplicationListResponse)
async def list_user_applications(
    user: CurrentUser,
    db: DbSession,
    status_filter: str | None = Query(None, alias="status"),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
) -> ApplicationListResponse:
    return await list_applications(
        db, user.id, status_filter, date_from, date_to, page, per_page
    )


@router.get("/stats", response_model=ApplicationStats)
async def application_stats(
    user: CurrentUser,
    db: DbSession,
) -> ApplicationStats:
    return await get_application_stats(db, user.id)


@router.get("/{application_id}", response_model=ApplicationDetail)
async def get_application_detail(
    application_id: uuid.UUID,
    user: CurrentUser,
    db: DbSession,
) -> ApplicationDetail:
    application = await get_application(db, user.id, application_id)
    return ApplicationDetail.model_validate(application)


@router.post("/{application_id}/submit")
async def submit_reviewed_application(
    application_id: uuid.UUID,
    user: CurrentUser,
    db: DbSession,
    body: SubmitAnswersRequest,
) -> dict:
    """Submit reviewed/edited answers for an extracted application.

    Used in the human-in-the-loop flow: runner extracts fields + generates
    answers (extract_only mode), user reviews and edits, then submits here
    to trigger fill_and_submit mode.
    """
    application = await get_application(db, user.id, application_id)

    if application.status != "pending_review":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application must be in pending_review status (current: {application.status})",
        )

    if not application.generated_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application has no generated application data to submit",
        )

    # Look up job URL
    job_result = await db.execute(
        select(Job.url, Job.apply_url).where(Job.id == application.job_id)
    )
    job_row = job_result.one_or_none()
    job_url = (job_row.apply_url or job_row.url) if job_row else ""

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
        mode="fill_and_submit",
        provided_answers=body.answers,
    )
    await push_apply_task(task)

    application.status = "queued"
    application.task_mode = "fill_and_submit"
    application.current_phase = None
    application.phase_message = None
    await db.flush()

    return {"application_id": str(application.id), "status": "queued"}


# ── Internal endpoint (agent workers) ────────────────────────────────────

internal_router = APIRouter(
    prefix="/internal/applications", tags=["internal"]
)


@internal_router.post(
    "/result",
    dependencies=[Depends(verify_internal_api_key)],
    status_code=status.HTTP_200_OK,
)
async def receive_agent_result(body: ApplyResult, db: DbSession) -> dict:
    application = await process_agent_result(db, body)
    return {
        "application_id": str(application.id),
        "status": application.status,
    }


@internal_router.post(
    "/progress",
    dependencies=[Depends(verify_internal_api_key)],
    status_code=status.HTTP_200_OK,
)
async def receive_progress_update(body: ProgressUpdate, db: DbSession) -> dict:
    """Receive a progress update from the runner during task execution."""
    application = await process_progress_update(db, body)
    return {
        "application_id": str(application.id),
        "phase": application.current_phase,
    }


# ── Internal: manual rematch trigger ─────────────────────────────────────

scheduler_router = APIRouter(prefix="/internal/scheduler", tags=["internal"])


@scheduler_router.post(
    "/rematch",
    dependencies=[Depends(verify_internal_api_key)],
    status_code=status.HTTP_200_OK,
)
async def trigger_rematch(db: DbSession) -> dict:
    """Manually trigger a rematch cycle for all active auto-apply users."""
    result = await db.execute(
        select(AutoApplyConfig).where(AutoApplyConfig.is_active.is_(True))
    )
    active_configs = result.scalars().all()

    total_stats: dict[str, int] = {"users_processed": 0, "total_queued": 0}
    for config in active_configs:
        try:
            stats = await run_matching_for_user(db, config.user_id, config)
            total_stats["users_processed"] += 1
            total_stats["total_queued"] += stats.get("queued", 0)
        except Exception:
            logger.exception(
                "Rematch failed for user %s, continuing", config.user_id
            )

    return total_stats


@scheduler_router.post(
    "/fetch",
    dependencies=[Depends(verify_internal_api_key)],
    status_code=status.HTTP_200_OK,
)
async def trigger_fetch(db: DbSession, settings: SettingsDep) -> dict:
    """Enqueue fetch tasks for all active auto-apply users.

    Called by Railway cron job daily. Replaces the old arq scheduler cron.
    """
    from infra.task_queue import enqueue_fetch_jobs

    if not settings.rapidapi_key:
        return {"users_enqueued": 0, "skipped": True, "reason": "rapidapi_key_not_configured"}

    result = await db.execute(
        select(AutoApplyConfig).where(AutoApplyConfig.is_active.is_(True))
    )
    configs = list(result.scalars().all())

    if not configs:
        return {"users_enqueued": 0}

    for config in configs:
        await enqueue_fetch_jobs(
            config.user_id, recent_only=True, source="cron_daily"
        )

    logger.info("Cron fetch: enqueued %d fetch tasks", len(configs))
    return {"users_enqueued": len(configs)}


@scheduler_router.post(
    "/reap-stale",
    dependencies=[Depends(verify_internal_api_key)],
    status_code=status.HTTP_200_OK,
)
async def trigger_reap_stale(db: DbSession) -> dict:
    """Reap applications stuck in queued/in_progress for too long.

    Called by Railway cron job every 5 minutes.
    """
    reaped = await reap_stale_applications(db)
    return {"reaped": reaped}
