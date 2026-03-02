import asyncio
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

PAGE_SIZE = 20
REQUEST_DELAY = 1.0  # Seconds between requests (be polite to undocumented API)


class WorkdayCrawler(ATSCrawler):
    """Crawler for Workday career pages via their undocumented CXS API.

    This is a reverse-engineered, undocumented API. It may break without notice.
    URL pattern: {company}.{wd_instance}.myworkdayjobs.com/wday/cxs/{company}/{site}/jobs

    The company's ats_base_url should be set to the full base, e.g.:
        "company.wd5.myworkdayjobs.com/wday/cxs/company/site"
    And board_token is used as the site name for URL construction.
    """

    async def fetch_jobs(self, company: Company) -> list[RawJobListing]:
        if not company.ats_base_url:
            logger.error(
                "Workday crawler requires ats_base_url for %s", company.slug
            )
            return []

        base_url = company.ats_base_url.rstrip("/")
        jobs_url = f"https://{base_url}/jobs"

        listings: list[RawJobListing] = []
        offset = 0

        async with httpx.AsyncClient() as client:
            while True:
                payload = {
                    "appliedFacets": {},
                    "limit": PAGE_SIZE,
                    "offset": offset,
                    "searchText": "",
                }
                headers = {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                }

                try:
                    response = await client.post(
                        jobs_url,
                        json=payload,
                        headers=headers,
                        timeout=30.0,
                    )
                    response.raise_for_status()
                except httpx.HTTPStatusError as e:
                    logger.error(
                        "Workday API error for %s: %s",
                        company.slug,
                        e.response.status_code,
                    )
                    break
                except httpx.TimeoutException:
                    logger.error("Workday API timeout for %s", company.slug)
                    break

                data = response.json()
                job_postings = data.get("jobPostings", [])
                total = data.get("total", 0)

                for job in job_postings:
                    try:
                        listing = self._parse_job(company, base_url, job)
                        listings.append(listing)
                    except Exception:
                        logger.warning(
                            "Failed to parse Workday job for %s",
                            company.slug,
                            exc_info=True,
                        )

                offset += PAGE_SIZE
                if offset >= total or not job_postings:
                    break

                # Polite delay between pages
                await asyncio.sleep(REQUEST_DELAY)

        logger.info(
            "Workday crawl %s: %d jobs found", company.slug, len(listings)
        )
        return listings

    def _parse_job(
        self, company: Company, base_url: str, job: dict
    ) -> RawJobListing:
        title = job.get("title", "")
        external_path = job.get("externalPath", "")

        # Build URLs from the base + external path
        # Career page base (strip /wday/cxs/... to get the public-facing domain)
        public_base = base_url.split("/wday/cxs")[0]
        job_url = f"https://{public_base}{external_path}"
        apply_url = f"{job_url}/apply"

        # Use externalPath as a stable ID
        job_id = external_path.strip("/").replace("/", "_")

        # Location from bullet fields
        location = job.get("locationsText")
        bullet_fields = job.get("bulletFields", [])

        # Parse location type from bullets (e.g., "Full time", "Remote")
        location_type = None
        for bullet in bullet_fields:
            if isinstance(bullet, str):
                location_type = normalize_location_type(location_text=bullet)
                if location_type:
                    break

        # Posted date
        posted_at = None
        posted_on = job.get("postedOn")
        if posted_on:
            try:
                posted_at = datetime.fromisoformat(
                    posted_on.replace("Z", "+00:00")
                )
            except ValueError:
                # Sometimes it's in a different format like "Posted 2 Days Ago"
                pass

        return RawJobListing(
            external_id=self.build_external_id(company, job_id),
            title=title,
            company_name=company.name,
            location=location,
            location_type=location_type,
            description=None,  # List endpoint doesn't include descriptions
            url=job_url,
            apply_url=apply_url,
            posted_at=posted_at,
            tags=[],
        )
