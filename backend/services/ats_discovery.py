"""ATS auto-discovery — probe public ATS APIs to detect a company's career board.

Given a company name or domain, generates slug variants and probes Greenhouse,
Lever, Ashby, and SmartRecruiters APIs in parallel. Returns the first match.
"""

import asyncio
import logging
import re

import httpx

logger = logging.getLogger(__name__)

_PROBE_TIMEOUT = 10.0  # seconds per probe


def _generate_slugs(name_or_domain: str) -> list[str]:
    """Generate candidate slugs from a company name or domain.

    Examples:
        "Stripe" → ["stripe"]
        "Jane Street" → ["janestreet", "jane-street"]
        "stripe.com" → ["stripe"]
        "my-company.io" → ["my-company", "mycompany"]
    """
    # Strip common TLDs
    cleaned = re.sub(r"\.(com|io|co|org|net|ai|dev|tech|app)$", "", name_or_domain.strip().lower())
    # Remove non-alphanumeric except spaces/hyphens
    cleaned = re.sub(r"[^a-z0-9\s\-]", "", cleaned)

    slugs: list[str] = []
    # No-separator version
    no_sep = re.sub(r"[\s\-]+", "", cleaned)
    if no_sep:
        slugs.append(no_sep)
    # Hyphenated version
    hyphenated = re.sub(r"[\s]+", "-", cleaned)
    if hyphenated and hyphenated != no_sep:
        slugs.append(hyphenated)
    # Original cleaned (if different)
    if cleaned not in slugs:
        slugs.append(cleaned)

    return slugs


async def probe_greenhouse(slug: str) -> dict | None:
    """Probe Greenhouse API for a given board slug."""
    url = f"https://boards-api.greenhouse.io/v1/boards/{slug}"
    async with httpx.AsyncClient(timeout=_PROBE_TIMEOUT) as client:
        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("name"):
                    return {
                        "ats_type": "greenhouse",
                        "board_token": slug,
                        "company_name": data["name"],
                    }
        except (httpx.HTTPError, Exception):
            pass
    return None


async def probe_lever(slug: str) -> dict | None:
    """Probe Lever postings API for a given company slug."""
    url = f"https://api.lever.co/v0/postings/{slug}?limit=1"
    async with httpx.AsyncClient(timeout=_PROBE_TIMEOUT) as client:
        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list):
                    return {
                        "ats_type": "lever",
                        "board_token": slug,
                        "job_count": len(data),
                    }
        except (httpx.HTTPError, Exception):
            pass
    return None


async def probe_ashby(slug: str) -> dict | None:
    """Probe Ashby job board API for a given slug."""
    url = "https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams"
    payload = {
        "operationName": "ApiJobBoardWithTeams",
        "variables": {"organizationHostedJobsPageName": slug},
        "query": "query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) { jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) { title } }",
    }
    async with httpx.AsyncClient(timeout=_PROBE_TIMEOUT) as client:
        try:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                board = data.get("data", {}).get("jobBoard")
                if board and board.get("title"):
                    return {
                        "ats_type": "ashby",
                        "board_token": slug,
                        "company_name": board["title"],
                    }
        except (httpx.HTTPError, Exception):
            pass
    return None


async def probe_smartrecruiters(slug: str) -> dict | None:
    """Probe SmartRecruiters public API for a given company slug."""
    url = f"https://api.smartrecruiters.com/v1/companies/{slug}/postings?limit=1"
    async with httpx.AsyncClient(timeout=_PROBE_TIMEOUT) as client:
        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if "content" in data:
                    return {
                        "ats_type": "smartrecruiters",
                        "board_token": slug,
                        "job_count": data.get("totalFound", 0),
                    }
        except (httpx.HTTPError, Exception):
            pass
    return None


_PROBERS = [probe_greenhouse, probe_lever, probe_ashby, probe_smartrecruiters]


async def discover_ats(name_or_domain: str) -> dict | None:
    """Discover a company's ATS by probing public APIs with generated slug variants.

    Returns the first successful match, or None if no ATS is detected.
    """
    slugs = _generate_slugs(name_or_domain)
    logger.info("ATS discovery: probing %d slugs for '%s': %s", len(slugs), name_or_domain, slugs)

    for slug in slugs:
        # Probe all ATS types in parallel for each slug
        tasks = [prober(slug) for prober in _PROBERS]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, dict):
                logger.info("ATS discovery: found %s for '%s' (slug=%s)", result["ats_type"], name_or_domain, slug)
                return result

    logger.info("ATS discovery: no ATS found for '%s'", name_or_domain)
    return None


async def discover_ats_batch(names_or_domains: list[str]) -> list[dict]:
    """Batch ATS discovery for multiple companies.

    Returns list of results (one per input). Each result is either a match dict or
    {"name_or_domain": ..., "ats_type": None} for undetected entries.
    """
    results = []
    for name in names_or_domains:
        match = await discover_ats(name)
        if match:
            match["name_or_domain"] = name
            results.append(match)
        else:
            results.append({"name_or_domain": name, "ats_type": None})
    return results
