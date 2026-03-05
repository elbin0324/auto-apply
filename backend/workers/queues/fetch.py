"""Redis queue consumer for job fetch tasks (fetch:jobs).

Push functions live in ``infra.task_queue``.
This module retains only the consumer (pop) function.
"""

from schemas.queue_tasks import FetchJobsTask
from schemas.task_envelope import TaskEnvelope
from workers.queues import pop_task

FETCH_JOBS_QUEUE = "fetch:jobs"


async def pop_fetch_task() -> tuple[TaskEnvelope, FetchJobsTask] | None:
    """Pop one fetch task (blocking with 5s timeout)."""
    return await pop_task(FETCH_JOBS_QUEUE, FetchJobsTask)
