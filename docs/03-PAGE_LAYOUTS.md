# ApplyPilot Page Layouts

> Spec for every page: layout grids, components used, data requirements, API endpoints, and user interactions.

---

## Shared Shell

Every page shares:
- **Sidebar** (fixed left, 240px) — navigation, logo, subscription
- **Systems Status Bar** (top of main, 36px) — subsystem LEDs + clock
- **Page Header** (below status bar) — title, theme toggle, search, notifications, Quick Apply button

Content renders below the header in a padded container (20px 28px).

---

## 1. Dashboard (Flight Ops)

**Route:** `/dashboard`
**Title:** FLIGHT OPS

### Layout
```
[Stats Row — 4 equal columns]
[Pipeline Card (flex) | Activity Feed (340px fixed)]
[ATS Coverage (1fr) | Weekly Chart (1fr)]
```

### Components & Data

**Stats Row (4 × StatCard):**
- Deployed: `GET /api/applications/stats` → `total`
- Interviews: count of `applied` status (derive or add endpoint)
- Response Rate: `success_rate` from stats
- Avg Match: average `match_score` across user's jobs

**Pipeline Card:**
- Pipeline stage counts: derive from `GET /api/applications/stats` → `applied`, `pending`, `failed` + `GET /api/auto-apply/queue` → `queue_depth`, `in_progress_count`
- Job rows: `GET /api/applications?per_page=5&sort_by=created_at` (most recent) — nested `job` data provides title, company, match score
- Each row clickable → opens SidePanel

**Activity Feed (Flight Log):**
- No dedicated endpoint exists. **Options:**
  - Derive from recent applications list (last N applications with their status transitions)
  - Create a new `GET /api/activity` endpoint that returns timestamped events
  - Use `GET /api/applications?per_page=8` and format as activity items
- Each entry: LED color based on status + formatted text + relative timestamp

**ATS Coverage:**
- No user-level ATS breakdown endpoint exists
- **Option A:** Derive from jobs list — group by `ats` field (not available on JobResponse currently)
- **Option B:** Create `GET /api/applications/ats-breakdown` endpoint
- Display: name + progress bar + count

**Weekly Chart:**
- No weekly breakdown endpoint
- **Option:** Create `GET /api/applications/weekly` or derive from applications list filtered by date

### Interactions
- Click any job row → opens SidePanel
- Stats are read-only
- Auto-refresh: poll queue status every 10s when autopilot is active

---

## 2. Job Radar

**Route:** `/jobs`
**Title:** JOB RADAR

### Layout
```
[Search/Filter Card]
[Job Card 1]
[Job Card 2]
[...]
```

### Data
- **API:** `GET /api/jobs?status=new&sort_by=match_score&per_page=20`
- Only shows jobs with `application_status: null` (unprocessed)
- Search: pass `query` param for full-text search
- Filters: `location_type`, `experience_level`, `salary_min`, `employment_type`
- Sort: `match_score` (default), `salary`, `posted_at`
- Paginated — show pagination controls at bottom

### Search/Filter Card
- Search input: full-text, debounced 300ms, sends `query` param
- Filter dropdowns: Location Type (All/Remote/Hybrid/Onsite), Experience Level, Sort By
- Quick filter pills: clickable tags for common filters

### Job Cards (expanded view, not JRow)
Each card uses grid: `48px 1fr 120px auto`
- Company logo (48px square, `bgDeep`, mono code)
- Info block: title (sans 14px bold), meta line (mono 11px), tag pills
- MatchDot (120px fixed width)
- Action buttons: **Apply** (primary) + **Skip** (ghost)

### Interactions
- **Apply:** `POST /api/jobs/{job_id}/queue` → updates status to "queued", card disappears from feed
- **Skip:** `POST /api/jobs/{job_id}/skip` → card disappears
- **Click title/info area:** opens SidePanel with full job detail + match analysis
- Infinite scroll or pagination at bottom

---

## 3. Flight Queue

**Route:** `/queue`
**Title:** FLIGHT QUEUE
**Default tab:** `pending_review` (REVIEW)

### Layout
```
[In-Flight Monitor — only visible if in_progress apps exist]
[Tab Bar]
[Application List]
```

### In-Flight Monitor
- **Data:** `GET /api/applications?status=in_progress`
- Only renders if results > 0
- Styled with `priBg` background, `priBorder` border, teal LED
- Each in-flight app shows: logo + title + company + ATS + progress phases
- Progress phases: 5 segments (NAV, EXTRACT, AI-GEN, FILL, SUBMIT) — fill based on `current_phase`
- **Polling:** Poll `GET /api/applications/{id}` every 3-5s for active applications to update phase

### Tab Bar
Tabs (no "ALL" tab):
1. **REVIEW** — `pending_review` count — color: `warn`
2. **IN-FLIGHT** — `in_progress` count — color: `pri`
3. **QUEUED** — `queued` count — color: `priDim`
4. **LANDED** — `applied` count — color: `ok`
5. **FAILED** — `failed` count — color: `fail`

Tab counts: derive from `GET /api/applications/stats`

Switching tabs: `GET /api/applications?status={tab_status}`

### Batch Actions (REVIEW tab only)
- "Select All" / "Deselect" button
- When items selected: show count + "Approve All" + "Reject All" buttons
- Approve: `POST /api/auto-apply/review/{id}?action=approve` for each selected
- Reject: `POST /api/auto-apply/review/{id}?action=reject` for each selected

### Application List
- Uses `JRow` component for each application
- REVIEW items additionally show inline action buttons below the row when no batch selection: Approve / Reject / Preview
- **Preview:** opens SidePanel with the application's `generated_application` data (extracted form fields + AI answers)
- Click any row → opens SidePanel

### Interactions
- Tab switch: re-fetch with new status filter
- Approve single: `POST /api/auto-apply/review/{id}?action=approve`
- Reject single: `POST /api/auto-apply/review/{id}?action=reject`
- Preview answers: opens SidePanel, which shows `generated_application.fields` + `generated_application.answers`
- For extract_only apps: user can edit answers in SidePanel, then `POST /api/applications/{id}/submit`

---

## 4. Resume Hangar (Profile)

**Route:** `/profile`
**Title:** RESUME HANGAR

### Layout
```
[Contact Card (1fr) | Resume Card (1fr)]
[Experience Card — full width]
[Skills Card — full width]
```

### Data
- **Load:** `GET /api/profile` — returns all contact, experiences, education, skills
- **Resume status:** check `raw_resume_url` and `resume_updated_at`

### Contact Card
- Fields: Name, Email, Phone, Location, LinkedIn
- Edit button → toggles to editable mode
- Save: `PUT /api/profile` with changed fields

### Resume Card
- Shows current resume filename, size, upload date
- Upload button: `POST /api/profile/resume/upload` (multipart/form-data, PDF, max 10MB)
- After upload: trigger `POST /api/profile/resume/parse` — show loading state
- Parse status badge: "PARSED" if `resume_updated_at` exists

### Experience Card
- List of work experiences with company, title, dates, bullet points
- Styled with left-border accent on bullets
- "+ Add" button
- Edit saves: `PUT /api/profile/experiences` (bulk replace)

### Skills Card
- Horizontal wrap of skill tags (`bgDeep` background, `pri` text)
- Add/remove skills
- Save: `PUT /api/profile/skills` (bulk replace)

---

## 5. Autopilot Config

**Route:** `/autopilot`
**Title:** AUTOPILOT

### Layout
```
[Engage/Disengage Control Card — full width]
[Targeting Card (1fr) | Apply Mode Card (1fr)]
```

### Engage Card
- **Status:** `GET /api/auto-apply/config` → `is_active`
- Large icon + "AUTOPILOT ENGAGED/DISENGAGED" title
- Engage: `POST /api/auto-apply/start`
- Disengage: `POST /api/auto-apply/stop`
- Stats bar below: Queue depth, review count, in-progress, today's count
- Stats: `GET /api/auto-apply/queue` for queue/review/in-progress + derive today's from stats

### Targeting Card
- Target titles: tag input, required (at least one for onboarding)
- Locations: tag input
- Excluded companies: tag input (red-styled tags)
- All saved via: `PUT /api/auto-apply/config`

### Apply Mode Card
- Three selectable mode cards: SAFE / HYBRID / FULL AUTO
- Active mode highlighted with `pri` border + `priBg`
- Threshold slider (15-100, shown in hybrid mode)
- Daily limit slider (1-100)
- All saved via: `PUT /api/auto-apply/config`

---

## 6. Flight Tracker

**Route:** `/tracker`
**Title:** TRACKER

### Layout
```
[Stats Row — 5 compact stat cards]
[Applications Table — full width]
```

### Data
- Stats: `GET /api/applications/stats`
- Table: `GET /api/applications?per_page=20` with pagination

### Stats Row
5 cards: Total, Landed, Pending, Failed, Success Rate. Each with colored background from the relevant semantic token.

### Table
Columns: Company (logo+name), Position, ATS, Match (MatchDot sm), Status (Badge), Date.
- Sortable by clicking column headers (if implemented)
- Row hover: `bgInset`
- Row click → opens SidePanel
- Pagination at bottom

---

## 7. Analytics

**Route:** `/analytics`
**Title:** ANALYTICS

### Layout
```
[Stats Row — 4 cards]
[ATS Success Rate Card — full width]
```

### Data
- Stats: `GET /api/applications/stats` + derived metrics
- ATS success: would need a new endpoint or derive from applications grouped by ATS

Primarily read-only visualization page.

---

## 8. Settings

**Route:** `/settings`
**Title:** SETTINGS

### Content
- Subscription card: current plan, price, usage bar, upgrade button
- Account details (from auth)
- Integrations list (if applicable)

### Data
- User: `GET /api/auth/me`
- Profile: `GET /api/profile`
- No billing API exists yet — placeholder UI

---

## 9. Onboarding

**Route:** `/onboarding`
**Title:** PRE-FLIGHT CHECKLIST

**Full-page takeover** — no sidebar or nav shown.

### Steps
1. **Contact info:** Name + email (auto-filled from OAuth if available)
2. **Resume upload:** Drop zone, parse with AI
3. **Target titles:** At least one required

### Completion
- `POST /api/auth/complete-onboarding` — validates profile + config, triggers initial job fetch
- Redirect to `/dashboard`

### Gate
- On every page load, check `onboarding_completed` from `GET /api/auth/me`
- If `false`, redirect to `/onboarding`
