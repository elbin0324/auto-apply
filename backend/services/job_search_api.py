"""JSearch API client — fetches job listings from RapidAPI's JSearch endpoint.

Queries Google for Jobs, LinkedIn, Indeed, Glassdoor, etc. via a single API.
"""

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from config import get_settings

logger = logging.getLogger(__name__)

JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com/search"


def _parse_employment_type(raw: str | None) -> str | None:
    """Normalize JSearch employment type to our internal format."""
    if not raw:
        return None
    mapping = {
        "FULLTIME": "full_time",
        "PARTTIME": "part_time",
        "CONTRACTOR": "contract",
        "INTERN": "internship",
        "TEMPORARY": "contract",
    }
    return mapping.get(raw.upper(), None)


def _parse_location_type(is_remote: bool | None, city: str | None) -> str | None:
    """Determine location type from JSearch fields."""
    if is_remote:
        return "remote"
    if city:
        return "onsite"
    return None


def _parse_posted_at(raw: str | None) -> datetime | None:
    """Parse JSearch datetime string to timezone-aware datetime."""
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


def _build_location_string(city: str | None, state: str | None, country: str | None) -> str | None:
    """Build a human-readable location string from parts."""
    parts = [p for p in (city, state, country) if p]
    return ", ".join(parts) if parts else None


def parse_jsearch_result(result: dict[str, Any]) -> dict[str, Any]:
    """Parse a single JSearch API result into a Job-compatible dict.

    Returns a dict ready for DB upsert via the Job model.
    """
    job_id = result.get("job_id", "")

    # Pick the best apply URL
    apply_link = result.get("job_apply_link")
    apply_options = result.get("apply_options") or []
    # Prefer a direct application link if available
    for opt in apply_options:
        if opt.get("is_direct"):
            apply_link = opt.get("apply_link", apply_link)
            break

    # Salary
    salary_min = result.get("job_min_salary")
    salary_max = result.get("job_max_salary")
    salary_currency = result.get("job_salary_currency") or "USD"
    salary_period = result.get("job_salary_period")

    # Normalize hourly rates to annual estimates
    if salary_period and salary_period.lower() == "hour":
        if salary_min is not None:
            salary_min = salary_min * 2080  # 40h/week * 52 weeks
        if salary_max is not None:
            salary_max = salary_max * 2080
    elif salary_period and salary_period.lower() == "month":
        if salary_min is not None:
            salary_min = salary_min * 12
        if salary_max is not None:
            salary_max = salary_max * 12

    # Build tags from highlights
    tags = []
    highlights = result.get("job_highlights") or {}
    if isinstance(highlights, dict):
        for key in ("Qualifications", "Responsibilities", "Benefits"):
            items = highlights.get(key) or []
            if items and isinstance(items, list):
                tags.extend(items[:3])  # Keep tags manageable

    return {
        "external_id": f"jsearch:{job_id}",
        "title": result.get("job_title") or "",
        "company": result.get("employer_name"),
        "company_logo_url": result.get("employer_logo"),
        "location": _build_location_string(
            result.get("job_city"),
            result.get("job_state"),
            result.get("job_country"),
        ),
        "location_type": _parse_location_type(
            result.get("job_is_remote"),
            result.get("job_city"),
        ),
        "salary_min": salary_min,
        "salary_max": salary_max,
        "salary_currency": salary_currency,
        "description": result.get("job_description"),
        "url": result.get("job_google_link") or apply_link or "",
        "apply_url": apply_link,
        "source": "jsearch",
        "category": result.get("job_naics_name"),
        "employment_type": _parse_employment_type(result.get("job_employment_type")),
        "tags": tags if tags else [],
        "is_active": True,
        "posted_at": _parse_posted_at(result.get("job_posted_at_datetime_utc")),
    }


async def search_jobs(
    query: str,
    location: str | None = None,
    *,
    remote_only: bool = False,
    employment_types: list[str] | None = None,
    date_posted: str = "week",  # all, today, 3days, week, month
    num_pages: int = 1,
) -> list[dict[str, Any]]:
    """Search JSearch API and return parsed job dicts ready for DB upsert.

    Args:
        query: Job title or keyword (e.g. "Senior Backend Engineer")
        location: Location filter (e.g. "Toronto, Canada")
        remote_only: Only return remote jobs
        employment_types: Filter by type (FULLTIME, PARTTIME, CONTRACTOR, INTERN)
        date_posted: Recency filter
        num_pages: Number of result pages to fetch

    Returns:
        List of dicts compatible with Job model columns.
    """
    settings = get_settings()
    if not settings.jsearch_api_key:
        logger.warning("JSEARCH_API_KEY not configured, skipping search")
        return []

    headers = {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": settings.jsearch_api_key,
    }

    params: dict[str, Any] = {
        "query": query,
        "num_pages": str(num_pages),
        "date_posted": date_posted,
    }

    if location:
        # JSearch accepts location in the query itself for best results
        params["query"] = f"{query} in {location}"

    if remote_only:
        params["remote_jobs_only"] = "true"

    if employment_types:
        params["employment_types"] = ",".join(employment_types)

    all_jobs: list[dict[str, Any]] = []

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                JSEARCH_BASE_URL,
                headers=headers,
                params=params,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

            results = data.get("data") or []
            for result in results:
                try:
                    parsed = parse_jsearch_result(result)
                    if parsed.get("url") or parsed.get("apply_url"):
                        all_jobs.append(parsed)
                except Exception:
                    logger.warning("Failed to parse JSearch result: %s", result.get("job_id"))

            logger.info(
                "JSearch query=%r returned %d results, parsed %d jobs",
                params["query"],
                len(results),
                len(all_jobs),
            )
        except httpx.HTTPStatusError as e:
            logger.error("JSearch API error %d: %s", e.response.status_code, e.response.text[:200])
        except httpx.TimeoutException:
            logger.error("JSearch API timed out for query=%r", params["query"])

    return all_jobs
