"""Auto-apply API tests.

Tests cover auth protection, config CRUD, start/stop lifecycle,
queue status, review endpoint, and service unit tests.
"""

import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

# ── Test Helpers ──────────────────────────────────────────────────────────────

_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
_CONFIG_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
_APP_ID = uuid.UUID("55555555-5555-5555-5555-555555555555")
_JOB_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")


def _mock_user() -> MagicMock:
    user = MagicMock()
    user.id = _USER_ID
    user.supabase_uid = "test-uid"
    user.email = "test@example.com"
    return user


def _mock_config(**overrides: object) -> SimpleNamespace:
    defaults: dict = {
        "id": _CONFIG_ID,
        "user_id": _USER_ID,
        "is_active": False,
        "target_titles": None,
        "target_locations": None,
        "min_salary": None,
        "max_salary": None,
        "excluded_companies": None,
        "preferred_industries": None,
        "location_type_pref": None,
        "experience_level": None,
        "daily_apply_limit": 25,
        "require_review": False,
        "created_at": datetime(2026, 2, 1, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 2, 1, tzinfo=timezone.utc),
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def _mock_application(**overrides: object) -> SimpleNamespace:
    defaults: dict = {
        "id": _APP_ID,
        "user_id": _USER_ID,
        "job_id": _JOB_ID,
        "status": "pending_review",
        "resume_used_url": None,
        "cover_letter_used": None,
        "screenshot_url": None,
        "error_message": None,
        "metadata_": None,
        "applied_at": None,
        "created_at": datetime(2026, 2, 27, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 2, 27, tzinfo=timezone.utc),
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


class TestAutoApplyAuthProtection:
    def test_get_config_requires_auth(self) -> None:
        assert client.get("/api/auto-apply/config").status_code == 401

    def test_put_config_requires_auth(self) -> None:
        assert client.put("/api/auto-apply/config", json={}).status_code == 401

    def test_start_requires_auth(self) -> None:
        assert client.post("/api/auto-apply/start").status_code == 401

    def test_stop_requires_auth(self) -> None:
        assert client.post("/api/auto-apply/stop").status_code == 401

    def test_queue_requires_auth(self) -> None:
        assert client.get("/api/auto-apply/queue").status_code == 401

    def test_review_requires_auth(self) -> None:
        resp = client.post(
            f"/api/auto-apply/review/{_APP_ID}", params={"action": "approve"}
        )
        assert resp.status_code == 401


# ── Config CRUD ──────────────────────────────────────────────────────────────


class TestAutoApplyConfig:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    @patch("routers.auto_apply.get_or_create_config", new_callable=AsyncMock)
    def test_get_config_returns_existing(self, mock_get: AsyncMock) -> None:
        config = _mock_config(target_titles=["Python Developer"])
        mock_get.return_value = config

        resp = client.get("/api/auto-apply/config")
        assert resp.status_code == 200
        data = resp.json()
        assert data["user_id"] == str(_USER_ID)
        assert data["target_titles"] == ["Python Developer"]
        assert data["is_active"] is False
        assert data["daily_apply_limit"] == 25

    @patch("routers.auto_apply.get_or_create_config", new_callable=AsyncMock)
    def test_get_config_returns_default(self, mock_get: AsyncMock) -> None:
        config = _mock_config()
        mock_get.return_value = config

        resp = client.get("/api/auto-apply/config")
        assert resp.status_code == 200
        data = resp.json()
        assert data["target_titles"] is None
        assert data["is_active"] is False

    @patch("routers.auto_apply.get_or_create_config", new_callable=AsyncMock)
    def test_update_config_partial(self, mock_get: AsyncMock) -> None:
        config = _mock_config()
        mock_get.return_value = config

        resp = client.put(
            "/api/auto-apply/config",
            json={
                "target_titles": ["Data Engineer", "Backend Dev"],
                "daily_apply_limit": 10,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["target_titles"] == ["Data Engineer", "Backend Dev"]
        assert data["daily_apply_limit"] == 10

    @patch("routers.auto_apply.get_or_create_config", new_callable=AsyncMock)
    def test_update_config_validates_daily_limit(
        self, mock_get: AsyncMock
    ) -> None:
        config = _mock_config()
        mock_get.return_value = config

        resp = client.put(
            "/api/auto-apply/config",
            json={"daily_apply_limit": 0},
        )
        assert resp.status_code == 422


# ── Start / Stop ─────────────────────────────────────────────────────────────


class TestAutoApplyStartStop:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    @patch("routers.auto_apply.get_or_create_config", new_callable=AsyncMock)
    def test_start_without_target_titles_400(
        self, mock_get: AsyncMock
    ) -> None:
        config = _mock_config(target_titles=None)
        mock_get.return_value = config

        resp = client.post("/api/auto-apply/start")
        assert resp.status_code == 400
        assert "target job title" in resp.json()["detail"]

    @patch("routers.auto_apply.get_or_create_config", new_callable=AsyncMock)
    def test_start_with_empty_target_titles_400(
        self, mock_get: AsyncMock
    ) -> None:
        config = _mock_config(target_titles=[])
        mock_get.return_value = config

        resp = client.post("/api/auto-apply/start")
        assert resp.status_code == 400

    @patch("routers.auto_apply.run_matching_for_user", new_callable=AsyncMock)
    @patch("routers.auto_apply.get_or_create_config", new_callable=AsyncMock)
    def test_start_success(
        self, mock_get: AsyncMock, mock_match: AsyncMock
    ) -> None:
        config = _mock_config(target_titles=["Python Developer"])
        mock_get.return_value = config
        mock_match.return_value = {
            "matched": 5,
            "queued": 3,
            "skipped_already_applied": 1,
            "skipped_daily_limit": 1,
            "initial_status": "queued",
        }

        resp = client.post("/api/auto-apply/start")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "started"
        assert data["is_active"] is True
        assert data["matched"] == 5
        assert data["queued"] == 3
        mock_match.assert_called_once()

    @patch("routers.auto_apply.get_or_create_config", new_callable=AsyncMock)
    def test_stop_sets_inactive(self, mock_get: AsyncMock) -> None:
        config = _mock_config(is_active=True)
        mock_get.return_value = config

        # Mock the query for pending applications — return empty
        result = MagicMock()
        result.scalars.return_value.all.return_value = []
        self.session.execute = AsyncMock(return_value=result)

        resp = client.post("/api/auto-apply/stop")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "stopped"
        assert data["is_active"] is False
        assert data["applications_skipped"] == 0

    @patch("routers.auto_apply.get_or_create_config", new_callable=AsyncMock)
    def test_stop_skips_queued_applications(
        self, mock_get: AsyncMock
    ) -> None:
        config = _mock_config(is_active=True)
        mock_get.return_value = config

        app1 = _mock_application(status="queued")
        app2 = _mock_application(
            id=uuid.UUID("66666666-6666-6666-6666-666666666666"),
            status="pending_review",
        )

        result = MagicMock()
        result.scalars.return_value.all.return_value = [app1, app2]
        self.session.execute = AsyncMock(return_value=result)

        resp = client.post("/api/auto-apply/stop")
        assert resp.status_code == 200
        data = resp.json()
        assert data["applications_skipped"] == 2
        assert app1.status == "skipped"
        assert app2.status == "skipped"


# ── Queue status ─────────────────────────────────────────────────────────────


class TestAutoApplyQueue:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    @patch("routers.auto_apply.get_queue_status", new_callable=AsyncMock)
    def test_queue_returns_counts(self, mock_qs: AsyncMock) -> None:
        from schemas.auto_apply import QueueStatus

        mock_qs.return_value = QueueStatus(
            queue_depth=5, pending_review_count=2, in_progress_count=1
        )

        resp = client.get("/api/auto-apply/queue")
        assert resp.status_code == 200
        data = resp.json()
        assert data["queue_depth"] == 5
        assert data["pending_review_count"] == 2
        assert data["in_progress_count"] == 1

    @patch("routers.auto_apply.get_queue_status", new_callable=AsyncMock)
    def test_queue_empty(self, mock_qs: AsyncMock) -> None:
        from schemas.auto_apply import QueueStatus

        mock_qs.return_value = QueueStatus(
            queue_depth=0, pending_review_count=0, in_progress_count=0
        )

        resp = client.get("/api/auto-apply/queue")
        assert resp.status_code == 200
        data = resp.json()
        assert data["queue_depth"] == 0


# ── Review endpoint ──────────────────────────────────────────────────────────


class TestAutoApplyReview:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    def test_review_not_found_404(self) -> None:
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        self.session.execute = AsyncMock(return_value=result)

        resp = client.post(
            f"/api/auto-apply/review/{_APP_ID}", params={"action": "approve"}
        )
        assert resp.status_code == 404

    def test_review_wrong_status_400(self) -> None:
        application = _mock_application(status="applied")
        result = MagicMock()
        result.scalar_one_or_none.return_value = application
        self.session.execute = AsyncMock(return_value=result)

        resp = client.post(
            f"/api/auto-apply/review/{_APP_ID}", params={"action": "approve"}
        )
        assert resp.status_code == 400
        assert "not pending review" in resp.json()["detail"]

    def test_review_invalid_action_422(self) -> None:
        resp = client.post(
            f"/api/auto-apply/review/{_APP_ID}", params={"action": "maybe"}
        )
        assert resp.status_code == 422

    @patch("routers.auto_apply.push_apply_task", new_callable=AsyncMock)
    @patch(
        "routers.auto_apply.build_user_profile_for_agent",
        new_callable=AsyncMock,
    )
    def test_review_approve(
        self, mock_build: AsyncMock, mock_push: AsyncMock
    ) -> None:
        mock_build.return_value = (None, None, None)

        application = _mock_application(status="pending_review")
        app_result = MagicMock()
        app_result.scalar_one_or_none.return_value = application

        job_result = MagicMock()
        job_result.scalar_one_or_none.return_value = "https://example.com/job"

        self.session.execute = AsyncMock(
            side_effect=[app_result, job_result]
        )

        resp = client.post(
            f"/api/auto-apply/review/{_APP_ID}", params={"action": "approve"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "queued"
        assert application.status == "queued"
        mock_push.assert_called_once()

    def test_review_reject(self) -> None:
        application = _mock_application(status="pending_review")
        result = MagicMock()
        result.scalar_one_or_none.return_value = application
        self.session.execute = AsyncMock(return_value=result)

        resp = client.post(
            f"/api/auto-apply/review/{_APP_ID}", params={"action": "reject"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "skipped"
        assert application.status == "skipped"


# ── Queue service unit tests ────────────────────────────────────────────────


class TestQueueServiceUnit:
    @patch("services.queue_service.get_redis", new_callable=AsyncMock)
    async def test_push_apply_task_calls_redis(
        self, mock_get_redis: AsyncMock
    ) -> None:
        from schemas.auto_apply import ApplyTask
        from services.queue_service import push_apply_task

        mock_redis = AsyncMock()
        mock_get_redis.return_value = mock_redis

        task = ApplyTask(
            application_id=_APP_ID,
            user_id=_USER_ID,
            job_id=_JOB_ID,
            job_url="https://example.com/job",
        )
        await push_apply_task(task)
        mock_redis.rpush.assert_called_once()
        mock_redis.aclose.assert_called_once()

    @patch("services.queue_service.get_redis", new_callable=AsyncMock)
    async def test_get_queue_depth(self, mock_get_redis: AsyncMock) -> None:
        from services.queue_service import get_queue_depth

        mock_redis = AsyncMock()
        mock_redis.llen.return_value = 7
        mock_get_redis.return_value = mock_redis

        depth = await get_queue_depth()
        assert depth == 7
        mock_redis.aclose.assert_called_once()

    def test_apply_task_serialization(self) -> None:
        from schemas.auto_apply import ApplyTask

        task = ApplyTask(
            application_id=_APP_ID,
            user_id=_USER_ID,
            job_id=_JOB_ID,
            job_url="https://example.com/job",
            resume_url="https://storage.example.com/resume.pdf",
        )
        payload = task.model_dump_json()
        roundtrip = ApplyTask.model_validate_json(payload)
        assert roundtrip.application_id == _APP_ID
        assert roundtrip.job_url == "https://example.com/job"
        assert roundtrip.resume_url == "https://storage.example.com/resume.pdf"

    def test_apply_task_with_preferences_roundtrip(self) -> None:
        from schemas.auto_apply import ApplyTask, UserProfileForAgent
        from schemas.profile import ApplicationPreferences

        prefs = ApplicationPreferences(
            authorized_us=True,
            requires_sponsorship=False,
            willing_to_relocate=True,
            desired_salary_min=120000,
            desired_salary_max=180000,
            custom_answers={"Years of Python": "5"},
        )
        profile = UserProfileForAgent(
            full_name="Jane Doe",
            email="jane@example.com",
            application_preferences=prefs,
        )
        task = ApplyTask(
            application_id=_APP_ID,
            user_id=_USER_ID,
            job_id=_JOB_ID,
            job_url="https://example.com/job",
            user_profile=profile,
        )
        payload = task.model_dump_json()
        roundtrip = ApplyTask.model_validate_json(payload)
        assert roundtrip.user_profile is not None
        assert roundtrip.user_profile.application_preferences is not None
        assert roundtrip.user_profile.application_preferences.authorized_us is True
        assert roundtrip.user_profile.application_preferences.requires_sponsorship is False
        assert roundtrip.user_profile.application_preferences.desired_salary_min == 120000
        assert roundtrip.user_profile.application_preferences.custom_answers == {
            "Years of Python": "5"
        }


# ── Auto-apply service unit tests ───────────────────────────────────────────


class TestAutoApplyServiceUnit:
    async def test_get_or_create_config_creates_default(self) -> None:
        from services.auto_apply_service import get_or_create_config

        session = AsyncMock()
        session.add = MagicMock()

        # First call returns None (no existing config)
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=result)

        config = await get_or_create_config(session, _USER_ID)
        session.add.assert_called_once()
        assert config.user_id == _USER_ID

    async def test_get_or_create_config_returns_existing(self) -> None:
        from services.auto_apply_service import get_or_create_config

        session = AsyncMock()
        existing = _mock_config(target_titles=["Dev"])
        result = MagicMock()
        result.scalar_one_or_none.return_value = existing
        session.execute = AsyncMock(return_value=result)

        config = await get_or_create_config(session, _USER_ID)
        assert config.target_titles == ["Dev"]
        session.add.assert_not_called()

    async def test_check_credits_no_subscription(self) -> None:
        from services.auto_apply_service import check_credits

        session = AsyncMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=result)

        credits = await check_credits(session, _USER_ID)
        assert credits == -1

    async def test_check_credits_with_subscription(self) -> None:
        from services.auto_apply_service import check_credits

        session = AsyncMock()
        sub = SimpleNamespace(credits_remaining=42)
        result = MagicMock()
        result.scalar_one_or_none.return_value = sub
        session.execute = AsyncMock(return_value=result)

        credits = await check_credits(session, _USER_ID)
        assert credits == 42

    async def test_count_applications_today(self) -> None:
        from services.auto_apply_service import count_applications_today

        session = AsyncMock()
        result = MagicMock()
        result.scalar_one.return_value = 3
        session.execute = AsyncMock(return_value=result)

        count = await count_applications_today(session, _USER_ID)
        assert count == 3
