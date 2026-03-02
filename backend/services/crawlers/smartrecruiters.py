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

BASE_URL = "https://api.smartrecruiters.com/v1/companies"
PAGE_SIZE = 100


class SmartRecruitersCrawler(ATSCrawler):
    """Crawler for SmartRecruiters Posting API.

    API docs: https://developers.smartrecruiters.com/docs/posting-api
    - No authentication required for public postings
    - Rate limit: 10 req/s, 8 concurrent
    - Paginated via offset + limit (max 100)
    - Need individual job detail call for applyUrl
    """

    async def fetch_jobs(self, company: Company) -> list[RawJobListing]:
        listings: list[RawJobListing] = []
        offset = 0

        async with httpx.AsyncClient() as client:
            while True:
                url = f"{BASE_URL}/{company.board_token}/postings"
                params = {"limit": PAGE_SIZE, "offset": offset}

                try:
                    response = await client.get(url, params=params, timeout=30.0)
                    response.raise_for_status()
                except httpx.HTTPStatusError as e:
                    logger.error(
                        "SmartRecruiters API error for %s: %s %s",
                        company.slug,
                        e.response.status_code,
                        e.response.text[:200],
                    )
                    break
                except httpx.TimeoutException:
                    logger.error(
                        "SmartRecruiters API timeout for %s", company.slug
                    )
                    break

                data = response.json()
                raw_jobs = data.get("content", [])
                total = data.get("totalFound", 0)

                for job in raw_jobs:
                    try:
                        listing = await self._parse_job(client, company, job)
                        listings.append(listing)
                    except Exception:
                        logger.warning(
                            "Failed to parse SmartRecruiters job %s for %s",
                            job.get("id"),
                            company.slug,
                            exc_info=True,
                        )

                offset += PAGE_SIZE
                if offset >= total or not raw_jobs:
                    break

        logger.info(
            "SmartRecruiters crawl %s: %d jobs found",
            company.slug,
            len(listings),
        )
        return listings

    async def _parse_job(
        self, client: httpx.AsyncClient, company: Company, job: dict
    ) -> RawJobListing:
        job_id = str(job.get("id", job.get("uuid", "")))
        location_data = job.get("location", {})
        location_parts = []
        if location_data.get("city"):
            location_parts.append(location_data["city"])
        if location_data.get("region"):
            location_parts.append(location_data["region"])
        if location_data.get("country"):
            location_parts.append(location_data["country"])
        location = ", ".join(location_parts) if location_parts else None

        is_remote = location_data.get("remote", False)

        # Construct apply URL from the public career page
        posting_url = f"https://jobs.smartrecruiters.com/{company.board_token}/{job_id}"
        apply_url = f"{posting_url}/apply"

        # Try to get salary from the detail endpoint
        salary_min = None
        salary_max = None
        salary_currency = "CAD"
        description = None

        # Fetch detail for description and salary (ref link)
        ref = job.get("ref")
        if ref:
            try:
                detail_resp = await client.get(ref, timeout=15.0)
                if detail_resp.status_code == 200:
                    detail = detail_resp.json()
                    # Apply URL from detail
                    if detail.get("applyUrl"):
                        apply_url = detail["applyUrl"]

                    # Salary
                    comp = detail.get("compensation")
                    if comp:
                        salary_min = comp.get("min")
                        salary_max = comp.get("max")
                        salary_currency = comp.get("currency", "CAD")

                    # Description from jobAd sections
                    job_ad = detail.get("jobAd", {})
                    sections = job_ad.get("sections", {})
                    desc_parts = []
                    for key in ("jobDescription", "qualifications", "additionalInformation"):
                        section = sections.get(key, {})
                        text = section.get("text")
                        if text:
                            desc_parts.append(strip_html(text) or "")
                    description = "\n\n".join(desc_parts) if desc_parts else None
            except (httpx.HTTPStatusError, httpx.TimeoutException):
                pass

        # Posted date
        posted_at = None
        released = job.get("releasedDate")
        if released:
            try:
                posted_at = datetime.fromisoformat(
                    released.replace("Z", "+00:00")
                )
            except ValueError:
                pass

        # Tags
        tags = []
        dept = job.get("department", {})
        if dept.get("label"):
            tags.append(dept["label"])
        func_data = job.get("function", {})
        if func_data.get("label"):
            tags.append(func_data["label"])

        return RawJobListing(
            external_id=self.build_external_id(company, job_id),
            title=job.get("name", ""),
            company_name=company.name,
            location=location,
            location_type=normalize_location_type(
                is_remote=is_remote, location_text=location
            ),
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency=salary_currency,
            description=description,
            url=posting_url,
            apply_url=apply_url,
            department=dept.get("label"),
            posted_at=posted_at,
            tags=tags,
        )
