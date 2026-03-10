"""Jobs API tests.

Tests cover auth protection, job search/detail, match scores,
and pure heuristic scorer unit tests.
"""

import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

# ── Test Helpers ──────────────────────────────────────────────────────────────

_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
_JOB_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")
_JOB_ID_2 = uuid.UUID("44444444-4444-4444-4444-444444444444")


def _mock_user() -> MagicMock:
    user = MagicMock()
    user.id = _USER_ID
    user.supabase_uid = "test-uid"
    user.email = "test@example.com"
    return user


def _mock_job(**overrides: object) -> SimpleNamespace:
    defaults: dict = {
        "id": _JOB_ID,
        "external_id": "adzuna-123",
        "title": "Senior Python Developer",
        "company": "Acme Corp",
        "company_logo_url": None,
        "location": "Toronto, ON",
        "location_type": "hybrid",
        "salary_min": 90000.0,
        "salary_max": 130000.0,
        "salary_currency": "CAD",
        "description": "We need a Python developer with FastAPI experience.",
        "tags": ["python"],
        "url": "https://example.com/job/123",
        "source": "adzuna",
        "category": "IT Jobs",
        "posted_at": datetime(2026, 2, 1, tzinfo=timezone.utc),
        "is_active": True,
        "match_score": None,
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def _mock_score(**overrides: object) -> SimpleNamespace:
    defaults: dict = {
        "user_id": _USER_ID,
        "job_id": _JOB_ID,
        "score": 72.5,
        "factors": {"skill_score": 35.0, "title_score": 22.5, "location_score": 15.0},
        "computed_at": datetime(2026, 2, 27, tzinfo=timezone.utc),
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def _mock_db_session() -> AsyncMock:
    session = AsyncMock()
    session.add = MagicMock()
    return session


def _apply_overrides(
    user: MagicMock | None = None,
    session: AsyncMock | None = None,
) -> None:
    from deps import get_current_user
    from db.session import get_db

    if user:
        app.dependency_overrides[get_current_user] = lambda: user
    if session:

        async def _get_db():  # type: ignore[override]
            yield session

        app.dependency_overrides[get_db] = _get_db


def _clear_overrides() -> None:
    app.dependency_overrides.clear()


# ── Auth protection ──────────────────────────────────────────────────────────


class TestAuthProtection:
    def test_list_jobs_requires_auth(self) -> None:
        assert client.get("/api/jobs").status_code == 401

    def test_get_job_requires_auth(self) -> None:
        assert client.get(f"/api/jobs/{_JOB_ID}").status_code == 401

    def test_get_match_requires_auth(self) -> None:
        assert client.get(f"/api/jobs/{_JOB_ID}/match").status_code == 401



# ── Job list ─────────────────────────────────────────────────────────────────


class TestJobList:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    def test_list_jobs_returns_paginated_shape(self) -> None:
        job1 = _mock_job()
        job2 = _mock_job(id=_JOB_ID_2, external_id="adzuna-456")

        # First execute: config query (no config)
        config_result = MagicMock()
        config_result.scalar_one_or_none.return_value = None

        # Second execute: count query
        count_result = MagicMock()
        count_result.scalar_one.return_value = 2

        # Third execute: joined query returns row tuples
        # Each row is (Job, score, factors, application_id, application_status)
        rows_result = MagicMock()
        rows_result.all.return_value = [
            (job1, 72.5, {"skill_score": 35.0}, None, None),
            (job2, 60.0, {"skill_score": 25.0}, None, None),
        ]

        self.session.execute = AsyncMock(
            side_effect=[config_result, count_result, rows_result]
        )

        resp = client.get("/api/jobs")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert data["page"] == 1
        assert data["per_page"] == 20
        assert len(data["jobs"]) == 2
        assert data["jobs"][0]["title"] == "Senior Python Developer"
        assert data["jobs"][0]["match_score"] == 72.5
        assert data["jobs"][0]["application_status"] is None

    def test_list_jobs_with_application_status(self) -> None:
        job = _mock_job()
        app_id = uuid.uuid4()

        # Config query (no config)
        config_result = MagicMock()
        config_result.scalar_one_or_none.return_value = None

        count_result = MagicMock()
        count_result.scalar_one.return_value = 1

        rows_result = MagicMock()
        rows_result.all.return_value = [
            (job, 72.5, {"skill_score": 35.0}, app_id, "queued"),
        ]

        self.session.execute = AsyncMock(
            side_effect=[config_result, count_result, rows_result]
        )

        resp = client.get("/api/jobs")
        assert resp.status_code == 200
        data = resp.json()
        assert data["jobs"][0]["match_score"] == 72.5
        assert data["jobs"][0]["application_status"] == "queued"
        assert data["jobs"][0]["application_id"] == str(app_id)


# ── Job detail ───────────────────────────────────────────────────────────────


class TestJobDetail:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    def test_get_job_found(self) -> None:
        job = _mock_job()

        # Single execute returns row tuple (Job, score, factors, app_id, app_status)
        result = MagicMock()
        result.one_or_none.return_value = (job, None, None, None, None)
        self.session.execute = AsyncMock(return_value=result)

        resp = client.get(f"/api/jobs/{_JOB_ID}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Senior Python Developer"
        assert data["company"] == "Acme Corp"
        assert data["match_score"] is None
        assert data["application_status"] is None

    def test_get_job_not_found(self) -> None:
        result = MagicMock()
        result.one_or_none.return_value = None
        self.session.execute = AsyncMock(return_value=result)

        resp = client.get(f"/api/jobs/{_JOB_ID}")
        assert resp.status_code == 404

    def test_get_job_with_score(self) -> None:
        job = _mock_job()
        factors = {"skill_score": 35.0, "title_score": 22.5, "location_score": 15.0}

        result = MagicMock()
        result.one_or_none.return_value = (job, 85.0, factors, None, None)
        self.session.execute = AsyncMock(return_value=result)

        resp = client.get(f"/api/jobs/{_JOB_ID}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["match_score"] == 85.0
        assert data["match_factors"]["skill_score"] == 35.0

    def test_get_job_with_application(self) -> None:
        job = _mock_job()
        app_id = uuid.uuid4()

        result = MagicMock()
        result.one_or_none.return_value = (job, 72.5, {}, app_id, "applied")
        self.session.execute = AsyncMock(return_value=result)

        resp = client.get(f"/api/jobs/{_JOB_ID}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["application_status"] == "applied"
        assert data["application_id"] == str(app_id)


# ── Match endpoint ───────────────────────────────────────────────────────────


class TestJobMatch:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    def test_match_not_found(self) -> None:
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        self.session.execute = AsyncMock(return_value=result)

        resp = client.get(f"/api/jobs/{_JOB_ID}/match")
        assert resp.status_code == 404
        assert "not computed" in resp.json()["detail"]

    def test_match_found(self) -> None:
        score = _mock_score()
        result = MagicMock()
        result.scalar_one_or_none.return_value = score
        self.session.execute = AsyncMock(return_value=result)

        resp = client.get(f"/api/jobs/{_JOB_ID}/match")
        assert resp.status_code == 200
        data = resp.json()
        assert data["score"] == 72.5
        assert data["factors"]["skill_score"] == 35.0


# ── Heuristic scorer unit tests ──────────────────────────────────────────────


class TestScorerUnit:
    def test_skill_overlap_full_match(self) -> None:
        from workers.services.heuristic_scorer import _compute_skill_score

        score = _compute_skill_score(
            ["python", "fastapi"], "python developer with fastapi skills"
        )
        assert score == 50.0

    def test_skill_overlap_partial(self) -> None:
        from workers.services.heuristic_scorer import _compute_skill_score

        score = _compute_skill_score(
            ["python", "java", "go"], "python developer needed"
        )
        assert abs(score - (1 / 3 * 50)) < 0.1

    def test_skill_overlap_none(self) -> None:
        from workers.services.heuristic_scorer import _compute_skill_score

        score = _compute_skill_score(["rust", "haskell"], "python developer")
        assert score == 0.0

    def test_skill_overlap_empty_skills(self) -> None:
        from workers.services.heuristic_scorer import _compute_skill_score

        score = _compute_skill_score([], "python developer")
        assert score == 0.0

    def test_title_exact_match(self) -> None:
        from workers.services.heuristic_scorer import _compute_title_score

        score = _compute_title_score(["Python Developer"], "Python Developer")
        assert score == 30.0

    def test_title_partial_match(self) -> None:
        from workers.services.heuristic_scorer import _compute_title_score

        score = _compute_title_score(
            ["Senior Python Developer"], "Python Developer"
        )
        assert score > 0.0
        assert score < 30.0

    def test_title_no_match(self) -> None:
        from workers.services.heuristic_scorer import _compute_title_score

        score = _compute_title_score(["Data Scientist"], "Python Developer")
        assert score == 0.0

    def test_title_empty(self) -> None:
        from workers.services.heuristic_scorer import _compute_title_score

        score = _compute_title_score([], "Python Developer")
        assert score == 0.0

    def test_location_remote_always_matches(self) -> None:
        from workers.services.heuristic_scorer import _compute_location_score

        score = _compute_location_score("Vancouver", None, "New York", "remote")
        assert score == 20.0

    def test_location_city_match(self) -> None:
        from workers.services.heuristic_scorer import _compute_location_score

        score = _compute_location_score("Toronto, ON", None, "Toronto", "onsite")
        assert score == 20.0

    def test_location_target_match(self) -> None:
        from workers.services.heuristic_scorer import _compute_location_score

        score = _compute_location_score(
            None, ["Toronto", "Vancouver"], "Toronto, ON", "hybrid"
        )
        assert score == 20.0

    def test_location_no_match(self) -> None:
        from workers.services.heuristic_scorer import _compute_location_score

        score = _compute_location_score("Vancouver", None, "Calgary", "onsite")
        assert score == 0.0

    def test_location_no_job_location(self) -> None:
        from workers.services.heuristic_scorer import _compute_location_score

        score = _compute_location_score("Toronto", None, None, None)
        assert score == 0.0

    def test_full_score(self) -> None:
        from workers.services.heuristic_scorer import score_job_for_user

        score, factors = score_job_for_user(
            skill_names=["python", "fastapi"],
            target_titles=["Python Developer"],
            profile_location="Toronto",
            target_locations=["Toronto"],
            job_title="Python Developer",
            job_description="We need python and fastapi expertise",
            job_location="Toronto, ON",
            job_location_type="hybrid",
        )
        assert score == 100.0
        assert factors["skill_score"] == 50.0
        assert factors["title_score"] == 30.0
        assert factors["location_score"] == 20.0
