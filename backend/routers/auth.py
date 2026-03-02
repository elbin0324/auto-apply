import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from supabase import AuthApiError
from sqlalchemy import select

from deps import DbSession, SettingsDep
from models.user import User
from schemas.user import TokenResponse, UserCreate, UserResponse
from utils.supabase import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: UserCreate, db: DbSession) -> UserResponse:
    """Create a new Supabase auth user and local User row."""
    supabase = get_supabase()
    try:
        auth_response = supabase.auth.sign_up({"email": body.email, "password": body.password})
    except AuthApiError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not auth_response.user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signup failed — no user returned",
        )

    auth_user = auth_response.user
    user = User(supabase_uid=auth_user.id, email=auth_user.email or body.email)
    db.add(user)
    await db.flush()
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(body: UserCreate) -> TokenResponse:
    """Sign in with email + password, return Supabase JWT."""
    supabase = get_supabase()
    try:
        auth_response = supabase.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except AuthApiError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    session = auth_response.session
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login failed — no session returned",
        )

    return TokenResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
    )


@router.post("/oauth/google")
async def oauth_google(settings: SettingsDep) -> dict:
    """Return the Supabase OAuth URL for Google sign-in."""
    supabase = get_supabase()
    response = supabase.auth.sign_in_with_oauth(
        {
            "provider": "google",
            "options": {"redirect_to": f"{settings.supabase_url}/auth/v1/callback"},
        }
    )
    return {"url": response.url}


@router.get("/oauth/callback")
async def oauth_callback(request: Request, db: DbSession) -> RedirectResponse:
    """Handle OAuth callback — Supabase exchanges the code server-side."""
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing code")

    supabase = get_supabase()
    try:
        auth_response = supabase.auth.exchange_code_for_session({"auth_code": code})
    except AuthApiError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    auth_user = auth_response.user
    if not auth_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth failed")

    # Upsert local user row
    result = await db.execute(select(User).where(User.supabase_uid == auth_user.id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(supabase_uid=auth_user.id, email=auth_user.email or "")
        db.add(user)
        await db.flush()

    session = auth_response.session
    access_token = session.access_token if session else ""
    return RedirectResponse(url=f"/?access_token={access_token}")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request) -> None:
    """Invalidate the current Supabase session."""
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.removeprefix("Bearer ").strip()
    if token:
        supabase = get_supabase()
        try:
            # Set session so sign_out revokes this specific token
            supabase.auth.admin.sign_out(token)
        except Exception:
            pass  # Best-effort logout


@router.get("/me", response_model=UserResponse)
async def me(request: Request, db: DbSession) -> UserResponse:
    """Return current user from JWT. Requires Authorization: Bearer <token>."""
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    supabase = get_supabase()
    try:
        user_response = supabase.auth.get_user(token)
    except AuthApiError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    auth_user = user_response.user
    if not auth_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.supabase_uid == auth_user.id))
    user = result.scalar_one_or_none()
    if not user:
        # Auto-create local user row (e.g. OAuth users who bypassed /signup)
        user = User(supabase_uid=auth_user.id, email=auth_user.email or "")
        db.add(user)
        await db.flush()

    return UserResponse.model_validate(user)
