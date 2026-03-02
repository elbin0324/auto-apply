"""Standalone score worker — polls score:jobs and score:users, embeds and scores.

Run with: cd backend && poetry run python score_worker.py

Alternates between score:jobs (higher priority — new content to index)
and score:users (triggered by profile updates or scheduled re-scoring).
"""

import asyncio
import logging
import os
import signal
import sys

# Make backend/ importable
sys.path.insert(0, os.path.dirname(__file__))

from config import get_settings  # noqa: E402
from db.session import AsyncSessionLocal  # noqa: E402
from services.score_queue_service import pop_score_jobs_task, pop_score_user_task  # noqa: E402
from services.score_service import (  # noqa: E402
    embed_and_store_jobs,
    embed_and_store_user,
    score_new_jobs_for_users,
    score_user_against_all_jobs,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("score_worker")

_shutdown = asyncio.Event()


def _handle_signal(signum: int, _frame: object) -> None:
    logger.info("Received signal %s, initiating graceful shutdown...", signum)
    _shutdown.set()


async def process_score_jobs(task: object) -> None:
    """Embed new jobs and score them for active users."""
    # Step 1: Embed un-embedded jobs
    async with AsyncSessionLocal() as db:
        try:
            embed_stats = await embed_and_store_jobs(db, task.job_ids)
            await db.commit()
        except Exception:
            await db.rollback()
            logger.exception("Embedding failed for company %s", task.company_id)
            return

    # Step 2: Score new jobs for all active users
    async with AsyncSessionLocal() as db:
        try:
            score_stats = await score_new_jobs_for_users(db, task.job_ids)
            await db.commit()
        except Exception:
            await db.rollback()
            logger.exception("Scoring failed for company %s", task.company_id)
            return

    logger.info(
        "Score jobs complete for company %s: embed=%s, score=%s",
        task.company_id,
        embed_stats,
        score_stats,
    )


async def process_score_user(task: object) -> None:
    """Embed user profile and score against all jobs."""
    # Step 1: Embed the user profile
    async with AsyncSessionLocal() as db:
        try:
            embedded = await embed_and_store_user(db, task.user_id)
            await db.commit()
        except Exception:
            await db.rollback()
            logger.exception("Embedding failed for user %s", task.user_id)
            return

    if not embedded:
        logger.warning("Could not embed user %s, skipping scoring", task.user_id)
        return

    # Step 2: Vector search + heuristic re-rank
    async with AsyncSessionLocal() as db:
        try:
            score_stats = await score_user_against_all_jobs(db, task.user_id)
            await db.commit()
        except Exception:
            await db.rollback()
            logger.exception("Scoring failed for user %s", task.user_id)
            return

    logger.info("Score user complete for %s: %s", task.user_id, score_stats)


async def worker_loop() -> None:
    """Alternate between checking score:jobs and score:users queues."""
    settings = get_settings()

    if not settings.voyage_api_key:
        logger.error("VOYAGE_API_KEY not configured, score worker cannot start")
        return

    logger.info("Score worker starting, polling score:jobs and score:users")

    while not _shutdown.is_set():
        # Check score:jobs first (higher priority — new content to index)
        task = await pop_score_jobs_task()
        if task:
            await process_score_jobs(task)
            continue

        # Then check score:users
        task = await pop_score_user_task()
        if task:
            await process_score_user(task)
            continue

        # Both queues empty — blpop in pop functions already waited 5s


def main() -> None:
    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)
    asyncio.run(worker_loop())


if __name__ == "__main__":
    main()
