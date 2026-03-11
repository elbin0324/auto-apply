# Phase 0: Foundation

> **Depends on:** Nothing (first phase)
> **Blocks:** Phase 1, Phase 2, all subsequent phases
> **Parallelizable with:** Phase BE (backend mods)
> **Estimated steps:** ~15

---

## Goal

Set up the foundational layer: theme system, icon library, auth setup, Tailwind v4 config, and entry point files. After this phase, the app loads, login works, and redirects based on auth state.

---

## Prerequisites

- `frontend/src-v2/` directory exists (confirmed)
- All packages already installed in `frontend/` (React 19, TanStack Router/Query, Zustand, shadcn/ui, Tailwind v4, Supabase JS, etc.)
- Existing `frontend/vite.config.ts` has `@/` alias pointing to `src/` — will need updating to `src-v2/`

---

## Steps

### 0.1 Vite Config & Entry Point

**Files to modify:**
- `frontend/vite.config.ts` — change `@/` alias to resolve to `src-v2/`
- `frontend/index.html` — change script src from `/src/main.tsx` to `/src-v2/main.tsx`

**Files to create:**
- `frontend/src-v2/vite-env.d.ts` — already exists (empty), populate with `/// <reference types="vite/client" />`
- `frontend/src-v2/main.tsx` — entry point, creates React root, wraps with QueryClientProvider + ThemeProvider
- `frontend/src-v2/app.tsx` — root App component, auth initialization, TooltipProvider

**Verification:** `pnpm dev` starts without errors, shows blank page

### 0.2 Tailwind v4 CSS Config

**File to create:** `frontend/src-v2/index.css`

Configure Tailwind v4 inline theme with the Deep Ocean design system tokens:

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme {
  /* Background tokens */
  --color-bg-deep: #060d14;
  --color-bg-sidebar: #081018;
  --color-bg-body: #0c1520;
  --color-bg-card: #111c2a;
  --color-bg-inset: #0e1824;
  --color-bg-muted: #182838;

  /* Primary (Teal Aqua) */
  --color-pri: #2ec4b6;
  --color-pri-dim: #1a9a8e;
  --color-pri-light: #50dace;

  /* Success (Ice Blue) */
  --color-ok: #64b5cf;
  --color-ok-dim: #3a8eaa;

  /* Warning (Amber) */
  --color-warn: #e0a850;
  --color-warn-dim: #b88030;

  /* Failure (Red) */
  --color-fail: #d06060;
  --color-fail-dim: #a84040;

  /* Muted */
  --color-muted: #4a6070;

  /* Text on dark */
  --color-t-900: #e0e8f0;
  --color-t-700: #b0c0d0;
  --color-t-500: #708090;
  --color-t-400: #506070;
  --color-t-300: #384858;

  /* Borders */
  --color-border-main: #1e2e3e;
  --color-border-subtle: #182838;

  /* Fonts */
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Radius */
  --radius: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-elevated: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-panel: -8px 0 30px rgba(0, 0, 0, 0.15);
}
```

Also include:
- CSS custom properties for rgba-based tokens (`priBg`, `priBorder`, `okBg`, etc.) that Tailwind can't handle natively
- Custom scrollbar styling (5px width, transparent track, themed thumb)
- Google Fonts import for JetBrains Mono (weights 400, 500, 600, 700)

**Note:** Light theme tokens will be applied via a `.light` class on the root, overriding CSS variables.

### 0.3 Theme System

**Files to create:**
- `frontend/src-v2/theme/tokens.ts`
  - Export `DARK_THEME` and `LIGHT_THEME` objects with all design system tokens
  - Each theme has: bg colors, semantic colors (pri, ok, warn, fail, muted) with base/dim/bg/border variants, text colors (t900-t300), sidebar text (tw90-tw10), border colors, shadow values
  - Export `type Theme` interface
  - Include helper functions:
    - `statusColor(status: string): keyof SemanticColors` — maps application status to color token
    - `statusLabel(status: string): string` — maps status to display label (QUEUED, IN-FLIGHT, REVIEW, LANDED, FAILED, SKIPPED, NEW)
    - `matchScoreColor(score: number): string` — maps score to color (90+ pri, 75+ ok, 60+ warn, else muted)
    - `matchScoreLabel(score: number): string` — maps score to label (Exceptional, Strong, Good, Moderate, Weak, Poor)

- `frontend/src-v2/theme/context.tsx`
  - React Context for theme: `ThemeContext`
  - `ThemeProvider` component:
    - Reads initial theme from `localStorage('applypilot-theme')`, defaults to `"dark"`
    - Provides current theme object + `toggleTheme()` function
    - Applies `.light` / `.dark` class to document root on toggle
    - Persists preference to localStorage on change
  - `useTheme()` hook — returns `{ theme, isDark, toggleTheme }`

- `frontend/src-v2/theme/utils.ts`
  - Utility functions that work with theme tokens
  - `cn()` function (re-export from existing `clsx` + `tailwind-merge`)

### 0.4 Icon Library

**File to create:** `frontend/src-v2/icons/index.tsx`

Create 19 SVG icon components, all with consistent interface:
```tsx
interface IconProps {
  size?: number;    // default 16
  color?: string;   // default "currentColor"
  className?: string;
}
```

Icons to implement (all stroke-based, strokeWidth 2, strokeLinecap round, strokeLinejoin round):
1. `Plane` — tilted plane silhouette
2. `Target` — crosshair/target
3. `Radar` — radar sweep
4. `Doc` — document
5. `Sliders` — adjustment sliders
6. `Bot` — robot/bot
7. `Chart` — bar chart
8. `Gear` — settings gear
9. `Search` — magnifying glass
10. `Bell` — notification bell
11. `Check` — checkmark
12. `X` — close X
13. `Queue` — list/queue
14. `Upload` — upload arrow
15. `Shield` — shield
16. `Play` — play triangle (fill, not stroke)
17. `Stop` — stop square (fill, not stroke)
18. `Sun` — sun rays
19. `Moon` — crescent moon

Export all as named exports + a `ICONS` object for lookup by name.

### 0.5 Auth Setup — Supabase Client

**Files to create:**
- `frontend/src-v2/lib/supabase.ts`
  - Initialize Supabase client with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  - Same implementation as existing `src/lib/supabase.ts`

- `frontend/src-v2/lib/api.ts`
  - HTTP API client (fetch wrapper)
  - Base URL from `VITE_API_URL`
  - Auto-attaches `Authorization: Bearer {token}` from Supabase session
  - On 401: calls `supabase.auth.refreshSession()`, retries once, then throws
  - Methods: `get()`, `post()`, `put()`, `patch()`, `del()`
  - Response parsing with error extraction

- `frontend/src-v2/lib/utils.ts`
  - `cn()` — clsx + tailwind-merge
  - `formatDate()`, `formatCurrency()`, `formatRelativeTime()`
  - `truncate(str, len)` helper

- `frontend/src-v2/lib/constants.ts`
  - App name, version
  - Navigation items definition (used by sidebar)
  - Status labels and color mappings

### 0.6 Auth State Store

**File to create:** `frontend/src-v2/stores/auth-store.ts`
- Zustand store for auth state
- State: `user`, `isLoading`, `isAuthenticated`
- Actions: `setUser()`, `clearUser()`, `initialize()` (checks Supabase session)
- Subscribe to Supabase `onAuthStateChange` for session changes

**File to create:** `frontend/src-v2/stores/ui-store.ts`
- Zustand store for UI state
- State: `sidebarOpen` (mobile), `sidePanel: { isOpen, data }`
- Actions: `toggleSidebar()`, `openPanel(data)`, `closePanel()`

### 0.7 TypeScript Types

**Files to create:** `frontend/src-v2/types/`
- `user.ts` — `User`, `TokenResponse`
- `profile.ts` — `Profile`, `Experience`, `Education`, `Skill`, `ApplicationPreferences`
- `job.ts` — `Job`, `JobListResponse`, `MatchBreakdown`, `MatchFactors`
- `application.ts` — `Application`, `ApplicationStats`, `ApplicationListResponse`, `GeneratedApplication`
- `auto-apply.ts` — `AutoApplyConfig`, `QueueStatus`

All types should match the backend API reference exactly.

### 0.8 Auth Pages

**Files to create:**
- `frontend/src-v2/pages/login.tsx`
  - Email + password form
  - "Sign in with Google" button
  - Link to signup
  - On submit: `POST /api/auth/login` or Supabase OAuth flow
  - On success: store tokens, redirect to `/dashboard` (or `/onboarding` if not completed)
  - Styled with Deep Ocean theme (dark bg, card surface, teal accents)

- `frontend/src-v2/pages/signup.tsx`
  - Email + password + confirm password form
  - "Sign up with Google" button
  - Link to login
  - On submit: `POST /api/auth/signup`
  - On success: redirect to `/onboarding`

### 0.9 Auth Hooks

**File to create:** `frontend/src-v2/hooks/use-auth.ts`
- `useAuth()` hook — wraps auth store, provides login/signup/logout functions
- Handles Supabase session initialization
- Checks `onboarding_completed` from `/api/auth/me`

---

## Verification Checklist

- [ ] `pnpm dev` starts without errors
- [ ] Dark theme renders correctly (deep navy backgrounds, teal accents)
- [ ] Light theme toggle works (main content lightens, sidebar stays dark)
- [ ] Theme persists across page reloads (localStorage)
- [ ] Login page renders with correct styling
- [ ] Can log in with email/password
- [ ] OAuth redirect flow works
- [ ] After login, redirects appropriately (dashboard or onboarding)
- [ ] Auth guard prevents unauthenticated access
- [ ] All 19 icons render correctly at different sizes
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
