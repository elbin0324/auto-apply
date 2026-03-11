"""Active Jobs DB API client — fetches job listings via RapidAPI.

Queries ATS and career site data from 175k+ sources. Uses the Active Jobs DB
which provides structured job data with Schema.org fields (salary, location, etc.)
and optional AI-enriched fields (experience level, work arrangement, taxonomy).

Two endpoints available:
  /active-ats-7d  — jobs posted in the last 7 days (login catch-up)
  /active-ats-24h — jobs posted in the last 24 hours (daily cron)
"""

import json
import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx

from config import get_settings

logger = logging.getLogger(__name__)

FANTASTIC_API_HOST = "active-jobs-db.p.rapidapi.com"
FANTASTIC_BASE_URL = f"https://{FANTASTIC_API_HOST}"

# ── Mapping constants ────────────────────────────────────────────────────────

EXPERIENCE_LEVEL_MAP = {
    "entry": "0-2",
    "mid": "2-5",
    "senior": "5-10",
    "lead": "10+",
    "executive": "10+",
}

AI_EXP_TO_INTERNAL = {
    "0-2": "entry",
    "2-5": "mid",
    "5-10": "senior",
    "10+": "lead",
}

WORK_ARRANGEMENT_MAP = {
    "remote": "Remote Solely,Remote OK",
    "hybrid": "Hybrid",
    "onsite": "On-site",
}

EMPLOYMENT_TYPE_MAP = {
    "full_time": "FULL_TIME",
    "part_time": "PART_TIME",
    "contract": "CONTRACTOR",
    "internship": "INTERN",
}

# ── Title query builder ──────────────────────────────────────────────────────

# Words stripped from titles before building the tsquery — these are seniority
# filler words that rarely appear in actual job titles and hurt AND matching.
_TITLE_FILLER_WORDS = frozenset({
    "senior", "junior", "lead", "staff", "principal", "associate",
    "sr", "jr", "i", "ii", "iii", "iv", "v", "level",
})


def build_advanced_title_query(titles: list[str]) -> str:
    """Combine multiple user titles into a single ``advanced_title_filter`` query.

    Each title is turned into an AND group of prefix-wildcarded words (``word:*``),
    and all titles are OR'd together with ``|``.

    Seniority filler words are stripped so "Senior Full Stack React Developer"
    becomes ``(full:* & stack:* & react:* & develop:*)``.

    Example::

        ["Senior Full Stack React Developer", "Frontend Engineer"]
        → "(full:* & stack:* & react:* & develop:*) | (frontend:* & engineer:*)"
    """
    groups: list[str] = []
    for title in titles:
        # Split on non-alphanumeric, lowercase
        words = re.findall(r"[a-zA-Z0-9]+", title.lower())
        # Strip filler words
        words = [w for w in words if w not in _TITLE_FILLER_WORDS]
        if not words:
            # Fallback: use all original words if everything was stripped
            words = re.findall(r"[a-zA-Z0-9]+", title.lower())
        if not words:
            continue
        # Each word becomes a prefix match
        parts = [f"{w}:*" for w in words]
        groups.append(f"({' & '.join(parts)})")
    return " | ".join(groups)


# ── Industry taxonomy normalization ──────────────────────────────────────────

AI_TAXONOMY_VALUES = [
    "Technology", "Healthcare", "Management & Leadership",
    "Finance & Accounting", "Human Resources", "Sales", "Marketing",
    "Customer Service & Support", "Education", "Legal", "Engineering",
    "Science & Research", "Trades", "Construction", "Manufacturing",
    "Logistics", "Creative & Media", "Hospitality",
    "Environmental & Sustainability", "Retail", "Data & Analytics",
    "Software", "Energy", "Agriculture", "Social Services",
    "Administrative", "Government & Public Sector", "Art & Design",
    "Food & Beverage", "Transportation", "Consulting",
    "Sports & Recreation", "Security & Safety",
]

# Common aliases → canonical taxonomy name
TAXONOMY_ALIASES: dict[str, str] = {
    "tech": "Technology",
    "it": "Technology",
    "information technology": "Technology",
    "health": "Healthcare",
    "medical": "Healthcare",
    "finance": "Finance & Accounting",
    "accounting": "Finance & Accounting",
    "financial": "Finance & Accounting",
    "hr": "Human Resources",
    "customer service": "Customer Service & Support",
    "support": "Customer Service & Support",
    "science": "Science & Research",
    "research": "Science & Research",
    "creative": "Creative & Media",
    "media": "Creative & Media",
    "environment": "Environmental & Sustainability",
    "sustainability": "Environmental & Sustainability",
    "data": "Data & Analytics",
    "analytics": "Data & Analytics",
    "government": "Government & Public Sector",
    "public sector": "Government & Public Sector",
    "art": "Art & Design",
    "design": "Art & Design",
    "food": "Food & Beverage",
    "beverage": "Food & Beverage",
    "sports": "Sports & Recreation",
    "recreation": "Sports & Recreation",
    "security": "Security & Safety",
    "safety": "Security & Safety",
    "management": "Management & Leadership",
    "leadership": "Management & Leadership",
}

# Lowered taxonomy values for fuzzy matching
_TAXONOMY_LOWER = {v.lower(): v for v in AI_TAXONOMY_VALUES}


def normalize_taxonomy(value: str) -> str | None:
    """Map a user-entered industry string to the closest API taxonomy value.

    Checks exact match, alias, then substring containment. Returns None if
    no match is found.
    """
    lowered = value.strip().lower()
    if not lowered:
        return None

    # Exact match (case-insensitive)
    if lowered in _TAXONOMY_LOWER:
        return _TAXONOMY_LOWER[lowered]

    # Alias match
    if lowered in TAXONOMY_ALIASES:
        return TAXONOMY_ALIASES[lowered]

    # Substring containment (user string inside taxonomy)
    for tax_lower, tax_canonical in _TAXONOMY_LOWER.items():
        if lowered in tax_lower:
            return tax_canonical

    # Reverse containment (taxonomy inside user string)
    for tax_lower, tax_canonical in _TAXONOMY_LOWER.items():
        if tax_lower in lowered:
            return tax_canonical

    return None


def normalize_taxonomies(values: list[str]) -> list[str]:
    """Normalize a list of user-entered industries to API taxonomy values.

    Deduplicates and preserves order. Unrecognized values are dropped.
    """
    seen: set[str] = set()
    result: list[str] = []
    for v in values:
        canonical = normalize_taxonomy(v)
        if canonical and canonical not in seen:
            seen.add(canonical)
            result.append(canonical)
    return result


# ── Search params ────────────────────────────────────────────────────────────


@dataclass
class JobSearchParams:
    """Structured parameters for the Active Jobs DB API.

    Use `search_jobs_advanced()` to execute a search with these params.
    """

    advanced_title_filter: str | None = None
    title_filter: str | None = None
    location_filter: str | None = None
    remote: bool | None = None
    ai_work_arrangement_filter: str | None = None
    ai_employment_type_filter: str | None = None
    ai_experience_level_filter: str | None = None
    ai_taxonomies_a_filter: str | None = None
    organization_exclusion_filter: str | None = None
    agency: bool = False
    include_ai: bool = True
    description_type: str = "text"
    limit: int = 100
    offset: int = 0


def _build_api_params(params: JobSearchParams) -> dict[str, str]:
    """Convert JobSearchParams to the dict of query string params for the API."""
    api_params: dict[str, str] = {
        "limit": str(params.limit),
        "offset": str(params.offset),
        "description_type": params.description_type,
    }

    if params.advanced_title_filter:
        api_params["advanced_title_filter"] = params.advanced_title_filter
    elif params.title_filter:
        api_params["title_filter"] = params.title_filter
    if params.location_filter:
        api_params["location_filter"] = params.location_filter
    if params.remote is True:
        api_params["remote"] = "true"
    elif params.remote is False:
        api_params["remote"] = "false"
    if params.ai_work_arrangement_filter:
        api_params["ai_work_arrangement_filter"] = params.ai_work_arrangement_filter
    if params.ai_employment_type_filter:
        api_params["ai_employment_type_filter"] = params.ai_employment_type_filter
    if params.ai_experience_level_filter:
        api_params["ai_experience_level_filter"] = params.ai_experience_level_filter
    if params.ai_taxonomies_a_filter:
        api_params["ai_taxonomies_a_filter"] = params.ai_taxonomies_a_filter
    if params.organization_exclusion_filter:
        api_params["organization_exclusion_filter"] = params.organization_exclusion_filter
    if params.agency is False:
        api_params["agency"] = "false"
    if params.include_ai:
        api_params["include_ai"] = "true"

    return api_params


# ── Parse helpers ────────────────────────────────────────────────────────────


def _parse_employment_type(raw: list | str | None) -> str | None:
    """Normalize employment type to our internal format.

    Active Jobs DB returns employment_type as an array like ["FULL_TIME"]
    or sometimes human-readable ["Full-time"].
    """
    if not raw:
        return None
    if isinstance(raw, list):
        if not raw:
            return None
        raw = raw[0]
    normalized = raw.upper().replace("-", "").replace(" ", "").replace("_", "")
    mapping = {
        "FULLTIME": "full_time",
        "PARTTIME": "part_time",
        "CONTRACT": "contract",
        "CONTRACTOR": "contract",
        "TEMPORARY": "contract",
        "INTERN": "internship",
        "INTERNSHIP": "internship",
    }
    return mapping.get(normalized, None)


def _parse_location_type(
    location_type: str | None,
    remote_derived: bool | None,
    ai_work_arrangement: str | None = None,
) -> str | None:
    """Determine location type from Active Jobs DB fields.

    Priority: ai_work_arrangement > location_type > remote_derived.
    """
    if ai_work_arrangement:
        wa_lower = ai_work_arrangement.lower()
        if "remote" in wa_lower:
            return "remote"
        if "hybrid" in wa_lower:
            return "hybrid"
        if "on-site" in wa_lower or "onsite" in wa_lower:
            return "onsite"
    if location_type and "telecommute" in location_type.lower():
        return "remote"
    if remote_derived is True:
        return "remote"
    return None


def _parse_salary(salary_raw: dict | None) -> tuple[float | None, float | None, str]:
    """Extract salary from Schema.org MonetaryAmount format.

    Example:
        {"@type": "MonetaryAmount", "currency": "USD",
         "value": {"@type": "QuantitativeValue",
                   "minValue": 100700, "maxValue": 130500, "unitText": "YEAR"}}
    """
    if not salary_raw or not isinstance(salary_raw, dict):
        return None, None, "USD"

    currency = salary_raw.get("currency") or "USD"
    value = salary_raw.get("value")
    if not isinstance(value, dict):
        return None, None, currency

    salary_min = _to_numeric(value.get("minValue"))
    salary_max = _to_numeric(value.get("maxValue"))
    return salary_min, salary_max, currency


def _parse_posted_at(raw: str | None) -> datetime | None:
    """Parse datetime string to timezone-aware datetime."""
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


def _parse_ai_experience_level(raw: str | None) -> str | None:
    """Convert AI experience level (e.g. '2-5') to internal format ('mid')."""
    if not raw:
        return None
    return AI_EXP_TO_INTERNAL.get(raw)


def _to_numeric(value: Any) -> float | None:
    """Coerce a value to float, returning None for empty/invalid inputs."""
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _to_str_or_none(value: Any) -> str | None:
    """Return None for empty strings, otherwise str."""
    if value is None or value == "":
        return None
    return str(value)


# ── Result parser ────────────────────────────────────────────────────────────


def parse_fantastic_result(result: dict[str, Any]) -> dict[str, Any]:
    """Parse a single Active Jobs DB result into a Job-compatible dict.

    Returns a dict ready for DB upsert via the Job model.
    """
    job_id = result.get("id") or ""

    # URL — the job posting URL
    job_url = result.get("url") or ""

    # Salary — Schema.org MonetaryAmount format, with AI fallback
    salary_min, salary_max, salary_currency = _parse_salary(result.get("salary_raw"))

    # AI salary fallback when salary_raw is empty
    if salary_min is None and salary_max is None:
        ai_sal_min = _to_numeric(result.get("ai_salary_minvalue"))
        ai_sal_max = _to_numeric(result.get("ai_salary_maxvalue"))
        ai_currency = _to_str_or_none(result.get("ai_salary_currency"))
        if ai_sal_min is not None or ai_sal_max is not None:
            salary_min = ai_sal_min
            salary_max = ai_sal_max
            if ai_currency:
                salary_currency = ai_currency

    # Organization — plain string in Active Jobs DB
    company_name = result.get("organization")
    company_logo = result.get("organization_logo")

    # Location — use locations_derived (pre-formatted array like ["City, State, Country"])
    locations_derived = result.get("locations_derived") or []
    if isinstance(locations_derived, list) and locations_derived:
        location_str = ", ".join(str(loc) for loc in locations_derived)
    else:
        location_str = None

    # Remote / location type — AI field takes priority
    location_type = _parse_location_type(
        result.get("location_type"),
        result.get("remote_derived"),
        result.get("ai_work_arrangement"),
    )

    # Description — prefer plain text
    description = result.get("description_text") or result.get("description") or ""

    # Employment type — array like ["FULL_TIME"]
    employment_type = _parse_employment_type(result.get("employment_type"))

    # Experience level — from AI enrichment
    experience_level = _parse_ai_experience_level(result.get("ai_experience_level"))

    # Tags — build from source info
    tags: list[str] = []
    source_type = result.get("source_type")
    if source_type:
        tags.append(source_type)
    source = result.get("source")
    if source:
        tags.append(source)

    # Category — not directly available, use source_type
    category = result.get("source_type")

    # Posted date
    posted_at = _parse_posted_at(
        result.get("date_posted") or result.get("date_created")
    )

    # Expiry date — map date_validthrough to expires_at
    expires_at = _parse_posted_at(result.get("date_validthrough"))

    # Country and city — flat address fields from API
    country = _to_str_or_none(result.get("addressCountry"))
    city = _to_str_or_none(result.get("addressLocality"))

    # Build ai_enrichment JSONB
    ai_sal_data = None
    ai_sal_currency = _to_str_or_none(result.get("ai_salary_currency"))
    ai_sal_min_val = _to_numeric(result.get("ai_salary_minvalue"))
    ai_sal_max_val = _to_numeric(result.get("ai_salary_maxvalue"))
    ai_sal_unit = _to_str_or_none(result.get("ai_salary_unittext"))
    if ai_sal_currency or ai_sal_min_val is not None or ai_sal_max_val is not None:
        ai_sal_data = {
            "currency": ai_sal_currency,
            "min_value": ai_sal_min_val,
            "max_value": ai_sal_max_val,
            "unit_text": ai_sal_unit,
        }

    ai_enrichment: dict[str, Any] = {
        "skills": result.get("ai_skills") or [],
        "core_responsibilities": result.get("ai_core_responsibilities"),
        "requirements_summary": result.get("ai_requirements_summary"),
        "benefits": result.get("ai_benefits"),
        "keywords": result.get("ai_keywords") or [],
        "taxonomies": result.get("ai_taxonomies_a") or [],
        "education_level": result.get("ai_education_level") or [],
        "visa_sponsorship": result.get("ai_visa_sponsorship"),
        "working_hours": result.get("ai_working_hours"),
        "job_language": result.get("ai_job_language"),
        "hiring_manager_name": result.get("ai_hiring_manager_name"),
        "hiring_manager_email": result.get("ai_hiring_manager_email_address"),
        "work_arrangement_office_days": result.get("ai_work_arrangement_office_days"),
        "remote_location": (
            result.get("ai_remote_location") or result.get("ai_remote_location_derived")
        ),
        "salary": ai_sal_data,
    }

    # Only store ai_enrichment if it has any meaningful data
    has_ai_data = any([
        ai_enrichment["skills"],
        ai_enrichment["core_responsibilities"],
        ai_enrichment["requirements_summary"],
        ai_enrichment["benefits"],
        ai_enrichment["keywords"],
        ai_enrichment["taxonomies"],
        ai_enrichment["education_level"],
        ai_enrichment["visa_sponsorship"] is not None,
        ai_enrichment["working_hours"] is not None,
        ai_enrichment["salary"] is not None,
    ])
    ai_enrichment_value = ai_enrichment if has_ai_data else None

    return {
        "external_id": f"fantastic:{job_id}",
        "title": result.get("title") or "",
        "company": company_name,
        "company_logo_url": company_logo,
        "location": location_str,
        "location_type": location_type,
        "salary_min": salary_min,
        "salary_max": salary_max,
        "salary_currency": salary_currency,
        "description": description,
        "url": job_url,
        "apply_url": job_url,
        "source": "fantastic",
        "category": category,
        "employment_type": employment_type,
        "experience_level": experience_level,
        "tags": tags if tags else [],
        "ats_platform": result.get("source"),  # "greenhouse", "lever", etc.
        "is_active": True,
        "posted_at": posted_at,
        "expires_at": expires_at,
        "source_domain": _to_str_or_none(result.get("source_domain")),
        "organization_url": _to_str_or_none(result.get("organization_url")),
        "domain_derived": _to_str_or_none(result.get("domain_derived")),
        "country": country,
        "city": city,
        "ai_enrichment": ai_enrichment_value,
    }


# ── Search functions ─────────────────────────────────────────────────────────


async def search_jobs_advanced(
    params: JobSearchParams,
    *,
    recent_only: bool = False,
) -> list[dict[str, Any]]:
    """Search Active Jobs DB with full filter support.

    Args:
        params: Structured search parameters.
        recent_only: If True, use 24h endpoint instead of 7d.

    Returns:
        List of dicts compatible with Job model columns.
    """
    settings = get_settings()
    if not settings.rapidapi_key:
        logger.warning("RAPIDAPI_KEY not configured, skipping search")
        return []

    endpoint = "/active-ats-24h" if recent_only else "/active-ats-7d"
    url = f"{FANTASTIC_BASE_URL}{endpoint}"

    headers = {
        "x-rapidapi-host": FANTASTIC_API_HOST,
        "x-rapidapi-key": settings.rapidapi_key,
    }

    api_params = _build_api_params(params)
    all_jobs: list[dict[str, Any]] = []

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                url,
                headers=headers,
                params=api_params,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

            # Response is a bare JSON array
            results = data if isinstance(data, list) else []

            # Log raw sample at DEBUG for field name discovery
            if results:
                logger.debug(
                    "Active Jobs DB raw sample: %s",
                    json.dumps(results[0], default=str)[:2000],
                )

            for result in results:
                try:
                    parsed = parse_fantastic_result(result)
                    if parsed.get("url"):
                        all_jobs.append(parsed)
                except Exception:
                    logger.warning(
                        "Failed to parse Active Jobs DB result: %s",
                        result.get("id"),
                    )

            filter_desc = params.title_filter or params.advanced_title_filter or "(no title filter)"
            logger.info(
                "Active Jobs DB %s filter=%r returned %d results, parsed %d jobs",
                endpoint,
                filter_desc,
                len(results),
                len(all_jobs),
            )
        except httpx.HTTPStatusError as e:
            logger.error(
                "Active Jobs DB API error %d: %s",
                e.response.status_code,
                e.response.text[:200],
            )
        except httpx.TimeoutException:
            logger.error(
                "Active Jobs DB API timed out for %s",
                params.title_filter or params.advanced_title_filter,
            )

    return all_jobs


async def search_jobs(
    query: str,
    location: str | None = None,
    *,
    remote_only: bool = False,
    limit: int = 100,
    recent_only: bool = False,
) -> list[dict[str, Any]]:
    """Backward-compatible wrapper around search_jobs_advanced().

    Builds a simple JobSearchParams from positional args.
    """
    params = JobSearchParams(
        title_filter=f'"{query}"',
        limit=limit,
        include_ai=True,
        agency=False,
    )

    location_parts: list[str] = []
    if location:
        location_parts.append(location)
    if remote_only:
        params.remote = True
        location_parts.append("Remote")
    if location_parts:
        params.location_filter = " OR ".join(location_parts)

    return await search_jobs_advanced(params, recent_only=recent_only)
