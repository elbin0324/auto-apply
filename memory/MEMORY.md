# Agent Memory — auto-apply Project

> Persistent memory across sessions. Update this file when new stable patterns are confirmed.
> Lines after 200 are truncated — keep this concise and link to topic files for details.

## Project Identity
- **Repo:** `auto-apply` (Repo 1/2 — platform, not agent workers)
- **Goal:** SaaS auto-job-application platform
- **Current focus:** Backend API (FastAPI) implementation
- **Architecture:** `aiapply-clone-implementation-plan.md`

## Current State (2026-02-27)
- Phases 1–6 complete (scaffold, models, schemas, auth, profile API, jobs API)
- Branch: `phase/6-jobs` (all phase work here; `dev` branch behind — needs merge)
- Tests: 20 passing (3 auth + 17 profile) + new job tests
- Next: Phase 7 — see `docs/backend-todo.md`

## Key File Paths
- Backend todo: `docs/backend-todo.md`
- User setup checklist: `docs/user-setup-tasks.md`
- Build status: `IMPLEMENTATION_STATUS.md`
- Dev skill: `.claude/skills/auto-apply-dev.md`
- Backend env example: `backend/.env.example`
- Docker compose (local Redis): `docker-compose.yml`
- Makefile: `Makefile`

## Stack Decisions (Confirmed)
- Queue: `arq` (async Python, not Celery/BullMQ)
- DB access: SQLAlchemy 2.0 async (not Supabase Python client)
- Auth: Supabase JWT verified server-side
- Internal auth: `INTERNAL_API_KEY` header for agent→platform calls
- AI model: `claude-sonnet-4-6` default, `claude-opus-4-6` for quality-critical tasks
- Pydantic v2 (not v1)

## Code Patterns
- Poetry not system-installed — installed via `pip install poetry`
- `arq` requires `redis<6` — don't add `redis` explicitly, it's pulled transitively
- `greenlet` must be added explicitly as SQLAlchemy asyncio dependency
- Alembic env.py for async: use `asyncio.run()` + `create_async_engine` pattern
- Models use `Mapped[T]` + `mapped_column()` (SQLAlchemy 2.0 style), not Column()
- `lazy="noload"` on all relationship()s by default — load explicitly with `selectinload()` when needed
- GIN index for jobs FTS: use `sa.text(...)` in Index for computed expression
- DATABASE_URL format: `postgresql+asyncpg://...` (not `postgresql://`)
- Profile auto-creates on first access via `_get_or_create_profile` helper
- Bulk replace pattern for sub-collections: delete existing + insert new + flush
- Supabase storage is sync — use directly from async handlers (bounded file sizes)
- PDF text extraction: `pdfplumber` (import lazily inside function to avoid startup cost)
- Test pattern: `app.dependency_overrides` for auth/DB + `@patch` for internal helpers
- Use `SimpleNamespace` for mock ORM objects in tests (Pydantic `from_attributes=True` works with it)
- PG upsert: use `from sqlalchemy.dialects.postgresql import insert as pg_insert` — generic `sqlalchemy.insert` has no `on_conflict_do_update`. Use `index_elements=["col"]` for unique index conflicts or `constraint="constraint_name"` for named constraints.
- Heuristic scorer: pure functions (`score_job_for_user`) are unit-testable without DB; bulk scoring entry point (`compute_scores_for_sync`) loads users+profiles+skills in one query then loops — avoids N+1.
- Scores pre-computed after sync (not on-demand): better UX, bounded compute (250 jobs × N active users), stored in `job_match_scores` table.

## API Quirks
- Adzuna: job timestamp field is `created` (not `posted_at`); ISO format may use `Z` suffix — replace with `+00:00` for `fromisoformat()`. Job URL is under `redirect_url`. Company/location/category are nested objects with `display_name`/`label`/`tag` keys. Filter out jobs with empty `redirect_url` before upsert. Page results return empty list (not error) when past last page.

## Bugs Found & Fixed
_Populated during implementation._

## Topic Files
- `memory/patterns.md` — Confirmed code patterns (empty until Phase 1 complete)
- `memory/api-quirks.md` — External API behavior notes (empty until APIs used)
