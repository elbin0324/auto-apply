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

BASE_URL = "https://api.ashbyhq.com/posting-api/job-board"


class AshbyCrawler(ATSCrawler):
    """Crawler for Ashby Job Board API.

    API docs: https://developers.ashbyhq.com/docs/public-job-posting-api
    - No authentication required
    - Returns all jobs in a single response
    - includeCompensation=true for salary data
    """

    async def fetch_jobs(self, company: Company) -> list[RawJobListing]:
        url = f"{BASE_URL}/{company.board_token}"
        params = {"includeCompensation": "true"}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                logger.error(
                    "Ashby API error for %s: %s %s",
                    company.slug,
                    e.response.status_code,
                    e.response.text[:200],
                )
                return []
            except httpx.TimeoutException:
                logger.error("Ashby API timeout for %s", company.slug)
                return []

        data = response.json()
        raw_jobs = data.get("jobs", [])

        listings: list[RawJobListing] = []
        for job in raw_jobs:
            if not job.get("isListed", True):
                continue
            try:
                listing = self._parse_job(company, job)
                listings.append(listing)
            except Exception:
                logger.warning(
                    "Failed to parse Ashby job for %s",
                    company.slug,
                    exc_info=True,
                )

        logger.info("Ashby crawl %s: %d jobs found", company.slug, len(listings))
        return listings

    def _parse_job(self, company: Company, job: dict) -> RawJobListing:
        # Ashby uses the job title as part of the URL slug
        job_url = job.get("jobUrl", "")
        apply_url = job.get("applyUrl", "")

        # Extract a stable ID from the applyUrl (jobId param) or use the URL slug
        job_id = ""
        if apply_url and "jobId=" in apply_url:
            job_id = apply_url.split("jobId=")[-1].split("&")[0]
        elif job_url:
            job_id = job_url.rstrip("/").split("/")[-1]

        # Location
        location = job.get("location")
        secondary = job.get("secondaryLocations", [])
        if secondary and location:
            extra = []
            for loc in secondary:
                addr = loc.get("postalAddress", {})
                city = addr.get("addressLocality")
                if city:
                    extra.append(city)
            if extra:
                location = f"{location}, {', '.join(extra)}"

        # Salary from compensation
        salary_min = None
        salary_max = None
        compensation = job.get("compensation")
        if compensation:
            tiers = compensation.get("compensationTiers", [])
            if tiers:
                first_tier = tiers[0]
                salary_min = first_tier.get("min")
                salary_max = first_tier.get("max")

        # Posted date
        posted_at = None
        published = job.get("publishedAt")
        if published:
            try:
                posted_at = datetime.fromisoformat(
                    published.replace("Z", "+00:00")
                )
            except ValueError:
                pass

        # Tags
        tags = []
        if job.get("department"):
            tags.append(job["department"])
        if job.get("team"):
            tags.append(job["team"])
        employment_type = job.get("employmentType")
        if employment_type:
            tags.append(employment_type)

        return RawJobListing(
            external_id=self.build_external_id(company, job_id),
            title=job.get("title", ""),
            company_name=company.name,
            location=location,
            location_type=normalize_location_type(
                is_remote=job.get("isRemote"),
                workplace_type=job.get("workplaceType"),
                location_text=location,
            ),
            salary_min=salary_min,
            salary_max=salary_max,
            description=strip_html(job.get("descriptionPlain") or job.get("descriptionHtml")),
            url=job_url,
            apply_url=apply_url,
            department=job.get("department"),
            posted_at=posted_at,
            tags=tags,
        )
