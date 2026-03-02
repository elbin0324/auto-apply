"""Tests for ATS crawlers and job discovery.

Tests cover:
- Base crawler utilities (strip_html, normalize_location_type, build_external_id)
- Greenhouse crawler parsing
- Lever crawler parsing
- Ashby crawler parsing
- SmartRecruiters crawler parsing
- Workday crawler parsing
- ATS URL detection
"""

import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from services.crawlers.base import (
    RawJobListing,
    normalize_location_type,
    strip_html,
)
from services.crawlers.greenhouse import GreenhouseCrawler
from services.crawlers.lever import LeverCrawler
from services.crawlers.ashby import AshbyCrawler
from services.crawlers.smartrecruiters import SmartRecruitersCrawler
from services.crawlers.workday import WorkdayCrawler
from routers.companies import detect_ats_from_url


# ── Fixtures ─────────────────────────────────────────────────────────────


def _make_company(**overrides) -> SimpleNamespace:
    defaults = {
        "id": uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        "name": "Test Corp",
        "slug": "test-corp",
        "ats_type": "greenhouse",
        "board_token": "testcorp",
        "is_active": True,
        "job_count": 0,
        "ats_base_url": None,
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


# ── Base utilities ───────────────────────────────────────────────────────


class TestStripHtml:
    def test_strips_tags(self):
        assert strip_html("<p>Hello <b>world</b></p>") == "Hello world"

    def test_collapses_whitespace(self):
        assert strip_html("<p>Hello</p>  <p>world</p>") == "Hello world"

    def test_returns_none_for_none(self):
        assert strip_html(None) is None

    def test_returns_none_for_empty(self):
        assert strip_html("") is None


class TestNormalizeLocationType:
    def test_is_remote_flag(self):
        assert normalize_location_type(is_remote=True) == "remote"

    def test_workplace_type_remote(self):
        assert normalize_location_type(workplace_type="Remote") == "remote"

    def test_workplace_type_hybrid(self):
        assert normalize_location_type(workplace_type="Hybrid") == "hybrid"

    def test_workplace_type_onsite(self):
        assert normalize_location_type(workplace_type="OnSite") == "onsite"

    def test_location_text_remote(self):
        assert normalize_location_type(location_text="Remote - US") == "remote"

    def test_returns_none_for_unknown(self):
        assert normalize_location_type(location_text="Toronto") is None

    def test_none_inputs(self):
        assert normalize_location_type() is None


class TestBuildExternalId:
    def test_format(self):
        company = _make_company(ats_type="greenhouse", board_token="stripe")
        crawler = GreenhouseCrawler()
        assert crawler.build_external_id(company, "12345") == "greenhouse:stripe:12345"


# ── Greenhouse Crawler ──────────────────────────────────────────────────


GREENHOUSE_RESPONSE = {
    "jobs": [
        {
            "id": 12345,
            "title": "Software Engineer",
            "location": {"name": "San Francisco, CA"},
            "absolute_url": "https://boards.greenhouse.io/testcorp/jobs/12345",
            "updated_at": "2026-01-15T10:00:00-05:00",
            "content": "<p>Build amazing things with <b>Python</b>.</p>",
            "departments": [{"id": 1, "name": "Engineering"}],
        },
        {
            "id": 67890,
            "title": "Remote Product Manager",
            "location": {"name": "Remote"},
            "absolute_url": "https://boards.greenhouse.io/testcorp/jobs/67890",
            "updated_at": "2026-02-01T08:00:00Z",
            "content": "<div>Lead product strategy.</div>",
            "departments": [{"id": 2, "name": "Product"}],
        },
    ],
    "meta": {"total": 2},
}


class TestGreenhouseCrawler:
    @pytest.mark.asyncio
    async def test_fetch_jobs_parses_response(self):
        company = _make_company(ats_type="greenhouse", board_token="testcorp")
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = GREENHOUSE_RESPONSE
        mock_response.raise_for_status = MagicMock()

        with patch("services.crawlers.greenhouse.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            crawler = GreenhouseCrawler()
            jobs = await crawler.fetch_jobs(company)

        assert len(jobs) == 2

        job1 = jobs[0]
        assert job1.external_id == "greenhouse:testcorp:12345"
        assert job1.title == "Software Engineer"
        assert job1.location == "San Francisco, CA"
        assert job1.apply_url == "https://boards.greenhouse.io/testcorp/jobs/12345#app"
        assert "Python" in (job1.description or "")
        assert "Engineering" in job1.tags

        job2 = jobs[1]
        assert job2.location_type == "remote"
        assert "Product" in job2.tags

    @pytest.mark.asyncio
    async def test_fetch_jobs_handles_http_error(self):
        company = _make_company()
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.text = "Not found"
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Not found", request=MagicMock(), response=mock_response
        )

        with patch("services.crawlers.greenhouse.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            crawler = GreenhouseCrawler()
            jobs = await crawler.fetch_jobs(company)

        assert jobs == []

    @pytest.mark.asyncio
    async def test_fetch_jobs_handles_timeout(self):
        company = _make_company()

        with patch("services.crawlers.greenhouse.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.get.side_effect = httpx.TimeoutException("timeout")
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            crawler = GreenhouseCrawler()
            jobs = await crawler.fetch_jobs(company)

        assert jobs == []


# ── Lever Crawler ────────────────────────────────────────────────────────


LEVER_RESPONSE = [
    {
        "id": "abc-123",
        "text": "Backend Engineer",
        "categories": {
            "location": "Toronto, ON",
            "commitment": "Full-time",
            "team": "Platform",
            "department": "Engineering",
            "allLocations": ["Toronto, ON", "Remote"],
        },
        "hostedUrl": "https://jobs.lever.co/testcorp/abc-123",
        "applyUrl": "https://jobs.lever.co/testcorp/abc-123/apply",
        "workplaceType": "hybrid",
        "createdAt": 1706745600000,  # 2024-02-01
        "salaryRange": {"min": 120000, "max": 160000, "currency": "CAD"},
        "description": "<div>Build backend services.</div>",
        "descriptionPlain": "Build backend services.",
    }
]


class TestLeverCrawler:
    @pytest.mark.asyncio
    async def test_fetch_jobs_parses_response(self):
        company = _make_company(ats_type="lever", board_token="testcorp")
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = LEVER_RESPONSE
        mock_response.raise_for_status = MagicMock()

        with patch("services.crawlers.lever.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            crawler = LeverCrawler()
            jobs = await crawler.fetch_jobs(company)

        assert len(jobs) == 1
        job = jobs[0]
        assert job.external_id == "lever:testcorp:abc-123"
        assert job.title == "Backend Engineer"
        assert job.location == "Toronto, ON"
        assert job.location_type == "hybrid"
        assert job.salary_min == 120000
        assert job.salary_max == 160000
        assert job.apply_url == "https://jobs.lever.co/testcorp/abc-123/apply"


# ── Ashby Crawler ────────────────────────────────────────────────────────


ASHBY_RESPONSE = {
    "jobs": [
        {
            "title": "Frontend Engineer",
            "location": "New York, NY",
            "isRemote": False,
            "isListed": True,
            "workplaceType": "OnSite",
            "employmentType": "FullTime",
            "department": "Engineering",
            "team": "Web Platform",
            "descriptionPlain": "Build great UIs.",
            "publishedAt": "2026-01-20T12:00:00.000Z",
            "jobUrl": "https://jobs.ashbyhq.com/testcorp/frontend-engineer",
            "applyUrl": "https://jobs.ashbyhq.com/testcorp/application?jobId=job-uuid-123",
            "compensation": {
                "compensationTierSummary": "$100K - $140K",
                "compensationTiers": [{"min": 100000, "max": 140000}],
            },
        },
        {
            "title": "Unlisted Role",
            "isListed": False,
            "jobUrl": "https://jobs.ashbyhq.com/testcorp/unlisted",
            "applyUrl": "https://jobs.ashbyhq.com/testcorp/application?jobId=unlisted",
        },
    ]
}


class TestAshbyCrawler:
    @pytest.mark.asyncio
    async def test_fetch_jobs_parses_response(self):
        company = _make_company(ats_type="ashby", board_token="testcorp")
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = ASHBY_RESPONSE
        mock_response.raise_for_status = MagicMock()

        with patch("services.crawlers.ashby.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            crawler = AshbyCrawler()
            jobs = await crawler.fetch_jobs(company)

        # Should skip the unlisted job
        assert len(jobs) == 1
        job = jobs[0]
        assert job.title == "Frontend Engineer"
        assert job.location_type == "onsite"
        assert job.salary_min == 100000
        assert job.salary_max == 140000
        assert "job-uuid-123" in job.external_id


# ── Workday Crawler ──────────────────────────────────────────────────────


WORKDAY_RESPONSE = {
    "total": 1,
    "jobPostings": [
        {
            "title": "Data Scientist",
            "externalPath": "/en-US/CorporateCareers/job/data-scientist/JR12345",
            "locationsText": "Chicago, IL",
            "bulletFields": ["Full time", "Regular"],
            "postedOn": "2026-02-10T00:00:00Z",
        }
    ],
}


class TestWorkdayCrawler:
    @pytest.mark.asyncio
    async def test_fetch_jobs_parses_response(self):
        company = _make_company(
            ats_type="workday",
            board_token="CorporateCareers",
            ats_base_url="acme.wd5.myworkdayjobs.com/wday/cxs/acme/CorporateCareers",
        )
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = WORKDAY_RESPONSE
        mock_response.raise_for_status = MagicMock()

        with patch("services.crawlers.workday.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            crawler = WorkdayCrawler()
            jobs = await crawler.fetch_jobs(company)

        assert len(jobs) == 1
        job = jobs[0]
        assert job.title == "Data Scientist"
        assert job.location == "Chicago, IL"
        assert "acme.wd5.myworkdayjobs.com" in job.url
        assert job.apply_url.endswith("/apply")

    @pytest.mark.asyncio
    async def test_requires_ats_base_url(self):
        company = _make_company(ats_type="workday", ats_base_url=None)
        object.__setattr__(company, "ats_base_url", None)
        crawler = WorkdayCrawler()
        jobs = await crawler.fetch_jobs(company)
        assert jobs == []


# ── ATS URL Detection ────────────────────────────────────────────────────


class TestATSDetection:
    def test_greenhouse(self):
        result = detect_ats_from_url("https://boards.greenhouse.io/stripe")
        assert result.ats_type == "greenhouse"
        assert result.board_token == "stripe"
        assert result.confidence == "high"

    def test_greenhouse_job_boards(self):
        result = detect_ats_from_url("https://job-boards.greenhouse.io/cloudflare")
        assert result.ats_type == "greenhouse"
        assert result.board_token == "cloudflare"

    def test_lever(self):
        result = detect_ats_from_url("https://jobs.lever.co/netflix")
        assert result.ats_type == "lever"
        assert result.board_token == "netflix"
        assert result.confidence == "high"

    def test_ashby(self):
        result = detect_ats_from_url("https://jobs.ashbyhq.com/ramp")
        assert result.ats_type == "ashby"
        assert result.board_token == "ramp"
        assert result.confidence == "high"

    def test_smartrecruiters(self):
        result = detect_ats_from_url("https://careers.smartrecruiters.com/Visa")
        assert result.ats_type == "smartrecruiters"
        assert result.board_token == "Visa"

    def test_workday(self):
        result = detect_ats_from_url(
            "https://mastercard.wd1.myworkdayjobs.com/en-US/CorporateCareers"
        )
        assert result.ats_type == "workday"
        assert result.board_token == "CorporateCareers"
        assert "mastercard.wd1.myworkdayjobs.com" in result.ats_base_url

    def test_unknown_url(self):
        result = detect_ats_from_url("https://example.com/careers")
        assert result.ats_type is None
        assert result.confidence == "unknown"

    def test_lever_with_path(self):
        result = detect_ats_from_url("https://jobs.lever.co/wealthsimple/abc-123")
        assert result.ats_type == "lever"
        assert result.board_token == "wealthsimple"
