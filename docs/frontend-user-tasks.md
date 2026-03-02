# Frontend User Setup Tasks

> Complete these tasks **before** starting frontend development (Phase F1).
> These require human action (installs, environment configuration).

---

## Status Legend
- `[ ]` Not done
- `[x]` Done
- `[~]` In progress

---

## 1. Local Development Environment

### Node.js
- [ ] Install Node.js 20+ (LTS recommended)
  - macOS: `brew install node` or download from https://nodejs.org
  - Verify: `node --version` (should be >= 20.0.0)

### pnpm (Package Manager)
- [ ] Install pnpm: `npm install -g pnpm` or `brew install pnpm`
  - Verify: `pnpm --version` (should be >= 9.0)
  - We use pnpm (not npm or yarn) for faster installs and strict dependency management

---

## 2. Environment Variables

Create `frontend/.env.local` with these values:

```bash
# Supabase (same project as backend — use ANON key, NOT service role key)
VITE_SUPABASE_URL=              # Same as SUPABASE_URL in backend/.env
VITE_SUPABASE_ANON_KEY=         # Same as SUPABASE_ANON_KEY in backend/.env

# Backend API
VITE_API_URL=http://localhost:8000

# App
VITE_APP_NAME=AutoApply
```

**Important:**
- All frontend env vars MUST be prefixed with `VITE_` to be exposed to the browser (Vite requirement)
- **NEVER** put `SUPABASE_SERVICE_ROLE_KEY` in frontend env vars
- **NEVER** put `STRIPE_SECRET_KEY` in frontend env vars
- The `VITE_SUPABASE_ANON_KEY` is safe for browser — it respects RLS policies

---

## 3. CORS Configuration

The backend CORS is configured to allow `http://localhost:3000` (see `backend/config.py` `ALLOWED_ORIGINS`). Since Vite defaults to port 5173, you need to update the backend:

- [ ] Update `backend/.env` to add Vite's port:
  ```
  ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
  ```

Alternatively, configure Vite to use port 3000 in `vite.config.ts`:
```ts
export default defineConfig({
  server: { port: 3000 }
})
```

---

## 4. Accounts (Optional — For Deployment Later)

### Vercel (Frontend Hosting)
- [ ] Create account at https://vercel.com (connect GitHub)
- Not needed for local development — only for deployment
- **Collect when ready:** `VERCEL_TOKEN` (Account → Settings → Tokens)

No other new accounts are needed. The frontend uses the same Supabase project as the backend — credentials are already collected (see `docs/user-setup-tasks.md`).

---

## 5. MCP Tools (Optional)

### Vercel MCP (for deployment)
```bash
claude mcp add vercel -- npx -y @vercel/mcp-server@latest \
  --token YOUR_VERCEL_TOKEN
```

No other MCP servers needed beyond what's already configured for the backend.

---

## 6. Quick Start Checklist

Do these **before Phase F1**:

1. [ ] Node.js 20+ installed
2. [ ] pnpm installed
3. [ ] `frontend/.env.local` created with Supabase + API URL values
4. [ ] Backend `ALLOWED_ORIGINS` updated to include Vite port

Do these **before deployment** (not needed for local dev):

5. [ ] Vercel account created
6. [ ] `VERCEL_TOKEN` collected

---

## 7. Running Everything Locally

Once setup is complete, the full local dev stack is:

```bash
# Terminal 1: Backend services (Redis)
docker-compose up -d

# Terminal 2: Backend API
cd backend && make dev
# → http://localhost:8000 (API docs at /docs)

# Terminal 3: Frontend dev server
cd frontend && pnpm dev
# → http://localhost:5173

# Verify connectivity
curl http://localhost:8000/api/health
# → {"status":"ok","version":"0.1.0"}
```
