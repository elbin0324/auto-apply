# CLAUDE.md — auto-apply Project

This file is automatically loaded by Claude Code at the start of every session.
It contains project-wide instructions, conventions, and current status for AI agents.

---

## Project Overview

**auto-apply** is a SaaS platform (Repo 1 of 2) that helps job seekers find and auto-apply to jobs using AI.

- **Full architecture:** `aiapply-clone-implementation-plan.md`
- **Backend implementation todo:** `docs/backend-todo.md`
- **User setup tasks (accounts, keys, MCP servers):** `docs/user-setup-tasks.md`
- **Current implementation status:** `IMPLEMENTATION_STATUS.md`

---

## Current Focus

**Phase:** Backend API implementation (FastAPI)
**Active phase in todo:** Check `docs/backend-todo.md` for current phase

**Always check `IMPLEMENTATION_STATUS.md` at the start of a session to understand what's been built.**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.12+) |
| ORM | SQLAlchemy 2.0 async |
| Migrations | Alembic |
| Database | Supabase (Postgres 15) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |
| Queue | Redis + arq |
| AI | Anthropic Claude API |
| Payments | Stripe |
| Frontend (later) | Nuxt 3 (Vue 3) |

---

## Repository Structure

```
auto-apply/
├── CLAUDE.md                        ← You are here
├── IMPLEMENTATION_STATUS.md         ← Current build state
├── aiapply-clone-implementation-plan.md  ← Full architecture reference
├── docs/
│   ├── backend-todo.md              ← Incremental backend tasks
│   └── user-setup-tasks.md         ← Accounts/keys/MCP setup for human
├── .claude/
│   └── skills/
│       └── auto-apply-dev.md        ← /auto-apply-dev skill
├── memory/
│   ├── MEMORY.md                    ← Agent memory (persistent)
│   └── *.md                         ← Topic-specific memory files
├── backend/                         ← FastAPI backend (build this first)
│   ├── main.py
│   ├── config.py
│   ├── deps.py
│   ├── routers/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── db/
│   └── utils/
├── frontend/                        ← Nuxt 3 (build after backend)
├── docker-compose.yml
└── Makefile
```

---

## Agent Workflow Instructions

### Starting a session
1. Read `IMPLEMENTATION_STATUS.md` to understand current state
2. Read `docs/backend-todo.md` to find current phase and next unchecked task
3. Use `/auto-apply-dev` skill for project-specific context and preferences

### During a session
- Mark tasks `[~]` when starting, `[x]` when complete in `docs/backend-todo.md`
- Keep changes focused — implement one logical unit at a time
- Run tests after each significant change
- Never skip writing the corresponding Pydantic schemas before routes

### Ending a session
1. Update `docs/backend-todo.md` — mark completed items, add notes
2. Update `IMPLEMENTATION_STATUS.md` — record what was built
3. Update `memory/MEMORY.md` if new patterns or decisions were discovered
4. Commit changes with a descriptive message

---

## Hard Rules (Non-Negotiable)

- **Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend code**
- **Never store passwords** — Supabase handles auth entirely
- **Always verify Stripe webhook signatures** before processing events
- **All DB operations must be async** — no synchronous SQLAlchemy in route handlers
- **JWT verification required** on all user-facing endpoints (use `get_current_user` dep)
- **Internal agent endpoints** use `INTERNAL_API_KEY` header, not JWT
- **Never commit `.env` files** — use `.env.example` with placeholder values

---

## Environment Variables

See `docs/user-setup-tasks.md` Section 3 for full `.env` checklist.

Backend `.env` file location: `backend/.env`

Local development defaults:
```
REDIS_URL=redis://localhost:6379
ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

---

## Development Commands

```bash
# Start local services
docker-compose up -d

# Backend dev server
cd backend && make dev

# Run tests
cd backend && make test

# Run migrations
cd backend && make migrate

# Generate new migration
cd backend && alembic revision --autogenerate -m "description"

# API docs
open http://localhost:8000/docs
```

---

## Skill Available

Use `/auto-apply-dev` to activate the project skill, which provides:
- Full project context and preferences
- Dos and don'ts for this codebase
- Phase workflow instructions
- End-of-session update requirements
- External API notes and quirks
