"""Unified task queue interface — the only place the main app writes to queues.

All queue producers (routes, cron tasks, admin triggers) import from this
module.  Consumers (FetchWorker, ScoreWorker, EnrichWorker) have their own
pop logic and are not affected by this module.

Each enqueue function:
- Wraps the inner task in a ``TaskEnvelope`` with observability fields
- RPUSHes to the appropriate Redis list
- Logs with task_id, source, and item count
- Returns the task_id for caller tracking / correlation
"""

import logging
from uuid import UUID, uuid4

from schemas.queue_tasks import FetchJobsTask, ScoreJobsTask
from schemas.enrichment import EnrichJobsTask
from schemas.task_envelope import TaskEnvelope
from infra.redis_pool import get_redis

logger = logging.getLogger(__name__)

FETCH_JOBS_QUEUE = "fetch:jobs"
SCORE_JOBS_QUEUE = "score:jobs"
ENRICH_JOBS_QUEUE = "enrich:jobs"

ALL_QUEUES = [FETCH_JOBS_QUEUE, SCORE_JOBS_QUEUE, ENRICH_JOBS_QUEUE]


async def enqueue_fetch_jobs(
    user_id: UUID,
    *,
    recent_only: bool = False,
    source: str = "api",
    correlation_id: UUID | None = None,
) -> UUID:
    """Enqueue a job-fetch task for a single user.

    Args:
        user_id: The user whose config drives the API query.
        recent_only: True for 24h endpoint (daily cron), False for 7d (backfill).
        source: Why this task was created (cron_daily, onboarding, etc.).
        correlation_id: Optional ID linking related tasks across queues.

    Returns:
        The task_id of the enqueued task.
    """
    task = FetchJobsTask(user_id=user_id, recent_only=recent_only)
    task_id = uuid4()
    envelope = TaskEnvelope(
        task_id=task_id,
        task_type="fetch_jobs",
        queue_name=FETCH_JOBS_QUEUE,
        user_id=str(user_id),
        correlation_id=str(correlation_id or task_id),
        source=source,
        source_worker=source,
        payload=task.model_dump_json(),
    )
    redis = get_redis()
    await redis.rpush(FETCH_JOBS_QUEUE, envelope.model_dump_json())
    logger.info(
        "Enqueued fetch_jobs task_id=%s user_id=%s recent_only=%s source=%s",
        task_id,
        user_id,
        recent_only,
        source,
    )
    return task_id


async def enqueue_score_jobs(
    user_id: UUID,
    *,
    force: bool = False,
    source: str = "job_fetch",
    correlation_id: UUID | None = None,
) -> UUID:
    """Enqueue a per-user scoring task.

    Args:
        user_id: The user to score jobs for.
        force: If True, clear existing scores and rescore all filtered jobs.
        source: Why this task was created (job_fetch, user_rescore, etc.).
        correlation_id: Optional ID linking to the upstream fetch task.

    Returns:
        The task_id of the enqueued task.
    """
    task = ScoreJobsTask(user_id=user_id, force=force)
    task_id = uuid4()
    envelope = TaskEnvelope(
        task_id=task_id,
        task_type="score_jobs",
        queue_name=SCORE_JOBS_QUEUE,
        user_id=str(user_id),
        correlation_id=str(correlation_id or task_id),
        source=source,
        source_worker=source,
        payload=task.model_dump_json(),
    )
    redis = get_redis()
    await redis.rpush(SCORE_JOBS_QUEUE, envelope.model_dump_json())
    logger.info(
        "Enqueued score_jobs task_id=%s user_id=%s force=%s source=%s",
        task_id,
        user_id,
        force,
        source,
    )
    return task_id


async def enqueue_enrich_jobs(
    job_ids: list[UUID],
    *,
    user_id: UUID | None = None,
    source: str = "score_worker",
    correlation_id: UUID | None = None,
) -> UUID:
    """Enqueue an enrichment task for a batch of jobs.

    Args:
        job_ids: Job UUIDs to enrich.
        user_id: Optional user context for monitoring/tracing.
        source: Why this task was created (score_worker, admin_trigger, etc.).
        correlation_id: Optional ID linking to the upstream score task.

    Returns:
        The task_id of the enqueued task.
    """
    task = EnrichJobsTask(job_ids=job_ids, user_id=user_id)
    task_id = uuid4()
    envelope = TaskEnvelope(
        task_id=task_id,
        task_type="enrich_jobs",
        queue_name=ENRICH_JOBS_QUEUE,
        user_id=str(user_id) if user_id else "",
        correlation_id=str(correlation_id or task_id),
        source=source,
        source_worker=source,
        payload=task.model_dump_json(),
    )
    redis = get_redis()
    await redis.rpush(ENRICH_JOBS_QUEUE, envelope.model_dump_json())
    logger.info(
        "Enqueued enrich_jobs task_id=%s jobs=%d source=%s",
        task_id,
        len(job_ids),
        source,
    )
    return task_id


async def get_queue_depths() -> dict[str, int]:
    """Return the current depth of all managed queues."""
    redis = get_redis()
    return {queue: await redis.llen(queue) for queue in ALL_QUEUES}
