"""Crawl worker — polls crawl:companies, crawls ATS, pushes to score:jobs + enrich:jobs.

Run with: cd backend && poetry run python -m workers.crawl
Scale by running multiple instances.
"""

import logging
import os
import sys

# Make backend/ importable when run directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select  # noqa: E402

from db.session import AsyncSessionLocal  # noqa: E402
from models.company import Company  # noqa: E402
from models.job import Job  # noqa: E402
from schemas.crawl import CrawlTask, ScoreJobsTask  # noqa: E402
from schemas.enrichment import EnrichJobsTask  # noqa: E402
from schemas.task_envelope import TaskEnvelope  # noqa: E402
from services.crawl_queue_service import clear_crawl_dedup, pop_crawl_task  # noqa: E402
from services.enrich_queue_service import push_enrich_task  # noqa: E402
from services.job_discovery import crawl_company  # noqa: E402
from services.score_queue_service import push_score_jobs_task  # noqa: E402
from services.worker_base import BaseWorker  # noqa: E402

logger = logging.getLogger("crawl_worker")


class CrawlWorker(BaseWorker[CrawlTask]):
    async def pop_task(self) -> tuple[TaskEnvelope, CrawlTask] | None:
        return await pop_crawl_task()

    async def process_task(self, task: CrawlTask) -> None:
        async with AsyncSessionLocal() as db:
            try:
                result = await db.execute(
                    select(Company).where(
                        Company.id == task.company_id,
                        Company.is_active.is_(True),
                    )
                )
                company = result.scalar_one_or_none()
                if not company:
                    logger.warning("Company %s not found or inactive", task.company_slug)
                    return

                crawl_result = await crawl_company(db, company)
                await db.commit()

                if crawl_result.error:
                    logger.error("Crawl failed for %s: %s", task.company_slug, crawl_result.error)
                    return

                # Get IDs of active jobs for this company to push to scoring
                job_result = await db.execute(
                    select(Job.id).where(
                        Job.company_id == task.company_id,
                        Job.is_active.is_(True),
                    )
                )
                job_ids = [row[0] for row in job_result.fetchall()]

                if job_ids:
                    score_task = ScoreJobsTask(
                        company_id=task.company_id,
                        job_ids=job_ids,
                    )
                    await push_score_jobs_task(score_task)

                    enrich_task = EnrichJobsTask(
                        company_id=task.company_id,
                        job_ids=job_ids,
                    )
                    await push_enrich_task(enrich_task)

                logger.info(
                    "Crawl complete for %s: %d jobs found, %d pushed to scoring + enrichment",
                    task.company_slug,
                    crawl_result.jobs_found,
                    len(job_ids),
                )
            except Exception:
                await db.rollback()
                logger.exception("Error processing crawl task for %s", task.company_slug)
            finally:
                await clear_crawl_dedup(str(task.company_id))

    def task_label(self, task: CrawlTask) -> str:
        return f"company:{task.company_slug}"


if __name__ == "__main__":
    CrawlWorker("crawl").run()
