"""Cron job: enqueue fetch tasks for all active auto-apply users.

Replaces the arq scheduler's daily cron. Designed to run as a short-lived
Railway cron job that enqueues work and exits.

Usage:  python -m cron.enqueue_fetch
"""

import asyncio
import logging
import sys

from config import get_settings
from db.session import AsyncSessionLocal, engine
from infra.redis_pool import close_pool

logger = logging.getLogger(__name__)


async def main() -> int:
    """Query active configs, enqueue a fetch task per user, and exit."""
    from sqlalchemy import select

    from infra.task_queue import enqueue_fetch_jobs
    from models.auto_apply_config import AutoApplyConfig

    settings = get_settings()

    if settings.sentry_dsn:
        import sentry_sdk

        sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.env)

    if not settings.rapidapi_key:
        logger.info("RapidAPI key not configured, skipping fetch")
        return 0

    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(AutoApplyConfig).where(AutoApplyConfig.is_active.is_(True))
            )
            configs = list(result.scalars().all())

        if not configs:
            logger.info("No active auto-apply configs, nothing to enqueue")
            return 0

        for config in configs:
            await enqueue_fetch_jobs(
                config.user_id, recent_only=True, source="cron_daily"
            )

        logger.info("Enqueued %d fetch tasks", len(configs))
        return len(configs)
    finally:
        await close_pool()
        await engine.dispose()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    count = asyncio.run(main())
    logger.info("Done — enqueued %d tasks", count)
    sys.exit(0)
