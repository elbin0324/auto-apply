---
name: develop
description: Development conventions, branch workflow, and coding standards for auto-apply (backend + frontend). Use when implementing features, fixing bugs, or making any code changes.
disable-model-invocation: false
---

# Auto-Apply Development Guide

Unified conventions for backend (FastAPI/Python) and frontend (React/TypeScript).

---

## Branch Workflow

### Naming

| Prefix | Use |
|--------|-----|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `chore/` | Config, docs, tooling |
| `hotfix/` | Production fix from `main` |

All lowercase, hyphens only. Examples: `feat/billing-stripe`, `fix/resume-upload-timeout`.

### Create-from-dev Flow

```bash
git checkout dev && git pull origin dev
git checkout -b feat/my-feature
# ... implement, test, commit ...
git push -u origin feat/my-feature
gh pr create --base dev
```

### Commit Format

```
<type>: <description>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`

One logical unit per commit. Stage files explicitly — never `git add -A`.

### Guardrails

- Never force-push to `main` or `dev`
- Never commit `.env` files or secrets
- Never use `git commit --no-verify`
- Never amend pushed commits on shared branches
- Always `git pull` before starting work on an existing branch
- Branch protection hook blocks commits on `dev`/`main` — use feature branches

---

## Backend Conventions

### Python Code Style

- Python 3.12+ syntax (`X | Y` unions, `match` statements)
- All route functions `async`
- SQLAlchemy 2.0: `select()` + `session.execute()`, never `session.query()`
- Pydantic v2: `model_config = ConfigDict(from_attributes=True)`, not `class Config`
- Type hints on all functions
- Keep route handlers thin — business logic in services, not routers
- Explicit over clever — this codebase is maintained by AI agents

### Naming

- Files: `snake_case.py`
- Classes: `PascalCase`
- Functions/variables: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- DB columns: `snake_case`
- API routes: `kebab-case` (`/api/auto-apply/config`)

### Current Architecture

```
backend/
├── main.py              App factory, mounts routers
├── config.py            Pydantic Settings
├── deps.py              Auth dependencies (JWT + internal key)
├── worker.py            arq background worker
├── routers/             API endpoints
├── models/              SQLAlchemy ORM
├── schemas/             Pydantic request/response
├── services/            Business logic (auto_apply, queue, resume_parser)
├── workers/             Background task processors
│   ├── base.py          Worker base class
│   ├── fetch.py         Job fetch worker
│   ├── enrich.py        Enrichment worker
│   ├── score.py         Scoring worker
│   ├── queues/          Queue implementations per worker
│   └── services/        Worker-specific services
├── infra/               Infrastructure (logging, Redis, DLQ, heartbeat)
├── db/                  Engine, session, Alembic migrations
├── utils/               Supabase client, storage, PDF parsing
└── tests/               pytest test suite
```

### Testing

- Pattern: `app.dependency_overrides` for auth/DB + `@patch` for services
- Use `SimpleNamespace` for mock ORM objects (works with `from_attributes=True`)
- Run: `cd backend && poetry run pytest tests/ -x -v`
- Write tests alongside implementation, not after

### Don'ts

- Don't use synchronous functions in async handlers
- Don't hardcode values that should be config
- Don't skip error handling on external API calls
- Don't add docstrings to self-evident code
- Don't create abstractions for one-time use

---

## Frontend Conventions

### TypeScript Code Style

- TypeScript strict mode — no `any`
- React 19, function components only
- Named exports for components, default exports for pages
- Components under 150 lines — split if larger
- API calls in `hooks/` via TanStack Query, never in components
- Server state: TanStack Query. Client state: Zustand (global UI only)
- Forms: React Hook Form + Zod

### Naming

- Files: `kebab-case.tsx` (`job-card.tsx`, `use-profile.ts`)
- Components: `PascalCase`
- Hooks: `camelCase` with `use` prefix
- Types: `PascalCase`, no `I` prefix
- Constants: `UPPER_SNAKE_CASE`
- Routes: `kebab-case`

### Key Rules

- Use shadcn/ui as base — customize via Tailwind, not CSS overrides
- Use `cn()` utility for conditional classes
- Lazy-load route components
- Path aliases `@/` — never `../../..`
- Don't store server state in Zustand
- Don't use inline `style={}` unless Tailwind can't handle it
- Don't store tokens in localStorage — use Supabase session management

### Commands

```bash
cd frontend && pnpm dev        # Dev server (port 5173)
cd frontend && pnpm build      # Production build
cd frontend && pnpm typecheck  # Type check
cd frontend && pnpm lint       # ESLint
```

---

## Security Rules

These apply to both backend and frontend:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend or logs
- Never store passwords — Supabase handles auth
- All user endpoints require JWT (`get_current_user` dependency)
- Internal agent endpoints use `INTERNAL_API_KEY`, not JWT
- Validate all input at schema level (Pydantic / Zod)
- Verify Stripe webhook signatures before processing
- Never log API keys, tokens, or PII

---

## CHANGELOG

After completing work, update `CHANGELOG.md`:

```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- What was modified

### Fixed
- Bug that was fixed

### Removed
- What was deleted
```

Move `[Unreleased]` items to a dated section when merging to `dev`.
