import logging
from datetime import datetime

import httpx

from models.company import Company
from services.crawlers.base import (
    ATSCrawler,
    RawJobListing,
    normalize_location_type,
    strip_html,
)

logger = logging.getLogger(__name__)

BASE_URL = "https://api.lever.co/v0/postings"


class LeverCrawler(ATSCrawler):
    """Crawler for Lever Postings API.

    API docs: https://github.com/lever/postings-api
    - No authentication required for GET endpoints
    - Rate limit: 2 req/s for POST only; GET is not limited
    - Supports pagination via skip + limit
    - Returns applyUrl directly
    """

    async def fetch_jobs(self, company: Company) -> list[RawJobListing]:
        url = f"{BASE_URL}/{company.board_token}"
        params = {"mode": "json"}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                logger.error(
                    "Lever API error for %s: %s %s",
                    company.slug,
                    e.response.status_code,
                    e.response.text[:200],
                )
                return []
            except httpx.TimeoutException:
                logger.error("Lever API timeout for %s", company.slug)
                return []

        raw_jobs = response.json()
        if not isinstance(raw_jobs, list):
            logger.error("Lever unexpected response for %s", company.slug)
            return []

        listings: list[RawJobListing] = []
        for job in raw_jobs:
            try:
                listing = self._parse_job(company, job)
                listings.append(listing)
            except Exception:
                logger.warning(
                    "Failed to parse Lever job %s for %s",
                    job.get("id"),
                    company.slug,
                    exc_info=True,
                )

        logger.info("Lever crawl %s: %d jobs found", company.slug, len(listings))
        return listings

    def _parse_job(self, company: Company, job: dict) -> RawJobListing:
        job_id = str(job["id"])
        categories = job.get("categories", {})

        # Location
        location = categories.get("location")
        all_locations = categories.get("allLocations", [])
        if all_locations and not location:
            location = ", ".join(all_locations)

        # Salary
        salary_min = None
        salary_max = None
        salary_currency = "CAD"
        salary_range = job.get("salaryRange")
        if salary_range:
            salary_min = salary_range.get("min")
            salary_max = salary_range.get("max")
            salary_currency = salary_range.get("currency", "CAD")

        # Posted date
        posted_at = None
        created_at_ms = job.get("createdAt")
        if created_at_ms:
            try:
                posted_at = datetime.fromtimestamp(
                    created_at_ms / 1000, tz=__import__("datetime").timezone.utc
                )
            except (ValueError, OSError):
                pass

        # Tags from categories
        tags = []
        if categories.get("team"):
            tags.append(categories["team"])
        if categories.get("department"):
            tags.append(categories["department"])
        commitment = categories.get("commitment")

        return RawJobListing(
            external_id=self.build_external_id(company, job_id),
            title=job.get("text", ""),
            company_name=company.name,
            location=location,
            location_type=normalize_location_type(
                workplace_type=job.get("workplaceType"),
                location_text=location,
            ),
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency=salary_currency,
            description=strip_html(job.get("descriptionPlain") or job.get("description")),
            url=job.get("hostedUrl", ""),
            apply_url=job.get("applyUrl", ""),
            department=categories.get("department") or categories.get("team"),
            posted_at=posted_at,
            tags=tags,
        )
