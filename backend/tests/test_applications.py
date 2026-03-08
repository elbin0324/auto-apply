"""Applications API tests.

Tests cover auth protection, list/detail/stats endpoints,
internal agent result endpoint, progress endpoint, submit endpoint,
and service unit tests.
"""

import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from main import app
from schemas.application import ApplicationListResponse, ApplicationStats

client = TestClient(app)

# ── Test Helpers ──────────────────────────────────────────────────────────────

_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
_APP_ID = uuid.UUID("55555555-5555-5555-5555-555555555555")
_APP_ID_2 = uuid.UUID("66666666-6666-6666-6666-666666666666")
_JOB_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")


def _mock_user() -> MagicMock:
    user = MagicMock()
    user.id = _USER_ID
    user.supabase_uid = "test-uid"
    user.email = "test@example.com"
    return user


def _mock_application(**overrides: object) -> SimpleNamespace:
    defaults: dict = {
        "id": _APP_ID,
        "user_id": _USER_ID,
        "job_id": _JOB_ID,
        "status": "queued",
        "resume_used_url": None,
        "cover_letter_used": None,
        "screenshot_url": None,
        "error_message": None,
        "metadata_": None,
        "applied_at": None,
        "created_at": datetime(2026, 2, 27, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 2, 27, tzinfo=timezone.utc),
        "job": None,
        "current_phase": None,
        "phase_message": None,
        "generated_application": None,
        "task_mode": None,
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


def _apply_internal_key_override() -> None:
    from deps import verify_internal_api_key

    app.dependency_overrides[verify_internal_api_key] = lambda: None


def _clear_overrides() -> None:
    app.dependency_overrides.clear()


# ── Auth protection ──────────────────────────────────────────────────────


class TestAuthProtection:
    def test_list_requires_auth(self) -> None:
        assert client.get("/api/applications").status_code == 401

    def test_detail_requires_auth(self) -> None:
        assert client.get(f"/api/applications/{_APP_ID}").status_code == 401

    def test_stats_requires_auth(self) -> None:
        assert client.get("/api/applications/stats").status_code == 401

    def test_result_requires_internal_key(self) -> None:
        resp = client.post(
            "/api/internal/applications/result",
            json={
                "task_id": str(_APP_ID),
                "status": "success",
            },
        )
        assert resp.status_code in (403, 422)

    def test_progress_requires_internal_key(self) -> None:
        resp = client.post(
            "/api/internal/applications/progress",
            json={
                "task_id": str(_APP_ID),
                "phase": "extracting",
            },
        )
        assert resp.status_code in (403, 422)

    def test_submit_requires_auth(self) -> None:
        resp = client.post(
            f"/api/applications/{_APP_ID}/submit",
            json={"answers": {"field1": "value1"}},
        )
        assert resp.status_code == 401


# ── Application list ─────────────────────────────────────────────────────


class TestApplicationList:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    @patch("routers.applications.list_applications", new_callable=AsyncMock)
    def test_list_returns_paginated_shape(self, mock_list: AsyncMock) -> None:
        app1 = _mock_application()
        mock_list.return_value = ApplicationListResponse(
            applications=[app1],
            total=1,
            page=1,
            per_page=20,
            pages=1,
        )

        resp = client.get("/api/applications")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["page"] == 1
        assert data["per_page"] == 20
        assert data["pages"] == 1
        assert len(data["applications"]) == 1
        assert data["applications"][0]["id"] == str(_APP_ID)

    @patch("routers.applications.list_applications", new_callable=AsyncMock)
    def test_list_with_status_filter(self, mock_list: AsyncMock) -> None:
        mock_list.return_value = ApplicationListResponse(
            applications=[], total=0, page=1, per_page=20, pages=1
        )

        resp = client.get("/api/applications?status=applied")
        assert resp.status_code == 200
        mock_list.assert_called_once()
        call_args = mock_list.call_args
        assert call_args.args[2] == "applied"  # status_filter param

    @patch("routers.applications.list_applications", new_callable=AsyncMock)
    def test_list_empty(self, mock_list: AsyncMock) -> None:
        mock_list.return_value = ApplicationListResponse(
            applications=[], total=0, page=1, per_page=20, pages=1
        )

        resp = client.get("/api/applications")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["applications"] == []

    @patch("routers.applications.list_applications", new_callable=AsyncMock)
    def test_list_pagination_params(self, mock_list: AsyncMock) -> None:
        mock_list.return_value = ApplicationListResponse(
            applications=[], total=0, page=2, per_page=10, pages=1
        )

        resp = client.get("/api/applications?page=2&per_page=10")
        assert resp.status_code == 200
        call_args = mock_list.call_args
        assert call_args.args[5] == 2   # page
        assert call_args.args[6] == 10  # per_page


# ── Application detail ───────────────────────────────────────────────────


class TestApplicationDetail:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    @patch("routers.applications.get_application", new_callable=AsyncMock)
    def test_get_application_found(self, mock_get: AsyncMock) -> None:
        app_obj = _mock_application(status="applied")
        mock_get.return_value = app_obj

        resp = client.get(f"/api/applications/{_APP_ID}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == str(_APP_ID)
        assert data["status"] == "applied"

    @patch("routers.applications.get_application", new_callable=AsyncMock)
    def test_get_application_not_found(self, mock_get: AsyncMock) -> None:
        from fastapi import HTTPException

        mock_get.side_effect = HTTPException(status_code=404, detail="Application not found")

        resp = client.get(f"/api/applications/{_APP_ID}")
        assert resp.status_code == 404

    @patch("routers.applications.get_application", new_callable=AsyncMock)
    def test_get_application_includes_job(self, mock_get: AsyncMock) -> None:
        mock_job = SimpleNamespace(
            id=_JOB_ID,
            external_id="adzuna-123",
            title="Python Developer",
            company="Acme Corp",
            company_logo_url=None,
            location="Toronto, ON",
            location_type="remote",
            salary_min=80000,
            salary_max=120000,
            salary_currency="CAD",
            description="A great job",
            requirements=None,
            url="https://example.com/apply",
            source="adzuna",
            category="IT",
            tags=[],
            posted_at=datetime(2026, 2, 20, tzinfo=timezone.utc),
            expires_at=None,
            is_active=True,
            created_at=datetime(2026, 2, 20, tzinfo=timezone.utc),
            updated_at=datetime(2026, 2, 20, tzinfo=timezone.utc),
        )
        app_obj = _mock_application(job=mock_job)
        mock_get.return_value = app_obj

        resp = client.get(f"/api/applications/{_APP_ID}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["job"] is not None
        assert data["job"]["title"] == "Python Developer"

    @patch("routers.applications.get_application", new_callable=AsyncMock)
    def test_get_application_includes_phase09_fields(self, mock_get: AsyncMock) -> None:
        app_obj = _mock_application(
            status="in_progress",
            current_phase="extracting",
            phase_message="Found 12 fields",
            task_mode="full_auto",
            generated_application={"fields": [], "answers": []},
        )
        mock_get.return_value = app_obj

        resp = client.get(f"/api/applications/{_APP_ID}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["current_phase"] == "extracting"
        assert data["phase_message"] == "Found 12 fields"
        assert data["task_mode"] == "full_auto"
        assert data["generated_application"] == {"fields": [], "answers": []}


# ── Application stats ────────────────────────────────────────────────────


class TestApplicationStats:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    @patch("routers.applications.get_application_stats", new_callable=AsyncMock)
    def test_stats_returns_aggregates(self, mock_stats: AsyncMock) -> None:
        mock_stats.return_value = ApplicationStats(
            total=10,
            applied=6,
            pending=2,
            failed=1,
            skipped=1,
            this_week=4,
            success_rate=85.7,
        )

        resp = client.get("/api/applications/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 10
        assert data["applied"] == 6
        assert data["success_rate"] == 85.7

    @patch("routers.applications.get_application_stats", new_callable=AsyncMock)
    def test_stats_zero_applications(self, mock_stats: AsyncMock) -> None:
        mock_stats.return_value = ApplicationStats(
            total=0,
            applied=0,
            pending=0,
            failed=0,
            skipped=0,
            this_week=0,
            success_rate=0.0,
        )

        resp = client.get("/api/applications/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["success_rate"] == 0.0


# ── Agent result endpoint ────────────────────────────────────────────────


class TestAgentResult:
    def setup_method(self) -> None:
        self.session = _mock_db_session()
        _apply_internal_key_override()
        _apply_overrides(session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    @patch("routers.applications.process_agent_result", new_callable=AsyncMock)
    def test_result_success(self, mock_process: AsyncMock) -> None:
        mock_process.return_value = _mock_application(status="applied")

        resp = client.post(
            "/api/internal/applications/result",
            json={
                "task_id": str(_APP_ID),
                "status": "success",
                "screenshot_urls": ["https://storage.example.com/screenshot.png"],
                "metadata": {"fields_filled": 5, "duration": 30.2},
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "applied"
        assert data["application_id"] == str(_APP_ID)

    @patch("routers.applications.process_agent_result", new_callable=AsyncMock)
    def test_result_failure(self, mock_process: AsyncMock) -> None:
        mock_process.return_value = _mock_application(
            status="failed", error_message="CAPTCHA detected"
        )

        resp = client.post(
            "/api/internal/applications/result",
            json={
                "task_id": str(_APP_ID),
                "status": "failed",
                "reason": "CAPTCHA detected",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "failed"

    @patch("routers.applications.process_agent_result", new_callable=AsyncMock)
    def test_result_with_generated_application(self, mock_process: AsyncMock) -> None:
        mock_process.return_value = _mock_application(
            status="pending_review",
            generated_application={"fields": [{"name": "first_name"}], "answers": []},
        )

        resp = client.post(
            "/api/internal/applications/result",
            json={
                "task_id": str(_APP_ID),
                "status": "needs_review",
                "generated_application": {
                    "fields": [
                        {"name": "first_name", "label": "First Name", "field_type": "text"}
                    ],
                    "answers": [
                        {"field_name": "first_name", "value": "John", "source": "generated"}
                    ],
                },
            },
        )
        assert resp.status_code == 200

    @patch("routers.applications.process_agent_result", new_callable=AsyncMock)
    def test_result_not_found(self, mock_process: AsyncMock) -> None:
        from fastapi import HTTPException

        mock_process.side_effect = HTTPException(
            status_code=404,
            detail=f"Application {_APP_ID} not found",
        )

        resp = client.post(
            "/api/internal/applications/result",
            json={
                "task_id": str(_APP_ID),
                "status": "success",
            },
        )
        assert resp.status_code == 404

    def test_result_missing_required_fields(self) -> None:
        resp = client.post(
            "/api/internal/applications/result",
            json={"task_id": str(_APP_ID)},
        )
        assert resp.status_code == 422


# ── Progress endpoint ────────────────────────────────────────────────────


class TestProgressEndpoint:
    def setup_method(self) -> None:
        self.session = _mock_db_session()
        _apply_internal_key_override()
        _apply_overrides(session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    @patch("routers.applications.process_progress_update", new_callable=AsyncMock)
    def test_progress_update(self, mock_process: AsyncMock) -> None:
        mock_process.return_value = _mock_application(
            status="in_progress", current_phase="extracting"
        )

        resp = client.post(
            "/api/internal/applications/progress",
            json={
                "task_id": str(_APP_ID),
                "phase": "extracting",
                "message": "Found 12 fields",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["application_id"] == str(_APP_ID)
        assert data["phase"] == "extracting"

    @patch("routers.applications.process_progress_update", new_callable=AsyncMock)
    def test_progress_not_found(self, mock_process: AsyncMock) -> None:
        from fastapi import HTTPException

        mock_process.side_effect = HTTPException(
            status_code=404,
            detail=f"Application {_APP_ID} not found",
        )

        resp = client.post(
            "/api/internal/applications/progress",
            json={
                "task_id": str(_APP_ID),
                "phase": "navigating",
            },
        )
        assert resp.status_code == 404


# ── Submit endpoint ──────────────────────────────────────────────────────


class TestSubmitEndpoint:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    @patch("routers.applications.push_apply_task", new_callable=AsyncMock)
    @patch("routers.applications.build_user_profile_for_agent", new_callable=AsyncMock)
    @patch("routers.applications.get_application", new_callable=AsyncMock)
    def test_submit_success(
        self, mock_get: AsyncMock, mock_build: AsyncMock, mock_push: AsyncMock
    ) -> None:
        app_obj = _mock_application(
            status="pending_review",
            generated_application={"fields": [{"name": "f1"}], "answers": []},
        )
        mock_get.return_value = app_obj
        mock_build.return_value = (None, None, None)

        # Mock the job URL lookup
        job_result = MagicMock()
        job_row = SimpleNamespace(url="https://example.com/job", apply_url=None)
        job_result.one_or_none.return_value = job_row
        self.session.execute = AsyncMock(return_value=job_result)

        resp = client.post(
            f"/api/applications/{_APP_ID}/submit",
            json={"answers": {"first_name": "John", "last_name": "Doe"}},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "queued"
        assert app_obj.status == "queued"
        assert app_obj.task_mode == "fill_and_submit"
        mock_push.assert_called_once()

    @patch("routers.applications.get_application", new_callable=AsyncMock)
    def test_submit_wrong_status(self, mock_get: AsyncMock) -> None:
        app_obj = _mock_application(status="applied")
        mock_get.return_value = app_obj

        resp = client.post(
            f"/api/applications/{_APP_ID}/submit",
            json={"answers": {"f1": "v1"}},
        )
        assert resp.status_code == 400
        assert "pending_review" in resp.json()["detail"]

    @patch("routers.applications.get_application", new_callable=AsyncMock)
    def test_submit_no_generated_application(self, mock_get: AsyncMock) -> None:
        app_obj = _mock_application(status="pending_review", generated_application=None)
        mock_get.return_value = app_obj

        resp = client.post(
            f"/api/applications/{_APP_ID}/submit",
            json={"answers": {"f1": "v1"}},
        )
        assert resp.status_code == 400
        assert "no generated application" in resp.json()["detail"]


# ── Service unit tests ───────────────────────────────────────────────────


class TestApplicationServiceUnit:
    def setup_method(self) -> None:
        self.session = _mock_db_session()

    @patch("services.application_service.select")
    async def test_process_result_success(self, mock_select: MagicMock) -> None:
        from schemas.auto_apply import ApplyResult
        from services.application_service import process_agent_result

        app_obj = _mock_application(status="queued", task_mode="full_auto")
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = app_obj
        self.session.execute = AsyncMock(return_value=result_mock)

        apply_result = ApplyResult(
            task_id=_APP_ID,
            status="success",
            screenshot_urls=["https://example.com/shot.png"],
            metadata={"fields_filled": 3},
        )

        updated = await process_agent_result(self.session, apply_result)
        assert updated.status == "applied"
        assert updated.applied_at is not None
        assert updated.screenshot_url == "https://example.com/shot.png"
        assert updated.metadata_ == {"fields_filled": 3}
        assert updated.current_phase == "completed"

    @patch("services.application_service.select")
    async def test_process_result_failure(self, mock_select: MagicMock) -> None:
        from schemas.auto_apply import ApplyResult
        from services.application_service import process_agent_result

        app_obj = _mock_application(status="queued")
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = app_obj
        self.session.execute = AsyncMock(return_value=result_mock)

        apply_result = ApplyResult(
            task_id=_APP_ID,
            status="failed",
            reason="Login wall detected",
        )

        updated = await process_agent_result(self.session, apply_result)
        assert updated.status == "failed"
        assert updated.error_message == "Login wall detected"
        assert updated.applied_at is None
        assert updated.current_phase == "failed"

    @patch("services.application_service.select")
    async def test_process_result_extract_only(self, mock_select: MagicMock) -> None:
        from schemas.auto_apply import ApplyResult, GeneratedApplication
        from services.application_service import process_agent_result

        app_obj = _mock_application(status="in_progress", task_mode="extract_only")
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = app_obj
        self.session.execute = AsyncMock(return_value=result_mock)

        apply_result = ApplyResult(
            task_id=_APP_ID,
            status="success",
            generated_application=GeneratedApplication(
                fields=[], answers=[], pages_found=2
            ),
        )

        updated = await process_agent_result(self.session, apply_result)
        assert updated.status == "pending_review"
        assert updated.generated_application is not None
        assert updated.current_phase == "completed"

    @patch("services.application_service.select")
    async def test_process_result_needs_review(self, mock_select: MagicMock) -> None:
        from schemas.auto_apply import ApplyResult
        from services.application_service import process_agent_result

        app_obj = _mock_application(status="in_progress")
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = app_obj
        self.session.execute = AsyncMock(return_value=result_mock)

        apply_result = ApplyResult(
            task_id=_APP_ID,
            status="needs_review",
        )

        updated = await process_agent_result(self.session, apply_result)
        assert updated.status == "pending_review"

    @patch("services.application_service.select")
    async def test_process_result_not_found(self, mock_select: MagicMock) -> None:
        import pytest
        from fastapi import HTTPException

        from schemas.auto_apply import ApplyResult
        from services.application_service import process_agent_result

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        self.session.execute = AsyncMock(return_value=result_mock)

        apply_result = ApplyResult(
            task_id=_APP_ID,
            status="success",
        )

        with pytest.raises(HTTPException) as exc_info:
            await process_agent_result(self.session, apply_result)
        assert exc_info.value.status_code == 404

    @patch("services.application_service.select")
    async def test_process_progress_update(self, mock_select: MagicMock) -> None:
        from schemas.auto_apply import ProgressUpdate
        from services.application_service import process_progress_update

        app_obj = _mock_application(status="queued")
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = app_obj
        self.session.execute = AsyncMock(return_value=result_mock)

        update = ProgressUpdate(
            task_id=str(_APP_ID),
            phase="extracting",
            message="Found 12 fields",
        )

        updated = await process_progress_update(self.session, update)
        assert updated.current_phase == "extracting"
        assert updated.phase_message == "Found 12 fields"
        assert updated.status == "in_progress"  # auto-transitioned from queued

    @patch("services.application_service.select")
    async def test_process_progress_skips_terminal(self, mock_select: MagicMock) -> None:
        from schemas.auto_apply import ProgressUpdate
        from services.application_service import process_progress_update

        app_obj = _mock_application(status="applied")
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = app_obj
        self.session.execute = AsyncMock(return_value=result_mock)

        update = ProgressUpdate(
            task_id=str(_APP_ID),
            phase="extracting",
            message="Should be ignored",
        )

        updated = await process_progress_update(self.session, update)
        # Should not update phase for terminal status
        assert updated.current_phase is None
        assert updated.status == "applied"

    def test_stats_success_rate_calculation(self) -> None:
        from schemas.application import ApplicationStats

        stats = ApplicationStats(
            total=10, applied=7, pending=1, failed=2,
            skipped=0, this_week=5, success_rate=77.8,
        )
        assert stats.success_rate == 77.8

    def test_stats_zero_denominator(self) -> None:
        from schemas.application import ApplicationStats

        stats = ApplicationStats(
            total=5, applied=0, pending=5, failed=0,
            skipped=0, this_week=3, success_rate=0.0,
        )
        assert stats.success_rate == 0.0

    def test_apply_result_schema_defaults(self) -> None:
        from schemas.auto_apply import ApplyResult

        result = ApplyResult(task_id=_APP_ID, status="success")
        assert result.screenshot_url is None
        assert result.error_message is None
        assert result.metadata == {}
        assert result.success is True

    def test_apply_result_schema_failure(self) -> None:
        from schemas.auto_apply import ApplyResult

        result = ApplyResult(task_id=_APP_ID, status="failed", reason="timeout")
        assert result.success is False
        assert result.reason == "timeout"

    def test_apply_result_accepts_application_id(self) -> None:
        """Backwards compat: application_id field name should also work."""
        from schemas.auto_apply import ApplyResult

        result = ApplyResult(application_id=_APP_ID, status="success")
        assert result.application_id == _APP_ID
