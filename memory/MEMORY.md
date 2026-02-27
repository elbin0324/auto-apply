# Agent Memory — auto-apply Project

> Persistent memory across sessions. Update this file when new stable patterns are confirmed.
> Lines after 200 are truncated — keep this concise and link to topic files for details.

## Project Identity
- **Repo:** `auto-apply` (Repo 1/2 — platform, not agent workers)
- **Goal:** SaaS auto-job-application platform
- **Current focus:** Backend API (FastAPI) implementation
- **Architecture:** `aiapply-clone-implementation-plan.md`

## Current State (2026-02-27)
- Phase 1 (scaffold) complete: FastAPI app running, health endpoint verified
- Phase 2 (models): All 11 SQLAlchemy models defined, migration file written. BLOCKED on DATABASE_URL update
- Dev branch: `phase/1-scaffold` (note: also has Phase 2 commits, not yet merged to dev)
- Next session: update DATABASE_URL to Supabase, run `make migrate`, then start Phase 3

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
- `lazy="noload"` on all relationship()s by default — load explicitly when needed
- GIN index for jobs FTS: use `sa.text(...)` in Index for computed expression
- DATABASE_URL format: `postgresql+asyncpg://...` (not `postgresql://`)

## API Quirks
_Populated as external API behavior is discovered._

## Bugs Found & Fixed
_Populated during implementation._

## Topic Files
- `memory/patterns.md` — Confirmed code patterns (empty until Phase 1 complete)
- `memory/api-quirks.md` — External API behavior notes (empty until APIs used)
