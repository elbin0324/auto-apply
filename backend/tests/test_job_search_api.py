"""Tests for the Active Jobs DB API client (services/job_search_api.py)."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from workers.services.job_search_api import (
    FANTASTIC_API_HOST,
    FANTASTIC_BASE_URL,
    JobSearchParams,
    _build_api_params,
    _parse_ai_experience_level,
    _parse_employment_type,
    _parse_location_type,
    _parse_posted_at,
    _parse_salary,
    parse_fantastic_result,
    search_jobs,
    search_jobs_advanced,
)


# ── parse helpers ────────────────────────────────────────────────────────────


class TestParseEmploymentType:
    def test_fulltime_variants(self) -> None:
        assert _parse_employment_type(["FULL_TIME"]) == "full_time"
        assert _parse_employment_type(["Full-time"]) == "full_time"
        assert _parse_employment_type("FULLTIME") == "full_time"

    def test_parttime(self) -> None:
        assert _parse_employment_type(["PART_TIME"]) == "part_time"
        assert _parse_employment_type("Part-time") == "part_time"

    def test_contract(self) -> None:
        assert _parse_employment_type(["CONTRACT"]) == "contract"
        assert _parse_employment_type(["CONTRACTOR"]) == "contract"
        assert _parse_employment_type(["TEMPORARY"]) == "contract"

    def test_internship(self) -> None:
        assert _parse_employment_type(["INTERN"]) == "internship"
        assert _parse_employment_type(["Internship"]) == "internship"

    def test_none_and_unknown(self) -> None:
        assert _parse_employment_type(None) is None
        assert _parse_employment_type([]) is None
        assert _parse_employment_type("") is None
        assert _parse_employment_type(["VOLUNTEER"]) is None

    def test_takes_first_from_list(self) -> None:
        assert _parse_employment_type(["FULL_TIME", "CONTRACT"]) == "full_time"


class TestParseLocationType:
    def test_telecommute(self) -> None:
        assert _parse_location_type("TELECOMMUTE", None) == "remote"
        assert _parse_location_type("telecommute", None) == "remote"

    def test_remote_derived(self) -> None:
        assert _parse_location_type(None, True) == "remote"

    def test_not_remote(self) -> None:
        assert _parse_location_type(None, False) is None
        assert _parse_location_type(None, None) is None

    def test_telecommute_takes_priority(self) -> None:
        assert _parse_location_type("TELECOMMUTE", False) == "remote"

    def test_ai_work_arrangement_remote(self) -> None:
        assert _parse_location_type(None, False, "Remote Solely") == "remote"
        assert _parse_location_type(None, False, "Remote OK") == "remote"

    def test_ai_work_arrangement_hybrid(self) -> None:
        assert _parse_location_type(None, False, "Hybrid") == "hybrid"

    def test_ai_work_arrangement_onsite(self) -> None:
        assert _parse_location_type(None, False, "On-site") == "onsite"

    def test_ai_work_arrangement_priority(self) -> None:
        # AI field takes priority over remote_derived
        assert _parse_location_type(None, True, "On-site") == "onsite"
        assert _parse_location_type(None, True, "Hybrid") == "hybrid"


class TestParseSalary:
    def test_schema_org_format(self) -> None:
        salary_raw = {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": {
                "@type": "QuantitativeValue",
                "minValue": 100700,
                "maxValue": 130500,
                "unitText": "YEAR",
            },
        }
        sal_min, sal_max, currency = _parse_salary(salary_raw)
        assert sal_min == 100700
        assert sal_max == 130500
        assert currency == "USD"

    def test_different_currency(self) -> None:
        salary_raw = {
            "@type": "MonetaryAmount",
            "currency": "GBP",
            "value": {
                "@type": "QuantitativeValue",
                "minValue": 50000,
                "maxValue": 70000,
            },
        }
        sal_min, sal_max, currency = _parse_salary(salary_raw)
        assert sal_min == 50000
        assert sal_max == 70000
        assert currency == "GBP"

    def test_none(self) -> None:
        assert _parse_salary(None) == (None, None, "USD")

    def test_empty_dict(self) -> None:
        assert _parse_salary({}) == (None, None, "USD")

    def test_no_value_key(self) -> None:
        sal_min, sal_max, currency = _parse_salary({"currency": "EUR"})
        assert sal_min is None
        assert sal_max is None
        assert currency == "EUR"


class TestParseAiExperienceLevel:
    def test_mapping(self) -> None:
        assert _parse_ai_experience_level("0-2") == "entry"
        assert _parse_ai_experience_level("2-5") == "mid"
        assert _parse_ai_experience_level("5-10") == "senior"
        assert _parse_ai_experience_level("10+") == "lead"

    def test_none_and_unknown(self) -> None:
        assert _parse_ai_experience_level(None) is None
        assert _parse_ai_experience_level("unknown") is None


class TestParsePostedAt:
    def test_iso_format(self) -> None:
        result = _parse_posted_at("2025-01-15T10:30:00Z")
        assert result == datetime(2025, 1, 15, 10, 30, tzinfo=timezone.utc)

    def test_with_offset(self) -> None:
        result = _parse_posted_at("2025-01-15T10:30:00+00:00")
        assert result is not None
        assert result.tzinfo is not None

    def test_naive_datetime(self) -> None:
        result = _parse_posted_at("2025-01-15T10:30:00")
        assert result is not None
        assert result.tzinfo == timezone.utc

    def test_none_and_invalid(self) -> None:
        assert _parse_posted_at(None) is None
        assert _parse_posted_at("not-a-date") is None


# ── JobSearchParams & _build_api_params ──────────────────────────────────────


class TestBuildApiParams:
    def test_minimal_params(self) -> None:
        params = JobSearchParams(advanced_title_filter="'Engineer'")
        api = _build_api_params(params)
        assert api["advanced_title_filter"] == "'Engineer'"
        assert api["limit"] == "100"
        assert api["offset"] == "0"
        assert api["description_type"] == "text"
        assert api["include_ai"] == "true"
        assert api["agency"] == "false"

    def test_all_filters(self) -> None:
        params = JobSearchParams(
            advanced_title_filter="'Senior Engineer' | 'Tech Lead'",
            location_filter='"San Francisco" OR "New York"',
            remote=True,
            ai_work_arrangement_filter="Remote Solely,Remote OK",
            ai_employment_type_filter="FULL_TIME",
            ai_experience_level_filter="2-5",
            ai_taxonomies_a_filter="Technology,Healthcare",
            organization_exclusion_filter="BadCorp,WorstCo",
            limit=50,
            offset=100,
        )
        api = _build_api_params(params)
        assert api["advanced_title_filter"] == "'Senior Engineer' | 'Tech Lead'"
        assert api["location_filter"] == '"San Francisco" OR "New York"'
        assert api["remote"] == "true"
        assert api["ai_work_arrangement_filter"] == "Remote Solely,Remote OK"
        assert api["ai_employment_type_filter"] == "FULL_TIME"
        assert api["ai_experience_level_filter"] == "2-5"
        assert api["ai_taxonomies_a_filter"] == "Technology,Healthcare"
        assert api["organization_exclusion_filter"] == "BadCorp,WorstCo"
        assert api["limit"] == "50"
        assert api["offset"] == "100"

    def test_remote_false_included(self) -> None:
        params = JobSearchParams(remote=False)
        api = _build_api_params(params)
        assert api["remote"] == "false"

    def test_remote_none_excluded(self) -> None:
        params = JobSearchParams(remote=None)
        api = _build_api_params(params)
        assert "remote" not in api

    def test_empty_optional_fields_excluded(self) -> None:
        params = JobSearchParams()
        api = _build_api_params(params)
        assert "advanced_title_filter" not in api
        assert "location_filter" not in api
        assert "ai_work_arrangement_filter" not in api
        assert "ai_employment_type_filter" not in api
        assert "ai_experience_level_filter" not in api


# ── parse_fantastic_result ───────────────────────────────────────────────────


def _sample_result() -> dict:
    """A realistic Active Jobs DB API result dict."""
    return {
        "id": "2041062552",
        "title": "Senior Backend Engineer",
        "url": "https://recruiting.example.com/jobs/2041062552",
        "organization": "Acme Corp",
        "organization_logo": "https://logo.example.com/acme.png",
        "organization_url": "https://acme.com",
        "locations_derived": ["San Francisco, California, United States"],
        "locations_raw": [
            {
                "@type": "Place",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "San Francisco",
                    "addressRegion": "CA",
                    "addressCountry": "US",
                },
            }
        ],
        "location_type": None,
        "remote_derived": False,
        "salary_raw": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": {
                "@type": "QuantitativeValue",
                "minValue": 150000,
                "maxValue": 200000,
                "unitText": "YEAR",
            },
        },
        "description_text": "We are looking for a senior backend engineer...",
        "employment_type": ["FULL_TIME"],
        "source_type": "ats",
        "source": "greenhouse",
        "source_domain": "boards.greenhouse.io",
        "date_posted": "2025-06-01T00:00:00",
        "date_created": "2025-06-01T12:00:00",
    }


class TestParseFantasticResult:
    def test_basic_mapping(self) -> None:
        result = parse_fantastic_result(_sample_result())

        assert result["external_id"] == "fantastic:2041062552"
        assert result["title"] == "Senior Backend Engineer"
        assert result["company"] == "Acme Corp"
        assert result["company_logo_url"] == "https://logo.example.com/acme.png"
        assert result["location"] == "San Francisco, California, United States"
        assert result["location_type"] is None  # not remote
        assert result["salary_min"] == 150000
        assert result["salary_max"] == 200000
        assert result["salary_currency"] == "USD"
        assert result["description"] == "We are looking for a senior backend engineer..."
        assert result["url"] == "https://recruiting.example.com/jobs/2041062552"
        assert result["apply_url"] == result["url"]
        assert result["source"] == "fantastic"
        assert result["category"] == "ats"
        assert result["employment_type"] == "full_time"
        assert result["experience_level"] is None  # no AI field in sample
        assert "ats" in result["tags"]
        assert "greenhouse" in result["tags"]
        assert result["is_active"] is True
        assert result["posted_at"] is not None

    def test_remote_via_location_type(self) -> None:
        data = _sample_result()
        data["location_type"] = "TELECOMMUTE"
        result = parse_fantastic_result(data)
        assert result["location_type"] == "remote"

    def test_remote_via_derived(self) -> None:
        data = _sample_result()
        data["remote_derived"] = True
        result = parse_fantastic_result(data)
        assert result["location_type"] == "remote"

    def test_remote_via_ai_work_arrangement(self) -> None:
        data = _sample_result()
        data["ai_work_arrangement"] = "Remote Solely"
        result = parse_fantastic_result(data)
        assert result["location_type"] == "remote"

    def test_hybrid_via_ai_work_arrangement(self) -> None:
        data = _sample_result()
        data["ai_work_arrangement"] = "Hybrid"
        result = parse_fantastic_result(data)
        assert result["location_type"] == "hybrid"

    def test_onsite_via_ai_work_arrangement(self) -> None:
        data = _sample_result()
        data["ai_work_arrangement"] = "On-site"
        result = parse_fantastic_result(data)
        assert result["location_type"] == "onsite"

    def test_ai_experience_level(self) -> None:
        data = _sample_result()
        data["ai_experience_level"] = "2-5"
        result = parse_fantastic_result(data)
        assert result["experience_level"] == "mid"

    def test_ai_experience_level_senior(self) -> None:
        data = _sample_result()
        data["ai_experience_level"] = "5-10"
        result = parse_fantastic_result(data)
        assert result["experience_level"] == "senior"

    def test_salary_schema_org(self) -> None:
        data = _sample_result()
        data["salary_raw"] = {
            "@type": "MonetaryAmount",
            "currency": "CAD",
            "value": {
                "@type": "QuantitativeValue",
                "minValue": 80000,
                "maxValue": 120000,
            },
        }
        result = parse_fantastic_result(data)
        assert result["salary_min"] == 80000
        assert result["salary_max"] == 120000
        assert result["salary_currency"] == "CAD"

    def test_salary_missing(self) -> None:
        data = _sample_result()
        data["salary_raw"] = None
        result = parse_fantastic_result(data)
        assert result["salary_min"] is None
        assert result["salary_max"] is None
        assert result["salary_currency"] == "USD"

    def test_multiple_locations(self) -> None:
        data = _sample_result()
        data["locations_derived"] = ["New York, NY, United States", "Remote"]
        result = parse_fantastic_result(data)
        assert result["location"] == "New York, NY, United States, Remote"

    def test_empty_locations(self) -> None:
        data = _sample_result()
        data["locations_derived"] = []
        result = parse_fantastic_result(data)
        assert result["location"] is None

    def test_employment_type_array(self) -> None:
        data = _sample_result()
        data["employment_type"] = ["PART_TIME"]
        result = parse_fantastic_result(data)
        assert result["employment_type"] == "part_time"

    def test_missing_fields_graceful(self) -> None:
        """Sparse result should not raise, just return None/empty for missing fields."""
        sparse = {"id": "sparse1", "url": "https://example.com/job/1"}
        result = parse_fantastic_result(sparse)
        assert result["external_id"] == "fantastic:sparse1"
        assert result["title"] == ""
        assert result["company"] is None
        assert result["salary_min"] is None
        assert result["location"] is None
        assert result["location_type"] is None
        assert result["experience_level"] is None
        assert result["tags"] == []
        assert result["source"] == "fantastic"

    def test_date_fallback_to_date_created(self) -> None:
        data = _sample_result()
        data.pop("date_posted")
        result = parse_fantastic_result(data)
        assert result["posted_at"] is not None


# ── search_jobs (backward-compat wrapper) ────────────────────────────────────


@pytest.mark.asyncio
async def test_search_jobs_returns_empty_when_no_api_key() -> None:
    with patch("workers.services.job_search_api.get_settings") as mock_settings:
        mock_settings.return_value.rapidapi_key = ""
        result = await search_jobs("Python Developer")
    assert result == []


@pytest.mark.asyncio
async def test_search_jobs_sends_correct_headers() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = [_sample_result()]

    with (
        patch("workers.services.job_search_api.get_settings") as mock_settings,
        patch("httpx.AsyncClient") as mock_client_cls,
    ):
        mock_settings.return_value.rapidapi_key = "test-rapid-key"
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await search_jobs("Python Developer", "United States")

    # Verify API was called with correct headers
    call_kwargs = mock_client.get.call_args
    headers = call_kwargs.kwargs.get("headers") or call_kwargs[1].get("headers")
    assert headers["x-rapidapi-host"] == FANTASTIC_API_HOST
    assert headers["x-rapidapi-key"] == "test-rapid-key"

    # Verify params use advanced_title_filter (from wrapper)
    params = call_kwargs.kwargs.get("params") or call_kwargs[1].get("params")
    assert params["advanced_title_filter"] == "'Python Developer'"
    assert params["location_filter"] == '"United States"'
    assert params["description_type"] == "text"
    assert params["include_ai"] == "true"
    assert params["agency"] == "false"

    # Verify correct endpoint (7d by default)
    call_url = call_kwargs.args[0] if call_kwargs.args else call_kwargs.kwargs.get("url")
    assert "/active-ats-7d" in call_url

    # Verify result parsed correctly
    assert len(result) == 1
    assert result[0]["source"] == "fantastic"


@pytest.mark.asyncio
async def test_search_jobs_uses_24h_endpoint() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = []

    with (
        patch("workers.services.job_search_api.get_settings") as mock_settings,
        patch("httpx.AsyncClient") as mock_client_cls,
    ):
        mock_settings.return_value.rapidapi_key = "test-key"
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        await search_jobs("Developer", recent_only=True)

    call_url = mock_client.get.call_args.args[0]
    assert "/active-ats-24h" in call_url


@pytest.mark.asyncio
async def test_search_jobs_remote_only() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = []

    with (
        patch("workers.services.job_search_api.get_settings") as mock_settings,
        patch("httpx.AsyncClient") as mock_client_cls,
    ):
        mock_settings.return_value.rapidapi_key = "test-key"
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        await search_jobs("Developer", "United States", remote_only=True)

    params = mock_client.get.call_args.kwargs.get("params")
    assert '"Remote"' in params["location_filter"]
    assert '"United States"' in params["location_filter"]
    assert params["remote"] == "true"


# ── search_jobs_advanced ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_search_jobs_advanced_with_filters() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = [_sample_result()]

    with (
        patch("workers.services.job_search_api.get_settings") as mock_settings,
        patch("httpx.AsyncClient") as mock_client_cls,
    ):
        mock_settings.return_value.rapidapi_key = "test-key"
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        params = JobSearchParams(
            advanced_title_filter="'Senior Engineer' | 'Tech Lead'",
            location_filter='"San Francisco" OR "New York"',
            ai_experience_level_filter="2-5",
            organization_exclusion_filter="BadCorp",
            ai_work_arrangement_filter="Remote Solely,Remote OK",
        )
        result = await search_jobs_advanced(params)

    call_kwargs = mock_client.get.call_args
    api_params = call_kwargs.kwargs.get("params")
    assert api_params["advanced_title_filter"] == "'Senior Engineer' | 'Tech Lead'"
    assert api_params["location_filter"] == '"San Francisco" OR "New York"'
    assert api_params["ai_experience_level_filter"] == "2-5"
    assert api_params["organization_exclusion_filter"] == "BadCorp"
    assert api_params["ai_work_arrangement_filter"] == "Remote Solely,Remote OK"
    assert len(result) == 1


@pytest.mark.asyncio
async def test_search_jobs_advanced_returns_empty_no_key() -> None:
    with patch("workers.services.job_search_api.get_settings") as mock_settings:
        mock_settings.return_value.rapidapi_key = ""
        result = await search_jobs_advanced(JobSearchParams())
    assert result == []


@pytest.mark.asyncio
async def test_search_jobs_handles_http_error() -> None:
    mock_request = MagicMock(spec=httpx.Request)
    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_response.text = "Rate limit exceeded"
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
        "429", request=mock_request, response=mock_response
    )

    with (
        patch("workers.services.job_search_api.get_settings") as mock_settings,
        patch("httpx.AsyncClient") as mock_client_cls,
    ):
        mock_settings.return_value.rapidapi_key = "test-key"
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await search_jobs("Developer")

    assert result == []


@pytest.mark.asyncio
async def test_search_jobs_handles_timeout() -> None:
    with (
        patch("workers.services.job_search_api.get_settings") as mock_settings,
        patch("httpx.AsyncClient") as mock_client_cls,
    ):
        mock_settings.return_value.rapidapi_key = "test-key"
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.TimeoutException("timed out")
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await search_jobs("Developer")

    assert result == []
