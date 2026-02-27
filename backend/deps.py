from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import Settings, get_settings

# ── Settings ──────────────────────────────────────────────────────────────────

SettingsDep = Annotated[Settings, Depends(get_settings)]

# ── Auth ──────────────────────────────────────────────────────────────────────

_bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    settings: SettingsDep,
) -> dict:
    """Verify Supabase JWT and return user dict. Implemented in Phase 4."""
    # TODO Phase 4: verify JWT with Supabase, return user
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Auth not implemented yet — coming in Phase 4",
    )


CurrentUser = Annotated[dict, Depends(get_current_user)]

# ── Internal API key auth ─────────────────────────────────────────────────────


async def verify_internal_api_key(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(HTTPBearer())],
    settings: SettingsDep,
) -> None:
    """Verify INTERNAL_API_KEY for agent → platform requests."""
    if credentials.credentials != settings.internal_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal API key",
        )
