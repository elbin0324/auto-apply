# CLAUDE.md — auto-apply

Auto-apply is a SaaS platform (Repo 1 of 2) that helps job seekers find and auto-apply to jobs using AI. The backend is a FastAPI API server with an arq background worker. The frontend is a React SPA. A separate repo (`apply-agents`) runs browser-based agent workers that consume tasks from a shared Redis queue.

---

## Architecture

```
auto-apply/
├── backend/
│   ├── main.py              App factory, mounts routers
│   ├── config.py            Pydantic Settings (loads .env)
│   ├── deps.py              Auth dependencies (JWT + internal key)
│   ├── worker.py            arq background worker
│   ├── routers/             API endpoints (health, auth, profile, jobs, auto_apply, applications, admin)
│   ├── models/              SQLAlchemy ORM (11 tables)
│   ├── schemas/             Pydantic request/response models
│   ├── services/            Business logic (auto_apply, queue, resume_parser)
│   ├── workers/             Background processors (fetch, enrich, score)
│   │   ├── queues/          Per-worker queue implementations
│   │   └── services/        Worker-specific services (job_fetch, enrichment, scoring)
│   ├── infra/               Infrastructure (logging, Redis pool, DLQ, heartbeat)
│   ├── db/                  Engine, session, Alembic migrations
│   ├── utils/               Supabase client, storage, PDF parsing
│   └── tests/               pytest suite
├── frontend/                React 19 + Vite + TypeScript + shadcn/ui + TanStack
├── docker-compose.yml       Redis 7 for local dev
├── Makefile                 Dev commands (delegates to backend/)
├── CHANGELOG.md             Structured change log
└── CLAUDE.md                This file
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.12+) |
| ORM | SQLAlchemy 2.0 async |
| Migrations | Alembic |
| Database | Supabase (Postgres 15) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |
| Queue | Redis 7 + arq |
| AI | Anthropic Claude API |
| Frontend | React 19, Vite, Tailwind CSS 4, shadcn/ui, TanStack Query/Router |
| Package Mgmt | Poetry (backend), pnpm (frontend) |

## Hard Rules

- **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to frontend or logs
- **Never store passwords** — Supabase handles auth entirely
- **All DB operations must be async** — no synchronous SQLAlchemy in route handlers
- **JWT verification required** on all user-facing endpoints (`get_current_user` dep)
- **Internal agent endpoints** use `INTERNAL_API_KEY` header, not JWT
- **Never commit `.env` files** — use `.env.example` with placeholder values

## Dev Commands

```bash
docker-compose up -d                          # Start Redis
cd backend && make dev                        # FastAPI server (port 8000)
cd backend && make worker-dev                 # arq worker with reload
cd backend && make test                       # Run tests
cd backend && poetry run alembic upgrade head  # Apply migrations
cd backend && poetry run ruff check .         # Lint
cd frontend && pnpm dev                       # Frontend (port 5173)
cd frontend && pnpm build                     # Production build
cd frontend && pnpm typecheck                 # Type check
open http://localhost:8000/docs               # API docs
```

## Workflow

1. Read `CHANGELOG.md` to understand recent changes
2. Run `/develop` to load coding conventions and branch workflow
3. Create feature branch from `dev` (`feat/`, `fix/`, `chore/`, `hotfix/`)
4. Implement, test, commit with `<type>: <description>` format
5. Update `CHANGELOG.md` with changes made
6. Push and create PR to `dev`

## Environment

Backend `.env` location: `backend/.env` (see `backend/.env.example`)

```
REDIS_URL=redis://localhost:6379
ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

Frontend env: `frontend/.env.local`

```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=<your-project-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## Reference Files

| File | Purpose |
|------|---------|
| `CHANGELOG.md` | Change history |
| `IMPLEMENTATION_STATUS.md` | Current build state |
| `memory/MEMORY.md` | Persistent agent memory |
| `docs/backend-todo.md` | Backend task tracking |
| `aiapply-clone-implementation-plan.md` | Full architecture reference |
