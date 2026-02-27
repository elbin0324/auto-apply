"""Profile API tests.

Tests use FastAPI dependency overrides for auth and DB,
and patch internal helpers to avoid real DB/storage/AI calls.
Full integration tests with a real DB will be added in Phase 11.
"""

import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

# ── Test Helpers ──────────────────────────────────────────────────────────────

_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
_PROFILE_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


def _mock_user() -> MagicMock:
    user = MagicMock()
    user.id = _USER_ID
    user.supabase_uid = "test-uid"
    user.email = "test@example.com"
    return user


def _mock_profile(**overrides: object) -> SimpleNamespace:
    defaults: dict = {
        "id": _PROFILE_ID,
        "user_id": _USER_ID,
        "full_name": "Test User",
        "email": "test@example.com",
        "phone": None,
        "location": None,
        "linkedin_url": None,
        "website_url": None,
        "summary": None,
        "raw_resume_url": None,
        "parsed_resume": None,
        "resume_updated_at": None,
        "experiences": [],
        "educations": [],
        "skills": [],
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
    def test_get_profile_requires_auth(self) -> None:
        assert client.get("/api/profile").status_code == 401

    def test_put_profile_requires_auth(self) -> None:
        assert client.put("/api/profile", json={"full_name": "X"}).status_code == 401

    def test_put_experiences_requires_auth(self) -> None:
        assert client.put("/api/profile/experiences", json=[]).status_code == 401

    def test_put_education_requires_auth(self) -> None:
        assert client.put("/api/profile/education", json=[]).status_code == 401

    def test_put_skills_requires_auth(self) -> None:
        assert client.put("/api/profile/skills", json=[]).status_code == 401

    def test_resume_upload_requires_auth(self) -> None:
        assert client.post("/api/profile/resume/upload").status_code == 401

    def test_resume_parse_requires_auth(self) -> None:
        assert client.post("/api/profile/resume/parse").status_code == 401

    def test_resume_parsed_requires_auth(self) -> None:
        assert client.get("/api/profile/resume/parsed").status_code == 401


# ── Profile CRUD ─────────────────────────────────────────────────────────────


class TestProfileCRUD:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    @patch("routers.profile._get_or_create_profile", new_callable=AsyncMock)
    def test_get_profile(self, mock_get: AsyncMock) -> None:
        mock_get.return_value = _mock_profile()

        resp = client.get("/api/profile")
        assert resp.status_code == 200
        data = resp.json()
        assert data["full_name"] == "Test User"
        assert data["email"] == "test@example.com"
        assert data["experiences"] == []
        assert data["educations"] == []
        assert data["skills"] == []

    @patch("routers.profile._get_or_create_profile", new_callable=AsyncMock)
    def test_update_profile(self, mock_get: AsyncMock) -> None:
        profile = _mock_profile()
        mock_get.return_value = profile

        resp = client.put("/api/profile", json={"full_name": "Updated", "location": "Toronto"})
        assert resp.status_code == 200
        assert profile.full_name == "Updated"
        assert profile.location == "Toronto"

    @patch("routers.profile._get_or_create_profile", new_callable=AsyncMock)
    def test_update_profile_partial(self, mock_get: AsyncMock) -> None:
        profile = _mock_profile(full_name="Original")
        mock_get.return_value = profile

        resp = client.put("/api/profile", json={"location": "Vancouver"})
        assert resp.status_code == 200
        assert profile.full_name == "Original"  # unchanged
        assert profile.location == "Vancouver"


# ── Resume upload & parse ────────────────────────────────────────────────────


class TestResume:
    def setup_method(self) -> None:
        self.user = _mock_user()
        self.session = _mock_db_session()
        _apply_overrides(user=self.user, session=self.session)

    def teardown_method(self) -> None:
        _clear_overrides()

    @patch("routers.profile._get_or_create_profile", new_callable=AsyncMock)
    def test_upload_rejects_non_pdf(self, mock_get: AsyncMock) -> None:
        mock_get.return_value = _mock_profile()

        resp = client.post(
            "/api/profile/resume/upload",
            files={"file": ("resume.txt", b"not a pdf", "text/plain")},
        )
        assert resp.status_code == 400
        assert "Only PDF" in resp.json()["detail"]

    @patch("utils.storage.upload_resume")
    @patch("routers.profile._get_or_create_profile", new_callable=AsyncMock)
    def test_upload_resume_success(self, mock_get: AsyncMock, mock_upload: MagicMock) -> None:
        profile = _mock_profile()
        mock_get.return_value = profile
        mock_upload.return_value = f"{_USER_ID}/resume.pdf"

        resp = client.post(
            "/api/profile/resume/upload",
            files={"file": ("resume.pdf", b"%PDF-1.4 fake", "application/pdf")},
        )
        assert resp.status_code == 200
        assert profile.raw_resume_url == f"{_USER_ID}/resume.pdf"
        assert profile.resume_updated_at is not None
        mock_upload.assert_called_once()

    @patch("routers.profile._get_or_create_profile", new_callable=AsyncMock)
    def test_parse_without_upload(self, mock_get: AsyncMock) -> None:
        mock_get.return_value = _mock_profile(raw_resume_url=None)

        resp = client.post("/api/profile/resume/parse")
        assert resp.status_code == 400
        assert "Upload a resume first" in resp.json()["detail"]

    @patch("routers.profile._get_or_create_profile", new_callable=AsyncMock)
    def test_parsed_not_found(self, mock_get: AsyncMock) -> None:
        mock_get.return_value = _mock_profile(parsed_resume=None)

        resp = client.get("/api/profile/resume/parsed")
        assert resp.status_code == 404
        assert "Upload and parse" in resp.json()["detail"]

    @patch("routers.profile._get_or_create_profile", new_callable=AsyncMock)
    def test_get_parsed_resume(self, mock_get: AsyncMock) -> None:
        parsed_data = {
            "full_name": "Test User",
            "email": "test@example.com",
            "phone": None,
            "location": "Toronto",
            "linkedin_url": None,
            "website_url": None,
            "summary": "A developer",
            "experiences": [],
            "educations": [],
            "skills": [],
            "raw_text": "raw resume text",
        }
        mock_get.return_value = _mock_profile(parsed_resume=parsed_data)

        resp = client.get("/api/profile/resume/parsed")
        assert resp.status_code == 200
        data = resp.json()
        assert data["full_name"] == "Test User"
        assert data["location"] == "Toronto"
        assert data["raw_text"] == "raw resume text"

    @patch("services.resume_parser.parse_resume_text", new_callable=AsyncMock)
    @patch("utils.pdf_parser.extract_text_from_pdf")
    @patch("utils.storage.get_resume_signed_url")
    @patch("routers.profile._get_or_create_profile", new_callable=AsyncMock)
    def test_parse_resume_full_flow(
        self,
        mock_get: AsyncMock,
        mock_signed_url: MagicMock,
        mock_extract: MagicMock,
        mock_parse: AsyncMock,
    ) -> None:
        from schemas.profile import ParsedResume

        profile = _mock_profile(raw_resume_url="user/resume.pdf")
        mock_get.return_value = profile
        mock_signed_url.return_value = "https://storage.example.com/signed"
        mock_extract.return_value = "John Doe\nSoftware Engineer\n..."

        parsed_result = ParsedResume(
            full_name="John Doe",
            summary="Software Engineer",
            raw_text="John Doe\nSoftware Engineer\n...",
        )
        mock_parse.return_value = parsed_result

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.content = b"%PDF-1.4 fake pdf"

            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=None)
            mock_client_cls.return_value = mock_client

            resp = client.post("/api/profile/resume/parse")

        assert resp.status_code == 200
        data = resp.json()
        assert data["full_name"] == "John Doe"
        assert profile.parsed_resume is not None
