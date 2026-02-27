# Agent Memory — auto-apply Project

> Persistent memory across sessions. Update this file when new stable patterns are confirmed.
> Lines after 200 are truncated — keep this concise and link to topic files for details.

## Project Identity
- **Repo:** `auto-apply` (Repo 1/2 — platform, not agent workers)
- **Goal:** SaaS auto-job-application platform
- **Current focus:** Backend API (FastAPI) implementation
- **Architecture:** `aiapply-clone-implementation-plan.md`

## Current State (2026-02-27)
- Project scaffold complete — all planning/agent-prep documents created
- No backend Python code written yet — Phase 1 is next
- All external accounts/API keys still need to be created by human (see `docs/user-setup-tasks.md`)
- Dev skill `/auto-apply-dev` available at `.claude/skills/auto-apply-dev.md`

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
_Populated as patterns are confirmed during implementation._

## API Quirks
_Populated as external API behavior is discovered._

## Bugs Found & Fixed
_Populated during implementation._

## Topic Files
- `memory/patterns.md` — Confirmed code patterns (empty until Phase 1 complete)
- `memory/api-quirks.md` — External API behavior notes (empty until APIs used)
