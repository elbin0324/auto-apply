# Phase 1: App Shell

> **Depends on:** Phase 0 (theme, icons, auth)
> **Blocks:** Phases 3-9 (all pages need the shell)
> **Parallelizable with:** Phase 2 (component library), Phase BE (backend mods)

---

## Goal

Build the persistent app shell: sidebar navigation, systems status bar, page header, and routing. After this phase, the full chrome is visible with working nav between stub pages.

---

## Steps

### 1.1 Sidebar Component

**File:** `frontend/src-v2/components/layout/sidebar.tsx`

**Structure:**
```
Fixed left, 240px wide, full viewport height
bgSidebar background, 1px right border (tw10)
Always dark (uses tw* text tokens in both themes)

├── Logo Area (top)
│   30x30px teal rounded square with Plane icon
│   "APPLY" (tw90) + "PILOT" (pri) — mono 15px/700
│
├── Nav Section: MISSION CTRL
│   ├── Dashboard (Chart icon)
│   ├── Job Radar (Target icon) — badge count
│   ├── Flight Queue (Queue icon) — badge count
│   └── Resume Hangar (Doc icon)
│
├── Nav Section: OPS
│   ├── Autopilot (Bot icon)
│   ├── Tracker (Radar icon)
│   └── Analytics (Chart icon)
│
├── Nav Section: SYS
│   └── Settings (Gear icon)
│
└── Subscription Footer
    "BUSINESS CLASS" label (pri, 9px mono)
    Usage "68/100" (tw40) — placeholder
    Progress bar (3px, teal gradient)
```

**Styling details:**
- Section labels: mono 9px/700, 0.14em letter-spacing, tw40 color, uppercase
- Nav items: mono 11px/500, tw60 color, 8px 10px padding, 6px radius, 1px margin-bottom
- Active item: priBg background, priBorder left border (2px), pri text color, icon at full opacity
- Inactive item: transparent bg, tw60 text, icon at 50% opacity
- Badge pills: small mono 10px, teal bg when active, tw10 bg when inactive
- Hover: subtle background lighten

**Props:**
- `activePage: string` — current route ID
- `onNavigate: (page: string) => void`
- `badges: Record<string, number>` — badge counts by page ID

**Reference:** `docs/02-COMPONENT_LIBRARY.md` Sidebar section, `docs/applypilot-v41.jsx` lines 141-145

### 1.2 Systems Status Bar

**File:** `frontend/src-v2/components/layout/status-bar.tsx`

**Structure:**
```
Full width (content area), 36px height
bgDeep background, 1px bottom border (tw10)
Always dark styling (tw* tokens)

├── Subsystem LEDs (left side, flex row)
│   ├── RES-ENG — Led(pri) + label
│   ├── | (divider 1px tw10, 12px tall)
│   ├── ATS-NAV — Led(pri) + label
│   ├── |
│   ├── JOB-RDR — Led(pri) + label
│   ├── |
│   ├── CVR-LTR — Led(warn) + label
│   ├── |
│   └── STEALTH — Led(pri) + label
│
└── Live Clock (right side)
    Mono 10px, tw40 color
    Format: HH:MM:SS, updates every second
```

**LED labels:** mono 9px/600, 0.08em letter-spacing, uppercase, tw60 color

**MVP behavior:** All LEDs show `pri` (nominal) except CVR-LTR which shows `warn`. Later connect to `GET /api/health` endpoint.

**Clock:** Use `useEffect` with `setInterval(1000)` for live updates.

### 1.3 Page Header

**File:** `frontend/src-v2/components/layout/page-header.tsx`

**Structure:**
```
Full width, ~56px height
bgCard background, 1px bottom border (border)

├── Left: Page Title
│   Mono 16px/700, t900 color
│   + " / MAR 2026" (mono 11px, t400)
│
└── Right: Action Buttons (flex row, 8px gap)
    ├── Theme Toggle (Sun/Moon icon, 32x32, bordered)
    ├── Search (Search icon, 32x32, bordered)
    ├── Notifications (Bell icon, 32x32, bordered)
    │   └── Red dot indicator (7px, fail color, absolute top-right)
    └── "Quick Apply" Button (primary variant, Target icon)
```

**Props:**
- `title: string` — page title text
- `onThemeToggle: () => void`

**Title mapping (from route):**
```
dashboard  → "FLIGHT OPS"
jobs       → "JOB RADAR"
queue      → "FLIGHT QUEUE"
profile    → "RESUME HANGAR"
autopilot  → "AUTOPILOT"
tracker    → "TRACKER"
analytics  → "ANALYTICS"
settings   → "SETTINGS"
```

### 1.4 Dashboard Layout Wrapper

**File:** `frontend/src-v2/components/layout/dashboard-layout.tsx`

**Structure:**
```
<div className="flex min-h-screen">
  <Sidebar />
  <div className="flex-1 ml-[240px] flex flex-col">
    <StatusBar />
    <PageHeader />
    <main className="flex-1 p-5 px-7">
      {children}
    </main>
  </div>
</div>
```

Also handles:
- SidePanel overlay (rendered at this level since it's global)
- Mobile sidebar toggle state (from ui-store)

### 1.5 Protected Route Wrapper

**File:** `frontend/src-v2/components/layout/protected-route.tsx`

- Checks auth state from Zustand store
- If not authenticated → redirect to `/login`
- If authenticated but `onboarding_completed === false` → redirect to `/onboarding`
- If authenticated → render children wrapped in `DashboardLayout`

**File:** `frontend/src-v2/components/layout/auth-only-route.tsx`

- For onboarding: checks auth but does NOT wrap in DashboardLayout (full-page takeover)

### 1.6 Router Setup

**File:** `frontend/src-v2/router.tsx`

Use TanStack Router. Define routes:

```tsx
// Public routes (no auth required, no sidebar)
/login      → LoginPage
/signup     → SignupPage

// Auth-only route (auth required, no sidebar)
/onboarding → OnboardingPage (wrapped in AuthOnlyRoute)

// Protected routes (auth + sidebar + header)
/           → redirect to /dashboard
/dashboard  → DashboardPage
/jobs       → JobsPage
/queue      → QueuePage
/profile    → ProfilePage
/autopilot  → AutopilotPage
/tracker    → TrackerPage
/analytics  → AnalyticsPage
/settings   → SettingsPage
```

All page components are stubs for now (just render the page title).

### 1.7 Stub Page Components

**Files to create:** `frontend/src-v2/pages/`
- `dashboard.tsx` — `<h1>FLIGHT OPS</h1>` placeholder
- `jobs.tsx` — `<h1>JOB RADAR</h1>` placeholder
- `queue.tsx` — `<h1>FLIGHT QUEUE</h1>` placeholder
- `profile.tsx` — `<h1>RESUME HANGAR</h1>` placeholder
- `autopilot.tsx` — `<h1>AUTOPILOT</h1>` placeholder
- `tracker.tsx` — `<h1>TRACKER</h1>` placeholder
- `analytics.tsx` — `<h1>ANALYTICS</h1>` placeholder
- `settings.tsx` — `<h1>SETTINGS</h1>` placeholder

Each stub should:
- Use the correct page title from the title mapping
- Render with mono font styling
- Display "Coming soon" subtitle

---

## Verification Checklist

- [ ] Sidebar renders with correct sections and icons
- [ ] Active nav item highlights correctly with teal styling
- [ ] Clicking nav items navigates between stub pages
- [ ] Systems status bar shows LEDs and live clock
- [ ] Page header shows correct title for each route
- [ ] Theme toggle switches between dark/light
- [ ] Sidebar stays dark in light mode
- [ ] Quick Apply button visible in header
- [ ] Protected routes redirect to login when not authenticated
- [ ] After login, onboarding check redirects appropriately
- [ ] URL matches active page (browser back/forward works)
- [ ] `pnpm typecheck` passes
