import logging
from datetime import datetime, timezone

import httpx

from models.company import Company
from services.crawlers.base import (
    ATSCrawler,
    RawJobListing,
    normalize_location_type,
    strip_html,
)

logger = logging.getLogger(__name__)

BASE_URL = "https://boards-api.greenhouse.io/v1/boards"


class GreenhouseCrawler(ATSCrawler):
    """Crawler for Greenhouse Job Board API.

    API docs: https://developers.greenhouse.io/job-board.html
    - No authentication required for GET endpoints
    - No published rate limits (responses are cached)
    - Returns all jobs in a single response (no pagination needed)
    """

    async def fetch_jobs(self, company: Company) -> list[RawJobListing]:
        url = f"{BASE_URL}/{company.board_token}/jobs"
        params = {"content": "true"}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                logger.error(
                    "Greenhouse API error for %s: %s %s",
                    company.slug,
                    e.response.status_code,
                    e.response.text[:200],
                )
                return []
            except httpx.TimeoutException:
                logger.error("Greenhouse API timeout for %s", company.slug)
                return []

        data = response.json()
        raw_jobs = data.get("jobs", [])
        listings: list[RawJobListing] = []

        for job in raw_jobs:
            try:
                listing = self._parse_job(company, job)
                listings.append(listing)
            except Exception:
                logger.warning(
                    "Failed to parse Greenhouse job %s for %s",
                    job.get("id"),
                    company.slug,
                    exc_info=True,
                )

        logger.info(
            "Greenhouse crawl %s: %d jobs found", company.slug, len(listings)
        )
        return listings

    def _parse_job(self, company: Company, job: dict) -> RawJobListing:
        job_id = str(job["id"])
        location = job.get("location", {})
        location_name = location.get("name") if isinstance(location, dict) else None

        # Greenhouse absolute_url is the job posting page
        absolute_url = job.get("absolute_url", "")
        # The apply form is on the same page (anchor) or via /apply suffix
        apply_url = f"{absolute_url}#app" if absolute_url else ""

        # Parse departments for tags
        departments = job.get("departments", [])
        tags = [d["name"] for d in departments if d.get("name")]

        # Parse posted date
        posted_at = None
        updated_at_str = job.get("updated_at")
        if updated_at_str:
            try:
                posted_at = datetime.fromisoformat(
                    updated_at_str.replace("Z", "+00:00")
                )
            except ValueError:
                pass

        return RawJobListing(
            external_id=self.build_external_id(company, job_id),
            title=job.get("title", ""),
            company_name=company.name,
            location=location_name,
            location_type=normalize_location_type(location_text=location_name),
            description=strip_html(job.get("content")),
            url=absolute_url,
            apply_url=apply_url,
            department=tags[0] if tags else None,
            posted_at=posted_at,
            tags=tags,
        )
