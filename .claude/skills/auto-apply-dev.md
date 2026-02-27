# Auto-Apply Dev Skill

You are an expert agent developer working on the **auto-apply** project — a SaaS platform that helps job seekers auto-apply to jobs using AI.

When this skill is invoked, activate the following operating mode for this conversation:

---

## Project Context

- **Repo:** `auto-apply` (Repo 1 of 2 — the platform, not the agent workers)
- **Stack:** FastAPI (Python 3.12+) · SQLAlchemy 2.0 · Alembic · Supabase · Redis/arq · Anthropic Claude API · Nuxt 3 (Vue 3) · Stripe
- **Architecture doc:** `aiapply-clone-implementation-plan.md`
- **Backend todo:** `docs/backend-todo.md`
- **User setup tasks:** `docs/user-setup-tasks.md`
- **Implementation status:** `IMPLEMENTATION_STATUS.md`
- **CLAUDE.md:** Root project instructions

---

## Developer Preferences

### Code Style
- Use Python 3.12+ syntax (union types with `|`, `match` statements, etc.)
- All FastAPI route functions must be `async`
- Use SQLAlchemy 2.0 style (`select()`, `session.execute()`, not legacy `session.query()`)
- Pydantic v2 — use `model_config = ConfigDict(from_attributes=True)` not `class Config`
- Use type hints everywhere — no untyped functions
- Keep route handlers thin — business logic lives in `services/`, not routers
- Prefer explicit over clever — this codebase will be maintained by AI agents

### Naming Conventions
- Files: `snake_case.py`
- Classes: `PascalCase`
- Functions/variables: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- Database columns: `snake_case`
- API routes: `kebab-case` (e.g. `/api/auto-apply/config`)

### Dos
- Always read the relevant todo file before starting work on a phase
- Write tests alongside implementation (not after)
- Use dependency injection via FastAPI `Depends()` for db sessions, current user, etc.
- Return typed Pydantic response models from all endpoints
- Use `async with` for DB sessions — never leave sessions unclosed
- Log meaningful events with structured logging (include `user_id`, `job_id`, etc.)
- Commit migrations as part of the same PR as the model changes
- Use `Annotated` type hints for FastAPI dependencies (cleaner signature)
- Verify endpoints in `/docs` (Swagger UI) after implementing

### Don'ts
- Don't use `session.query()` — use SQLAlchemy 2.0 `select()` style
- Don't store passwords — Supabase handles auth entirely
- Don't expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend ever
- Don't use synchronous functions inside async route handlers (use `run_in_executor` if needed)
- Don't hardcode values that should be config (URLs, limits, timeouts)
- Don't use `SELECT *` — always select specific columns or use ORM models
- Don't skip error handling on external API calls (Adzuna, Stripe, Anthropic can all fail)
- Don't add docstrings or comments to code that is self-evident
- Don't create abstractions for one-time use — keep it simple
- Don't use `git commit --no-verify`

### Security Rules
- Validate all user input at schema level (Pydantic)
- Use Supabase JWT verification for all protected endpoints — never trust user-supplied user IDs
- Internal agent endpoints use `INTERNAL_API_KEY` header auth, not JWT
- Never log sensitive data (API keys, tokens, SSNs, etc.)
- Stripe webhook signature must be verified before processing
- All file uploads: validate MIME type + size server-side, not just client-side
- RLS policies on all Supabase tables — defence in depth

---

## Branch Strategy

### Long-Lived Branches

| Branch | Purpose | Direct commits? |
|--------|---------|----------------|
| `main` | Production-ready code only. Tagged releases. | Never — PRs only |
| `dev` | Integration branch. Stable but may be ahead of main. | Never — PRs only |

### Phase Branches
Each backend phase gets its own branch cut from `dev`:

```
dev
 └── phase/1-scaffold         ← Phase 1: Project Scaffold
 └── phase/2-models           ← Phase 2: DB Models & Migrations
 └── phase/3-schemas          ← Phase 3: Pydantic Schemas
 └── phase/4-auth             ← Phase 4: Auth
 └── phase/5-profile          ← Phase 5: Profile API
 └── phase/6-jobs             ← Phase 6: Jobs API & Adzuna
 └── phase/7-auto-apply       ← Phase 7: Auto-Apply Config
 └── phase/8-applications     ← Phase 8: Applications
 └── phase/9-documents        ← Phase 9: Document Generation
 └── phase/10-billing         ← Phase 10: Billing & Stripe
 └── phase/11-hardening       ← Phase 11: Hardening & Prod
```

Hotfixes cut from `main`, merge back to both `main` and `dev`:
```
main
 └── hotfix/brief-description
```

### Branch Naming Rules
- Phase branches: `phase/N-short-name` (e.g. `phase/4-auth`)
- Feature branches (mid-phase additions): `feat/short-description`
- Bugfix branches: `fix/short-description`
- Hotfixes: `hotfix/short-description`
- All lowercase, hyphens only, no spaces

---

## Version Control Workflow

### Starting a New Phase

**Before writing any code**, run these steps in order:

```bash
# 1. Make sure dev is up to date
git checkout dev
git pull origin dev

# 2. Create and check out the phase branch
git checkout -b phase/N-short-name
# e.g: git checkout -b phase/1-scaffold

# 3. Confirm you're on the right branch
git branch --show-current
```

Do not start implementation until you have confirmed you are on the correct phase branch.

### During a Phase — Checkpoint Commits

At each **numbered checkpoint** defined in `docs/backend-todo.md` (the bolded "Checkpoint:" lines), create a commit. Do not wait until the end of a phase — commit at each checkpoint.

**Commit message format:**
```
phase(N): checkpoint description

- bullet summarising key changes
- bullet summarising key changes

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Examples:**
```
phase(1): scaffold — server starts and health endpoint returns 200

- FastAPI app factory with CORS and lifespan
- Pydantic Settings loading all env vars
- GET /api/health returns {"status": "ok", "version": "0.1.0"}
- Makefile with dev, test, migrate, lint targets

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

```
phase(2): all migrations applied, tables verified in DB

- SQLAlchemy 2.0 async engine and session factory
- Declarative base with timestamp mixin
- Models: User, Profile, Experience, Education, Skill, Job, Application, GeneratedDocument, Subscription, CreditTransaction, AutoApplyConfig
- Initial Alembic migration applied to Supabase DB

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**When to commit (at minimum):**
- When a phase checkpoint is reached
- When a complex sub-task is complete and tests pass
- Before switching context or ending a session (even if mid-phase — use WIP prefix)

**WIP commits** (when stopping mid-phase):
```
WIP phase(N): brief description of state

Not complete — stopping here. Next: describe what's left.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### Staging Files for Commits

Always stage files explicitly — never use `git add -A` or `git add .`:

```bash
# Stage specific files
git add backend/main.py backend/config.py backend/deps.py

# Stage a whole new directory
git add backend/models/

# Review what's staged before committing
git diff --staged --stat
```

Files to never commit:
- `.env` or any file containing secrets
- `__pycache__/`, `*.pyc`, `.mypy_cache/`, `.pytest_cache/`
- `backend/.venv/` or any virtual environment directory

### Completing a Phase — Merge to dev

When all tasks in a phase are marked `[x]` and all tests pass:

```bash
# 1. Final commit on phase branch (if any uncommitted changes)
git add <specific files>
git commit -m "phase(N): complete — all tasks done, tests passing"

# 2. Push phase branch to remote
git push origin phase/N-short-name

# 3. Switch to dev and pull latest
git checkout dev
git pull origin dev

# 4. Merge phase branch into dev (no fast-forward — preserve branch history)
git merge --no-ff phase/N-short-name -m "Merge phase/N-short-name into dev

Phase N complete: [brief description of what was built]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

# 5. Push dev
git push origin dev

# 6. Optionally delete phase branch after merge
git branch -d phase/N-short-name
git push origin --delete phase/N-short-name
```

### Merging dev → main (Production Releases)

Only merge `dev` into `main` when a stable, deployable milestone is reached (e.g. after Phase 4 auth complete, or after Phase 10 billing complete). **Always ask the user before merging to main.**

```bash
# Do NOT do this autonomously — confirm with user first
git checkout main
git pull origin main
git merge --no-ff dev -m "Release vX.Y.Z: brief description"
git tag -a vX.Y.Z -m "vX.Y.Z: brief description"
git push origin main --tags
```

### Hotfixes (Production Bugs)

```bash
# 1. Cut from main
git checkout main
git pull origin main
git checkout -b hotfix/brief-description

# 2. Fix, commit
git add <specific files>
git commit -m "fix: brief description of what was fixed"

# 3. Merge into main
git checkout main
git merge --no-ff hotfix/brief-description -m "Hotfix: brief description"
git tag -a vX.Y.Z+1 -m "Hotfix vX.Y.Z+1"
git push origin main --tags

# 4. Merge hotfix into dev too (keep dev in sync)
git checkout dev
git merge --no-ff hotfix/brief-description -m "Merge hotfix into dev"
git push origin dev

# 5. Delete hotfix branch
git branch -d hotfix/brief-description
git push origin --delete hotfix/brief-description
```

### Resolving Merge Conflicts

When a conflict occurs, resolve it — never discard changes without reading them first:

```bash
# See what's conflicting
git status

# After resolving conflicts in files
git add <resolved-files>
git commit -m "resolve merge conflicts: brief description"
```

Never use `git checkout -- .` or `git restore .` to escape a conflict — that discards work.

### Version Control Guardrails (Non-Negotiable)

- Never force-push to `main` or `dev` — if a force push seems needed, stop and ask the user
- Never commit `.env` files — verify `.gitignore` before first commit on a new machine
- Never use `git commit --no-verify` — fix failing hooks instead
- Never amend a commit that has already been pushed to a shared branch
- Always `git pull` before starting work on an existing branch
- One logical unit of work per commit — don't bundle unrelated changes

---

## Phase Workflow

### Starting a Phase

1. **Read** `docs/backend-todo.md` — identify current phase and unchecked items
2. **Read** `IMPLEMENTATION_STATUS.md` — understand what's already built
3. **Read** `CLAUDE.md` — check for updated instructions
4. **Branch** — create `phase/N-short-name` from `dev` (see Version Control above)
5. **Implement** tasks in order within the phase, committing at each checkpoint
6. **Test** — run `make test` after each significant task
7. **Update** `docs/backend-todo.md` — mark tasks `[x]` as they complete
8. **Update** `IMPLEMENTATION_STATUS.md` — record what was built
9. **Merge** — merge phase branch to `dev` when all tasks done (see above)
10. **Summarize** — briefly state what was completed and what comes next

### Commit Cadence Summary

| Event | Action |
|-------|--------|
| Checkpoint reached | Commit with `phase(N): checkpoint description` |
| Phase complete | Final commit + merge to `dev` |
| End of session (mid-phase) | WIP commit, push branch |
| Production milestone reached | Confirm with user → merge `dev` to `main` + tag |
| Production bug found | Hotfix branch from `main`, merge to both |

---

## After Each Chat / Phase — Required Updates

At the end of every conversation where implementation work was done, you MUST:

1. **Commit any uncommitted changes** — at minimum a WIP commit if mid-phase

2. **Update `docs/backend-todo.md`:**
   - Mark all completed items `[x]`
   - Mark in-progress items `[~]`
   - Add any newly discovered sub-tasks
   - Add a note in the Notes/Decisions Log with date and key decisions

3. **Update `IMPLEMENTATION_STATUS.md`:**
   - Update the "Last Updated" date
   - Move completed phases to "Completed" section
   - Add any new files created to the file manifest
   - Record any architectural decisions or deviations from the plan

4. **Update memory files** (`memory/MEMORY.md` and topic files):
   - Record any project-specific patterns discovered
   - Record any bugs found and fixed
   - Record any external API quirks (Supabase, Adzuna, Stripe behavior)

---

## Common Commands

```bash
# Start development server
cd backend && make dev
# or: uvicorn main:app --reload --port 8000

# Run tests
cd backend && make test
# or: pytest tests/ -v

# Apply migrations
cd backend && make migrate
# or: alembic upgrade head

# Generate new migration
alembic revision --autogenerate -m "description_of_change"

# Start local services (Redis)
docker-compose up -d

# Check logs
docker-compose logs -f redis

# Stripe webhook listener (local dev)
stripe listen --forward-to localhost:8000/api/billing/webhooks/stripe

# Verify API
curl http://localhost:8000/api/health
open http://localhost:8000/docs
```

---

## Key File Locations

| Purpose | Path |
|---------|------|
| FastAPI app entry | `backend/main.py` |
| Config / env vars | `backend/config.py` |
| Dependency injection | `backend/deps.py` |
| SQLAlchemy models | `backend/models/` |
| Pydantic schemas | `backend/schemas/` |
| Route handlers | `backend/routers/` |
| Business logic | `backend/services/` |
| DB session | `backend/db/session.py` |
| Migrations | `backend/db/migrations/versions/` |
| Utils | `backend/utils/` |
| Tests | `backend/tests/` |
| Backend todo | `docs/backend-todo.md` |
| User setup | `docs/user-setup-tasks.md` |
| Impl status | `IMPLEMENTATION_STATUS.md` |
| Arch plan | `aiapply-clone-implementation-plan.md` |

---

## External API Notes

### Anthropic Claude API
- Model: `claude-sonnet-4-6` for most tasks (balance of speed/cost)
- Use `claude-opus-4-6` only for complex resume parsing or cover letter generation where quality matters
- Always set `max_tokens` explicitly
- Use structured output (JSON mode) via system prompt instruction — Claude doesn't have a native JSON mode in the SDK but responds reliably to "Return ONLY valid JSON"

### Adzuna API
- Base URL: `https://api.adzuna.com/v1/api/jobs`
- Canada jobs: country code `ca`
- Rate limit: 250 req/day on free tier — cache aggressively
- Job IDs are strings, store as `external_id TEXT UNIQUE`
- `redirect_url` is the canonical job apply URL

### Supabase
- Service role key bypasses RLS — only use in backend, never expose
- Storage signed URLs expire — generate fresh signed URLs on each request, don't cache them
- Auth JWT verification: use `supabase.auth.get_user(token)` to verify and extract user
- Postgres is at connection string, not Supabase REST — use SQLAlchemy directly for DB ops

### Stripe
- Always use webhook events as source of truth — don't trust client-side success callbacks
- Test mode uses `sk_test_` keys — safe to use in development
- Stripe CLI for local webhook testing: `stripe listen`
- Price IDs differ between test and production environments

---

## Architecture Decisions (Locked)

These decisions are final — do not propose changes to these:

1. **Supabase for Auth** — JWT verification only in backend; no custom auth system
2. **SQLAlchemy 2.0 async** — not Supabase Python client for DB queries
3. **arq (not Celery)** — async Redis queue, lighter weight for Python async stack
4. **Two repos** — `auto-apply` (platform) and `apply-agents` (workers) stay separate
5. **Credits per application** — one credit consumed per auto-apply task dispatched
6. **Internal API key** — agent workers authenticate to platform API with `INTERNAL_API_KEY`, not user JWTs
