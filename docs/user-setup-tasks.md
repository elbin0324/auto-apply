# User Setup Tasks — Accounts, API Keys & MCP Servers

> Complete these tasks **before** starting agent-assisted development.
> Agents cannot create external accounts on your behalf — these require human verification (email, phone, payment).
> Once you have credentials, add them to `.env` (see `ENV_VARS.md`) and configure MCP servers below.

---

## Status Legend
- `[ ]` Not done
- `[x]` Done
- `[~]` In progress

---

## 1. Accounts to Create

### Supabase (Database + Auth + Storage)
- [x] Create account at https://supabase.com
- [x] Create new project — name it `auto-apply` (or `applyagent`)
- [x] Choose region closest to your users (e.g. `us-east-1` or `ca-central-1` for Canada focus)
- [x] **Collect from Dashboard → Settings → API:**
  - `SUPABASE_URL` (e.g. `https://xxxxx.supabase.co`)
  - `SUPABASE_ANON_KEY` (safe for frontend)
  - `SUPABASE_SERVICE_ROLE_KEY` (keep secret — backend only)
- [x] **Collect from Dashboard → Settings → Database:**
  - `DATABASE_URL` — use Connection Pooler (Transaction mode) URL, format: `postgresql+asyncpg://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
- [x] Enable Google OAuth: Dashboard → Authentication → Providers → Google
  - Requires Google Cloud Console OAuth app (step below)
- [x] Create Storage bucket: `resumes` (private, 10MB file limit, PDF only)
- [x] Create Storage bucket: `screenshots` (private)
- [x] Create Storage bucket: `documents` (private)

### Google Cloud Console (OAuth for Supabase)
- [x] Go to https://console.cloud.google.com
- [x] Create project (or reuse existing)
- [x] Enable "Google+ API" and "Google Identity"
- [x] Create OAuth 2.0 credentials → Web application
- [x] Add Authorized redirect URI: `https://[your-supabase-project].supabase.co/auth/v1/callback`
- [x] **Collect:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [x] Add these to Supabase → Auth → Providers → Google

### Anthropic (Claude API)
- [x] Create account at https://console.anthropic.com
- [x] Add payment method (usage-based billing)
- [x] Create API key: API Keys → Create Key → name it `auto-apply-dev`
- [x] **Collect:** `ANTHROPIC_API_KEY` (starts with `sk-ant-`)
- [ ] Recommended: Set a monthly spend limit in billing settings

### Adzuna (Job Data API)
- [x] Create account at https://developer.adzuna.com
- [x] Create a new application — name it `auto-apply`
- [x] **Collect:** `ADZUNA_APP_ID`, `ADZUNA_API_KEY`
- [x] Free tier: 250 requests/day — sufficient for development
- [x] Note: Canada jobs use country code `ca` in API calls

### Stripe (Payments)
- [x] Create account at https://stripe.com
- [x] Complete business verification (can use test mode initially)
- [x] **Collect from Dashboard → Developers → API Keys:**
  - `STRIPE_SECRET_KEY` (starts `sk_test_` for test, `sk_live_` for production)
  - `STRIPE_PUBLISHABLE_KEY` (starts `pk_test_` — used by frontend)
- [ ] Create Products + Prices in Stripe Dashboard:
  - Product: "Pro Plan" → recurring $19/month → **collect** `STRIPE_PRO_PRICE_ID`
  - Product: "Premium Plan" → recurring $39/month → **collect** `STRIPE_PREMIUM_PRICE_ID`
  - Product: "Credit Pack 10" → one-time $10 → **collect** `STRIPE_CREDITS_10_PRICE_ID`
  - Product: "Credit Pack 50" → one-time $40 → **collect** `STRIPE_CREDITS_50_PRICE_ID`
  - Product: "Credit Pack 100" → one-time $60 → **collect** `STRIPE_CREDITS_100_PRICE_ID`
  - Product: "Credit Pack 250" → one-time $120 → **collect** `STRIPE_CREDITS_250_PRICE_ID`
- [ ] Set up Stripe Webhook (local dev): install Stripe CLI → `stripe listen --forward-to localhost:8000/api/billing/webhooks/stripe`
- [ ] **Collect:** `STRIPE_WEBHOOK_SECRET` (from CLI output or dashboard endpoint)
- [ ] For production: add webhook endpoint in Dashboard → Developers → Webhooks

### Redis (Job Queue)
- [ x] **Local dev:** handled by `docker-compose.yml` — no account needed
- [ ] **Production options (choose one):**
  - [ ] **Railway** — add Redis service to same project as backend (simplest)
  - [ ] **Upstash** (https://upstash.com) — serverless Redis, generous free tier
  - [ ] **Redis Cloud** (https://redis.com/try-free/)
- [ ] **Collect:** `REDIS_URL` (e.g. `redis://default:password@host:6379`)

### Vercel (Frontend Hosting — for later)
- [ ] Create account at https://vercel.com (connect GitHub)
- [ ] Will be used when frontend (Nuxt) is built — not needed for backend phase
- [ ] **Collect when ready:** `VERCEL_TOKEN` (Account → Settings → Tokens)

### Railway or Fly.io (Backend Hosting — for later)
- [ ] **Railway** (recommended for simplicity): https://railway.app
  - Connect GitHub repo
  - Collect: `RAILWAY_TOKEN` from Account → Settings → API Tokens
- [ ] **OR Fly.io**: https://fly.io
  - Install `flyctl`, run `fly auth login`
  - Collect: `FLY_API_TOKEN`

### Sentry (Error Monitoring)
- [ ] Create account at https://sentry.io
- [ ] Create project → Python → FastAPI
- [ ] **Collect:** `SENTRY_DSN` (shown on project creation)

---

## 2. MCP Servers to Add to Claude Agent

Add these MCP servers to Claude Code to enable agents to perform setup and management tasks autonomously.

### How to add MCP servers
Edit `~/.claude/settings.json` or run `claude mcp add` for each server.

---

### Supabase MCP
Allows agents to: create tables, run migrations, manage RLS policies, inspect schema, manage storage buckets, manage auth settings.

```bash
claude mcp add supabase -- npx -y @supabase/mcp-server-supabase@latest \
  --supabase-url YOUR_SUPABASE_URL \
  --service-role-key YOUR_SERVICE_ROLE_KEY
```

**Capabilities agents gain:**
- Apply Alembic migrations via SQL execution
- Verify table structure after migrations
- Set up Row Level Security policies
- Create/configure storage buckets
- Inspect auth configuration

**Setup tasks this unlocks:**
- Agents can autonomously apply DB schema changes
- Agents can verify migrations succeeded
- Agents can set up RLS policies without manual SQL editor

---

### Stripe MCP
Allows agents to: create products, prices, inspect customers, view webhooks, test billing flows.

```bash
claude mcp add stripe -- npx -y @stripe/agent-toolkit@latest mcp \
  --api-key YOUR_STRIPE_RESTRICTED_KEY
```

**Capabilities agents gain:**
- Create Products and Prices in test mode
- List/inspect existing prices (to collect Price IDs)
- Set up webhook endpoints
- Inspect subscription and payment events

**Setup tasks this unlocks:**
- Agents can create all Stripe Products + Prices and output the Price IDs for your `.env`
- Agents can verify webhook configuration

---

### Vercel MCP (for when frontend is built)
Allows agents to: deploy projects, manage environment variables, inspect deployments.

```bash
claude mcp add vercel -- npx -y @vercel/mcp-server@latest \
  --token YOUR_VERCEL_TOKEN
```

**Capabilities agents gain:**
- Deploy Nuxt frontend
- Set environment variables per environment (preview, production)
- Check deployment status and logs

---

### GitHub MCP (optional but recommended)
Allows agents to: create PRs, manage issues, push branches.

```bash
claude mcp add github -- npx -y @modelcontextprotocol/server-github \
  --token YOUR_GITHUB_TOKEN
```

**Setup:**
- Create GitHub Personal Access Token: GitHub → Settings → Developer Settings → Tokens (classic)
- Scopes: `repo`, `workflow`
- **Collect:** `GITHUB_TOKEN`

---

### Filesystem MCP (already available via Claude Code)
Already included — no setup needed.

---

## 3. Environment Variable Checklist

Once you've completed account setup, verify your `.env` file (at `backend/.env`) has:

```bash
# Core
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                       # asyncpg format
REDIS_URL=redis://localhost:6379    # local default

# AI
ANTHROPIC_API_KEY=

# Jobs
ADZUNA_APP_ID=
ADZUNA_API_KEY=

# Payments
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_PREMIUM_PRICE_ID=
STRIPE_CREDITS_10_PRICE_ID=
STRIPE_CREDITS_50_PRICE_ID=
STRIPE_CREDITS_100_PRICE_ID=
STRIPE_CREDITS_250_PRICE_ID=

# Internal
INTERNAL_API_KEY=                   # Generate: openssl rand -hex 32
                                    # Used by agent workers to post results back

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Monitoring
SENTRY_DSN=

# App
ENV=development                     # development | staging | production
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 4. Quick Start After Setup

1. Copy `backend/.env.example` → `backend/.env` and fill in values
2. Start local services: `docker-compose up -d`  (starts Redis)
3. Apply migrations: `cd backend && make migrate`
4. Start dev server: `make dev`
5. Visit `http://localhost:8000/docs` to verify all endpoints

---

## 5. Priority Order

Do these first (needed for Phase 1–5):
1. Supabase account + project + collect keys
2. Anthropic API key
3. Google OAuth setup (for Supabase auth)

Do these before Phase 6:
4. Adzuna API key

Do these before Phase 10:
5. Stripe account + products + prices + webhook

Do these before deployment:
6. Redis (production)
7. Railway/Fly.io
8. Vercel (frontend)
9. Sentry
