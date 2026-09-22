# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Auto-apply is a SaaS platform (Repo 1 of 2) that helps job seekers find and auto-apply to jobs using AI. The backend is a FastAPI API server with Redis-based background workers. The frontend is a React SPA. A separate repo (`apply-agents`) runs browser-based agent workers that consume tasks from a shared Redis queue.

## Dev Commands

All commands run from repo root. Run `make help` for the full list.

```bash
make install                                  # Install all deps (backend + frontend)
make services                                 # Start Docker (Redis)
make dev                                      # FastAPI server (port 8000)
make fe-dev                                   # Frontend dev server (port 5173)
make test                                     # Run all backend tests
make test-file F=test_auth                    # Single test file
make test-one F=test_auth T=test_health       # Single test function
make lint                                     # Lint everything (backend + frontend)
make format                                   # Format everything (backend + frontend)
make typecheck                                # Frontend TypeScript check
make migrate                                  # Alembic upgrade head
make fetch-worker                             # Job fetch worker
make score-worker                             # Scoring worker
make enrich-worker                            # Enrichment worker
```

## Architecture

### Backend (`backend/`)

**Request flow:** FastAPI routers → services → SQLAlchemy async models → Supabase Postgres

- `main.py` — App factory (`create_app()`), mounts all routers under `/api` prefix
- `config.py` — Pydantic Settings loaded from `backend/.env`, accessed via `get_settings()` (lru_cached singleton)
- `deps.py` — FastAPI dependency injection: `CurrentUser` (JWT via Supabase), `AdminUser`, `DbSession`, `SettingsDep`, `verify_internal_api_key` (agent→platform auth via `X-Internal-API-Key` header)
- `db/session.py` — Async SQLAlchemy engine + `get_db()` session generator with auto-commit/rollback

**Routers:** `health`, `auth`, `profile`, `jobs`, `auto_apply`, `dashboard`, `applications` (includes `internal_router` and `scheduler_router`), `sse`, `admin`, `billing`

**Services:** Business logic layer — `auto_apply_service`, `queue_service` (Redis RPUSH), `resume_parser` (PDF→Claude→JSON), `application_service`, `ats_registry_service`

**Workers** (`workers/`): Three standalone Redis queue workers that extend `BaseWorker[T]` (pop-process-retry loop with heartbeat, DLQ, structured logging):
- `fetch.py` — Fetches jobs from Active Jobs DB API (RapidAPI)
- `enrich.py` — LLM-based job description enrichment
- `score.py` — LLM-based job scoring against user profiles

Worker infrastructure lives in `infra/`: `redis_pool`, `task_queue`, `dlq_service`, `worker_heartbeat`, `logging_config`

**Models** (SQLAlchemy): `User`, `Profile`, `Job`, `Application`, `AutoApplyConfig`, `JobMatchScore`, `Document`, `Subscription`, `AtsRegistry`

### Frontend (`frontend/`)

React 19 + Vite + TypeScript + Tailwind CSS 4 + shadcn/ui

- **Routing:** TanStack Router (`src-v2/router.tsx`) — routes wrap pages in `ProtectedRoute` + `DashboardLayout`, admin routes use `AdminRoute`
- **Data fetching:** TanStack Query via custom hooks in `src-v2/hooks/` (e.g., `use-jobs.ts`, `use-profile.ts`)
- **Auth state:** Zustand store (`src-v2/stores/auth-store.ts`) + Supabase JS client (`src-v2/lib/supabase.ts`)
- **API client:** `src-v2/lib/api.ts` — auto-attaches Supabase JWT to all requests, base URL from `VITE_API_URL`
- **UI components:** shadcn/ui in `src-v2/components/ui/`, custom components alongside pages

### Integration with apply-agents

The platform pushes `ApplyTask` objects to Redis (`auto_apply:tasks` via RPUSH). Agent workers in the separate `apply-agents` repo consume via LPOP, run browser automation, and POST `ApplyResult` back to `POST /api/internal/applications/result` authenticated with `X-Internal-API-Key`.

## Hard Rules

- **All DB operations must be async** — no synchronous SQLAlchemy in route handlers
- **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to frontend or logs
- **JWT verification required** on all user-facing endpoints (`CurrentUser` dependency)
- **Internal agent endpoints** use `INTERNAL_API_KEY` header, not JWT
- **Never commit `.env` files**

## Testing Patterns

Tests use `FastAPI TestClient` with synchronous calls. External services (Supabase auth, Redis) are mocked with `unittest.mock.patch`. `pytest-asyncio` is configured with `asyncio_mode = "auto"`. Tests live in `backend/tests/`.

## Code Quality

- ruff: `line-length = 100`, `target-version = "py312"`, lint rules: `E,F,I,UP,N,S,B,A,C4,T20,RET,SIM`, `S101` (assert) ignored for tests
- mypy: strict mode, `ignore_missing_imports = true`
- Frontend: ESLint + Prettier + TypeScript strict

## Workflow

1. Read `CHANGELOG.md` to understand recent changes
2. Run `/develop` to load coding conventions and branch workflow
3. Create feature branch from `main` (`feat/`, `fix/`, `chore/`, `hotfix/`)
4. Implement, test, commit with `<type>: <description>` format
5. Update `CHANGELOG.md` with changes made
6. Push and create PR to `main`

## Environment

Backend: `backend/.env` (see `backend/.env.example`). Key vars: `DATABASE_URL`, `REDIS_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `INTERNAL_API_KEY`

Frontend: `frontend/.env.local` with `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
