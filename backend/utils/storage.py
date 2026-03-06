import logging
from uuid import UUID

from utils.supabase import get_supabase

logger = logging.getLogger(__name__)

RESUMES_BUCKET = "resumes"


def _ensure_bucket_exists(supabase) -> None:
    """Create the resumes bucket if it doesn't exist.

    Handles cases where get_bucket or create_bucket fail due to RLS policies
    or race conditions. If both fail, we proceed anyway and let the upload
    itself surface any real permission issues.
    """
    try:
        supabase.storage.get_bucket(RESUMES_BUCKET)
        return
    except Exception:
        pass

    try:
        logger.info("Creating storage bucket '%s'", RESUMES_BUCKET)
        supabase.storage.create_bucket(RESUMES_BUCKET, options={"public": False})
    except Exception as exc:
        # Bucket may already exist, or we lack permission to create buckets.
        # Either way, proceed — the upload call will fail clearly if the
        # bucket truly doesn't exist or we lack access.
        logger.warning(
            "Could not verify/create bucket '%s': %s. "
            "Proceeding — ensure the bucket exists in your Supabase dashboard.",
            RESUMES_BUCKET,
            exc,
        )


def upload_resume(user_id: UUID, file_bytes: bytes, content_type: str = "application/pdf") -> str:
    supabase = get_supabase()
    _ensure_bucket_exists(supabase)
    path = f"{user_id}/resume.pdf"

    supabase.storage.from_(RESUMES_BUCKET).upload(
        path=path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": True},
    )

    return path


def get_resume_signed_url(path: str, expires_in: int = 3600) -> str:
    supabase = get_supabase()
    result = supabase.storage.from_(RESUMES_BUCKET).create_signed_url(path, expires_in)
    if isinstance(result, dict):
        return result.get("signedURL") or result.get("signedUrl") or ""
    return ""
