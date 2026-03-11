# ApplyPilot Implementation Order

> Recommended build sequence. Each step produces a deployable increment. Reference the other docs for details.

---

## Phase 0: Foundation (Day 1)

### 0.1 Theme System
- Define CSS variables or theme object from `01-DESIGN_SYSTEM.md`
- Implement dark/light theme with React Context
- `ThemeProvider` wrapping the app, `useTheme()` hook
- Dark as default, persisted to localStorage
- Load JetBrains Mono from Google Fonts
- **Verify:** Toggle between dark/light, all backgrounds and text adapt

### 0.2 Icon Library
- Create SVG icon components matching the prototype's icon set
- All inline SVGs with `stroke` rendering, accept `size` and `color` props
- Icons: plane, target, radar, doc, sliders, bot, chart, gear, search, bell, check, x, queue, upload, shield, play, stop, sun, moon

### 0.3 Auth Setup
- Supabase Auth client configured
- Login page (email/password + Google OAuth)
- Signup page
- Token storage and refresh logic
- Auth guard middleware: check session → check onboarding → route

**Deliverable:** App loads, login works, redirects based on auth state.

---

## Phase 1: App Shell (Day 2)

### 1.1 Sidebar
- Fixed 240px, always dark
- Logo + wordmark
- Nav sections: MISSION CTRL, OPS, SYS
- Active state highlighting (priBg + priBorder)
- Badge counts (will connect to live data later)
- Subscription bar at bottom

### 1.2 Systems Status Bar
- 36px dark bar, subsystem LEDs
- Live clock (updates every second)
- For MVP: all LEDs show primary (nominal). Connect to health endpoint later.

### 1.3 Page Header
- Dynamic title based on route
- Theme toggle, search, notification, Quick Apply buttons
- Quick Apply opens Job Radar (or triggers a quick-apply modal later)

### 1.4 Routing
- Set up routes per `05-ROUTING_AND_STATE.md`
- Page components as stubs (just render title)

**Deliverable:** Full app shell with working nav, theme toggle, routing between stub pages.

---

## Phase 2: Shared Components (Day 2-3)

Build from `02-COMPONENT_LIBRARY.md`:

### 2.1 Core Components
1. `Led` — status dot with glow
2. `Badge` — semantic status label
3. `Card` + `CardHeader` — container surfaces
4. `Button` — 4 variants
5. `StatCard` — metric display
6. `Progress` — horizontal bar
7. `MatchDot` — score dot + number + label
8. `Input` + `Select` — form primitives

### 2.2 Composite Components
1. `JRow` — job listing row (fixed-width grid columns)
2. `SidePanel` — slide-in detail view

### 2.3 Test
- Create a "kitchen sink" page showing all components in both themes
- Verify alignment, colors, typography in dark and light

**Deliverable:** Component library, tested in both themes.

---

## Phase 3: Dashboard (Day 3-4)

### 3.1 API Integration
- Connect `GET /api/applications/stats` for stat cards
- Connect `GET /api/auto-apply/queue` for pipeline counts
- Connect `GET /api/applications?per_page=5` for recent rows
- Activity feed: static placeholder data for now (pending backend endpoint)
- ATS breakdown: derive from applications if possible, or static
- Weekly chart: static placeholder

### 3.2 Layout
- 4-column stat row
- Pipeline card with stage counts + job rows
- Activity feed (Flight Log)
- ATS coverage + weekly chart

### 3.3 Interactions
- Click job row → open SidePanel
- Stat cards are read-only
- Start queue polling if autopilot is active

**Deliverable:** Dashboard showing real data from your backend.

---

## Phase 4: Job Radar (Day 4-5)

### 4.1 API Integration
- `GET /api/jobs?status=new` — filtered to unprocessed jobs
- Search: debounced query param
- Filters: location_type, experience_level, sort_by
- Pagination

### 4.2 Layout
- Search/filter card
- Job cards with Apply/Skip actions
- Pagination controls

### 4.3 SidePanel Integration
- Click job → fetch `GET /api/jobs/{id}` + `GET /api/jobs/{id}/match`
- Render full detail view with match analysis
- Apply action: `POST /api/jobs/{id}/queue` → close panel, remove from list
- Skip action: `POST /api/jobs/{id}/skip`

**Deliverable:** Browse, search, filter jobs. Apply or skip. View full match analysis.

---

## Phase 5: Flight Queue (Day 5-7)

This is the most complex page. Build incrementally.

### 5.1 Tab System
- Tabs: REVIEW (default), IN-FLIGHT, QUEUED, LANDED, FAILED
- Tab counts from stats + queue endpoints
- Switching tabs refetches applications with status filter

### 5.2 Review Tab
- List pending_review applications
- Inline Approve/Reject/Preview actions
- Batch selection: Select All, Approve All, Reject All
- Approve: `POST /api/auto-apply/review/{id}?action=approve`
- Reject: `POST /api/auto-apply/review/{id}?action=reject`

### 5.3 In-Flight Monitor
- Shown when any apps are in_progress
- Progress phase visualization (5 segments)
- Polling for phase updates (3-5 second interval)

### 5.4 Preview Answers
- For extract_only applications: SidePanel shows generated_application fields + answers
- User can edit answers inline
- Submit: `POST /api/applications/{id}/submit`

**Deliverable:** Full application management — review, approve, reject, track progress.

---

## Phase 6: Profile & Resume (Day 7-8)

### 6.1 Contact Card
- Load `GET /api/profile`
- Editable fields with save: `PUT /api/profile`

### 6.2 Resume Upload
- Drag-and-drop or click upload zone
- `POST /api/profile/resume/upload` (multipart)
- After upload: `POST /api/profile/resume/parse` (show loading spinner)
- Display parse results, auto-populate experience/skills

### 6.3 Experience & Skills
- Render from profile data
- Add/edit/remove UI
- Save: `PUT /api/profile/experiences`, `PUT /api/profile/skills`

**Deliverable:** Complete profile management with resume AI parsing.

---

## Phase 7: Autopilot Config (Day 8-9)

### 7.1 Engage/Disengage
- Load `GET /api/auto-apply/config`
- Start: `POST /api/auto-apply/start`
- Stop: `POST /api/auto-apply/stop`
- Real-time queue stats display

### 7.2 Targeting
- Tag inputs for titles, locations, excluded companies
- Save: `PUT /api/auto-apply/config`

### 7.3 Apply Mode
- Radio-style mode selector (SAFE/HYBRID/FULL AUTO)
- Threshold slider (hybrid mode)
- Daily limit slider
- Save: `PUT /api/auto-apply/config`

**Deliverable:** Full autopilot configuration and control.

---

## Phase 8: Remaining Pages (Day 9-10)

### 8.1 Flight Tracker
- Stats row from `GET /api/applications/stats`
- Table from `GET /api/applications` with pagination
- Row click → SidePanel
- Status filter tabs (optional, can use dropdown)

### 8.2 Analytics
- Stats row (same data, different presentation)
- ATS success rate chart
- Weekly breakdown (placeholder if no endpoint)

### 8.3 Settings
- Subscription display (placeholder for billing)
- Account info from auth

**Deliverable:** All pages functional.

---

## Phase 9: Onboarding (Day 10-11)

### 9.1 Step Flow
- Step 1: Name + email
- Step 2: Resume upload + parse
- Step 3: Target titles (at least 1)
- Progress indicator (3 segments)

### 9.2 Completion
- Validate: profile has name, config has target titles
- `POST /api/auth/complete-onboarding`
- Redirect to dashboard

**Deliverable:** New user onboarding flow.

---

## Phase 10: Polish (Day 11-12)

### 10.1 Loading States
- Skeleton screens for each page
- Button loading indicators
- Transition animations

### 10.2 Error Handling
- Toast notifications for success/error
- Inline error messages
- Empty states for each page

### 10.3 Responsiveness
- Collapsible sidebar on small screens
- Stack columns on mobile
- Touch-friendly tap targets

### 10.4 Performance
- Memoize expensive renders
- Lazy-load page components
- Debounce search inputs
- Cache API responses where appropriate

**Deliverable:** Production-ready polish.

---

## Summary Timeline

| Phase | Days | Description |
|-------|------|-------------|
| 0 | 1 | Foundation (theme, icons, auth) |
| 1 | 1 | App shell (sidebar, header, routing) |
| 2 | 1-2 | Shared components |
| 3 | 1-2 | Dashboard |
| 4 | 1-2 | Job Radar + SidePanel |
| 5 | 2-3 | Flight Queue (most complex) |
| 6 | 1-2 | Profile & Resume |
| 7 | 1-2 | Autopilot Config |
| 8 | 1-2 | Tracker, Analytics, Settings |
| 9 | 1-2 | Onboarding |
| 10 | 1-2 | Polish |
| **Total** | **~12-18 days** | |

Days assume a single developer working with these docs + AI assistance (Claude Code). Parallel frontend + backend work can compress the timeline.
