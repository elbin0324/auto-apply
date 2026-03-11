import logging
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import AuthApiError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import Settings, get_settings
from db.session import get_db
from models.user import User

logger = logging.getLogger(__name__)

# ── Settings ──────────────────────────────────────────────────────────────────

SettingsDep = Annotated[Settings, Depends(get_settings)]

# ── Database ──────────────────────────────────────────────────────────────────

DbSession = Annotated[AsyncSession, Depends(get_db)]

# ── Auth ──────────────────────────────────────────────────────────────────────

_bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    db: DbSession,
) -> User:
    """Verify Supabase JWT and return the local User row."""
    from utils.supabase import get_supabase  # local import avoids circular import at module load

    token = credentials.credentials
    supabase = get_supabase()

    try:
        user_response = supabase.auth.get_user(token)
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    auth_user = user_response.user
    if not auth_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.supabase_uid == auth_user.id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found — sign up first",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


# ── SSE auth (query-param JWT — EventSource can't set headers) ───────────────


async def get_sse_user(
    token: Annotated[str, Query()],
    db: DbSession,
) -> User:
    """Verify Supabase JWT from a query parameter. Same logic as get_current_user."""
    from utils.supabase import get_supabase

    supabase = get_supabase()

    try:
        user_response = supabase.auth.get_user(token)
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )

    auth_user = user_response.user
    if not auth_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    result = await db.execute(select(User).where(User.supabase_uid == auth_user.id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found — sign up first",
        )

    return user


SSEUser = Annotated[User, Depends(get_sse_user)]


# ── Admin auth ────────────────────────────────────────────────────────────────


async def require_admin(user: CurrentUser) -> User:
    """Require the current user to have the 'admin' role."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


AdminUser = Annotated[User, Depends(require_admin)]

# ── Internal API key auth ─────────────────────────────────────────────────────


async def verify_internal_api_key(
    x_internal_api_key: Annotated[str, Header()],
    settings: SettingsDep,
) -> None:
    """Verify INTERNAL_API_KEY for agent → platform requests.

    Agents send the key in the X-Internal-API-Key header.
    """
    if x_internal_api_key != settings.internal_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal API key",
        )
