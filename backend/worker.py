"""arq background worker — periodic job sync and continuous auto-apply re-matching.

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

    ctx["db_factory"] = AsyncSessionLocal
    logger.info("arq scheduler worker started")


async def shutdown(ctx: dict[str, Any]) -> None:
    logger.info("arq scheduler worker shutting down")


# ── Background Tasks ─────────────────────────────────────────────────────────


async def task_sync_jobs(ctx: dict[str, Any]) -> dict[str, Any]:
    """Periodic: fetch new jobs from Adzuna and compute match scores.

    Skips if Adzuna credentials are not configured.
    """
    from services.job_matcher import compute_scores_for_sync
    from services.job_sync import run_sync

    settings = get_settings()
    if not settings.adzuna_app_id or not settings.adzuna_api_key:
        logger.debug("Adzuna not configured, skipping sync")
        return {"skipped": True, "reason": "adzuna_not_configured"}

    db_factory = ctx["db_factory"]
    async with db_factory() as db:
        try:
            sync_stats = await run_sync(db)
            synced_ids = sync_stats.pop("synced_external_ids", [])

            score_stats = await compute_scores_for_sync(db, synced_ids)
            await db.commit()

            logger.info(
                "Scheduled sync complete: %s, scores: %s", sync_stats, score_stats
            )
            return {"sync": sync_stats, "scoring": score_stats}
        except Exception:
            await db.rollback()
            logger.exception("Scheduled job sync failed")
            raise


async def task_discover_jobs(ctx: dict[str, Any]) -> dict[str, Any]:
    """Periodic: crawl all active companies in the registry for new jobs."""
    from services.job_discovery import run_discovery
    from services.job_matcher import compute_scores_for_sync

    db_factory = ctx["db_factory"]
    async with db_factory() as db:
        try:
            discovery_stats = await run_discovery(db)
            score_stats = await compute_scores_for_sync(db, synced_external_ids=[])
            await db.commit()

            logger.info(
                "Scheduled discovery complete: %d companies, %d jobs found, scores: %s",
                discovery_stats.get("companies_crawled", 0),
                discovery_stats.get("total_jobs_found", 0),
                score_stats,
            )
            return {
                "discovery": {
                    k: v
                    for k, v in discovery_stats.items()
                    if k != "results"
                },
                "scoring": score_stats,
            }
        except Exception:
            await db.rollback()
            logger.exception("Scheduled job discovery failed")
            raise


async def task_rematch_active_users(ctx: dict[str, Any]) -> dict[str, Any]:
    """Periodic: re-run matching for all users with active auto-apply.

    This is what makes auto-apply truly continuous — new jobs synced since
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


# ── Worker Configuration ──────────────────────────────────────────────────────


settings = get_settings()


class WorkerSettings:
    """arq worker configuration with cron jobs for sync and rematch."""

    functions = [task_sync_jobs, task_discover_jobs, task_rematch_active_users]

    cron_jobs = [
        # Legacy Adzuna sync — runs if ADZUNA_APP_ID is configured
        cron(
            task_sync_jobs,
            hour={0, 6, 12, 18},
            minute=0,
            run_at_startup=False,
            unique=True,
            timeout=300,
        ),
        # ATS career page crawling — every 6 hours, offset by 1h from Adzuna
        cron(
            task_discover_jobs,
            hour={1, 7, 13, 19},
            minute=0,
            run_at_startup=False,
            unique=True,
            timeout=600,
        ),
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
