from functools import lru_cache

from supabase import Client, create_client

from config import get_settings


@lru_cache
def get_supabase() -> Client:
    """Shared client for auth operations. Do NOT use for storage — use get_supabase_storage()."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_supabase_storage() -> Client:
    """Fresh client for storage operations.

    NOT cached — avoids the GoTrueClient in the shared client overwriting
    the Authorization header (service_role_key → user session token) after
    auth operations like sign_up / sign_in, which causes intermittent RLS
    errors on storage uploads.
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
