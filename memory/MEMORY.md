# Agent Memory — auto-apply

> Persistent memory across sessions. Lines after 200 are truncated — keep concise.

## Project State (2026-03-04)

- ~85% backend complete. ~239 tests passing.
- Job source: Active Jobs DB API (migrated from JSearch, which replaced Adzuna)
- Scoring: LLM-based batched scoring (replaced heuristic scorer)
- Frontend: React 19 + Vite SPA, all pages built, UI polish done
- Deploy: Railway (backend + worker), Vercel (frontend)
- Not started: document generation (cover letters), billing (Stripe)

## Architecture Decisions (Locked)

1. **Supabase for Auth** — JWT verification only in backend
2. **SQLAlchemy 2.0 async** — not Supabase Python client for DB
3. **arq** (not Celery) — async Redis queue for Python async stack
4. **Two repos** — `auto-apply` (platform) + `apply-agents` (workers)
5. **Credits per application** — one credit per auto-apply task
6. **Internal API key** — agent workers use `INTERNAL_API_KEY`, not user JWTs
7. **Active Jobs DB API** — sole job source (Adzuna and ATS scraping removed)

## Code Patterns

- Poetry installed via `pip install poetry` (not system)
- `arq` requires `redis<6` — don't add `redis` explicitly
- `greenlet` must be added explicitly for SQLAlchemy asyncio
- Alembic async: `asyncio.run()` + `create_async_engine` pattern
- Models: `Mapped[T]` + `mapped_column()` (SQLAlchemy 2.0), not `Column()`
- `lazy="noload"` on all relationships — use `selectinload()` explicitly
- GIN index for FTS: `sa.text(...)` in Index
- DATABASE_URL: `postgresql+asyncpg://...` (not `postgresql://`)
- Profile auto-creates on first access via `_get_or_create_profile`
- Bulk replace for sub-collections: delete existing + insert new + flush
- Supabase storage is sync — safe from async handlers (bounded file sizes)
- PDF extraction: `pdfplumber` (lazy import to avoid startup cost)
- Test pattern: `app.dependency_overrides` for auth/DB + `@patch` for services
- `SimpleNamespace` for mock ORM objects (Pydantic `from_attributes=True` works)
- PG upsert: `from sqlalchemy.dialects.postgresql import insert as pg_insert`
- Workers organized under `backend/workers/` with `queues/` and `services/` subdirs
- Infrastructure (logging, Redis, DLQ) lives under `backend/infra/`

## API Notes

### Active Jobs DB API
- External job source via RapidAPI
- Returns job listings with company, location, description, apply URL
- Replaced both Adzuna API and ATS career page scraping

### Supabase
- Service role key bypasses RLS — backend only, never expose
- Storage signed URLs expire — generate fresh per request
- Auth JWT: `supabase.auth.get_user(token)` to verify + extract user
- DB via SQLAlchemy, not Supabase REST

### Google OAuth
- Callback flow: Supabase handles OAuth, backend verifies JWT after redirect
- Frontend redirects to Supabase auth URL, callback returns to app

### Anthropic Claude API
- Default model: `claude-sonnet-4-6` (speed/cost balance)
- `claude-opus-4-6` for quality-critical tasks (resume parsing, cover letters)
- Always set `max_tokens` explicitly
- JSON output: system prompt "Return ONLY valid JSON" (no native JSON mode)
