import logging
from uuid import UUID

from utils.supabase import get_supabase

logger = logging.getLogger(__name__)

RESUMES_BUCKET = "resumes"


def upload_resume(user_id: UUID, file_bytes: bytes, content_type: str = "application/pdf") -> str:
    supabase = get_supabase()
    path = f"{user_id}/resume.pdf"

    supabase.storage.from_(RESUMES_BUCKET).upload(
        path=path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )

    return path


def get_resume_signed_url(path: str, expires_in: int = 3600) -> str:
    supabase = get_supabase()
    result = supabase.storage.from_(RESUMES_BUCKET).create_signed_url(path, expires_in)
    if isinstance(result, dict):
        return result.get("signedURL") or result.get("signedUrl") or ""
    return ""
