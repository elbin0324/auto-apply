"""arq background worker — periodic job fetch and continuous auto-apply re-matching.

Run with:  poetry run arq worker.WorkerSettings
"""

import logging
from typing import Any

from arq import cron
from arq.connections import RedisSettings

from config import get_settings

logger = logging.getLogger(__name__)


async def startup(ctx: dict[str, Any]) -> None:
    """Initialise database session factory for background tasks."""
    from db.session import AsyncSessionLocal

    settings = get_settings()
    if settings.sentry_dsn:
        import sentry_sdk

        sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.env)

    ctx["db_factory"] = AsyncSessionLocal
    logger.info("arq scheduler worker started")


async def shutdown(ctx: dict[str, Any]) -> None:
    logger.info("arq scheduler worker shutting down")


# ── Background Tasks ─────────────────────────────────────────────────────────


async def task_fetch_jobs_for_users(ctx: dict[str, Any]) -> dict[str, Any]:
    """Daily cron: query Active Jobs DB (24h endpoint) for each active user, upsert, push to score queue.

    Skips if RAPIDAPI_KEY is not configured. Uses recent_only=True so the daily
    cron only fetches jobs posted in the last 24 hours.
    """
    from services.job_fetch_service import fetch_jobs_for_all_active_users

    settings = get_settings()
    if not settings.rapidapi_key:
        logger.debug("RapidAPI key not configured, skipping fetch")
        return {"skipped": True, "reason": "fantastic_not_configured"}

    db_factory = ctx["db_factory"]
    async with db_factory() as db:
        try:
            stats = await fetch_jobs_for_all_active_users(db, recent_only=True)
            logger.info("Scheduled job fetch complete: %s", stats)
            return stats
        except Exception:
            await db.rollback()
            logger.exception("Scheduled job fetch failed")
            raise


async def task_rematch_active_users(ctx: dict[str, Any]) -> dict[str, Any]:
    """Periodic: re-run matching for all users with active auto-apply.

    This is what makes auto-apply truly continuous — new jobs fetched since
    the user started auto-apply will be matched and queued automatically.
    """
    from sqlalchemy import select

    from models.auto_apply_config import AutoApplyConfig
    from services.auto_apply_service import run_matching_for_user

    db_factory = ctx["db_factory"]
    async with db_factory() as db:
        try:
            result = await db.execute(
                select(AutoApplyConfig).where(AutoApplyConfig.is_active.is_(True))
            )
            active_configs = result.scalars().all()

            if not active_configs:
                logger.debug("No active auto-apply configs, skipping rematch")
                return {"users_processed": 0, "total_queued": 0}

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

            await db.commit()
            logger.info("Scheduled rematch complete: %s", total_stats)
            return total_stats
        except Exception:
            await db.rollback()
            logger.exception("Scheduled rematch failed")
            raise


async def task_fetch_jobs_for_single_user(
    ctx: dict[str, Any], user_id_str: str, recent_only_str: str = "false"
) -> dict[str, Any]:
    """On-demand: fetch + score jobs for a single user.

    Enqueued by the API when a user completes onboarding (7d catch-up),
    activates auto-apply for the first time, or changes their target titles.

    Args:
        ctx: arq context with db_factory.
        user_id_str: User UUID as string.
        recent_only_str: "true" for 24h endpoint, "false" for 7d (default).
    """
    from uuid import UUID

    from sqlalchemy import select

    from models.auto_apply_config import AutoApplyConfig
    from services.job_fetch_service import fetch_jobs_for_user

    user_id = UUID(user_id_str)
    recent_only = recent_only_str.lower() == "true"
    settings = get_settings()
    if not settings.rapidapi_key:
        return {"skipped": True, "reason": "fantastic_not_configured"}

    db_factory = ctx["db_factory"]
    async with db_factory() as db:
        try:
            result = await db.execute(
                select(AutoApplyConfig).where(AutoApplyConfig.user_id == user_id)
            )
            config = result.scalar_one_or_none()
            if not config:
                return {"skipped": True, "reason": "no_config"}

            fetch_stats = await fetch_jobs_for_user(
                db, user_id, config, recent_only=recent_only
            )
            await db.commit()

            logger.info("On-demand job fetch for user %s: %s", user_id, fetch_stats)
            return {"user_id": user_id_str, **fetch_stats}
        except Exception:
            await db.rollback()
            logger.exception("On-demand job fetch failed for user %s", user_id)
            raise


# ── Worker Configuration ──────────────────────────────────────────────────────


settings = get_settings()


class WorkerSettings:
    """arq worker configuration with cron jobs for job fetch and rematch."""

    functions = [
        task_fetch_jobs_for_users,
        task_rematch_active_users,
        task_fetch_jobs_for_single_user,
    ]

    cron_jobs = [
        # Fetch jobs from Active Jobs DB (24h endpoint) for all active users — daily at 6 AM UTC
        cron(
            task_fetch_jobs_for_users,
            hour={6},
            minute={0},
            run_at_startup=True,
            unique=True,
            timeout=300,
        ),
        # Re-match active users using pre-computed scores, queue apply tasks
        cron(
            task_rematch_active_users,
            minute={0, 30},
            run_at_startup=False,
            unique=True,
            timeout=120,
        ),
    ]

    on_startup = startup
    on_shutdown = shutdown

    redis_settings = RedisSettings.from_dsn(settings.redis_url)

    # Use a distinct queue name so we don't interfere with the
    # auto_apply:tasks queue consumed by apply-agents workers.
    queue_name = "arq:scheduler"

    max_jobs = 5
    job_timeout = 300  # 5 minutes max per task
