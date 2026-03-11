# Phase 3: Dashboard (Flight Ops)

> **Depends on:** Phase 1 (app shell), Phase 2 (shared components)
> **Blocks:** Nothing (independent page)
> **Parallelizable with:** Phases 4-9, Phase BE

---

## Goal

Build the Dashboard page showing real-time stats, application pipeline, activity feed, ATS coverage, and weekly chart. This is the main landing page after login.

---

## API Dependencies

| Data | Endpoint | Status |
|------|----------|--------|
| Stats (deployed, interviews, response rate) | `GET /api/applications/stats` | Ready |
| Queue counts (pipeline) | `GET /api/auto-apply/queue` | Ready |
| Recent applications | `GET /api/applications?per_page=5&sort_by=created_at` | Ready |
| Avg match score | Need to compute from jobs | Gap — placeholder |
| Activity feed | No endpoint | Gap — static placeholder |
| ATS breakdown | No endpoint | Gap — static placeholder |
| Weekly chart | No endpoint | Gap — static placeholder |

**Note:** When Phase BE completes `GET /api/dashboard/summary`, switch to that single endpoint.

---

## Steps

### 3.1 Dashboard Data Hook

**File:** `frontend/src-v2/hooks/use-dashboard.ts`

Uses TanStack Query to fetch dashboard data:
```tsx
export function useDashboard() {
  const stats = useQuery({ queryKey: ['application-stats'], queryFn: ... });
  const queue = useQuery({ queryKey: ['queue-status'], queryFn: ... });
  const recentApps = useQuery({ queryKey: ['recent-applications'], queryFn: ... });
  // ...
}
```

- `GET /api/applications/stats` → stats (total, applied, pending, failed, success_rate, this_week)
- `GET /api/auto-apply/queue` → queue (queue_depth, pending_review_count, in_progress_count)
- `GET /api/applications?per_page=5` → recent applications with nested job data

Polling: if autopilot active, refetch queue every 10s using `refetchInterval`.

### 3.2 Dashboard Page Layout

**File:** `frontend/src-v2/pages/dashboard.tsx`

**Layout:**
```
[Stats Row — 4 equal columns, 14px gap]
[Pipeline Card (flex: 1) | Activity Feed (340px fixed)]
[ATS Coverage (1fr) | Weekly Chart (1fr)]
```

Uses CSS grid: `grid grid-cols-4 gap-3.5` for stats, then `grid grid-cols-[1fr_340px] gap-3.5` for main, then `grid grid-cols-2 gap-3.5` for bottom.

### 3.3 Stats Row

**File:** `frontend/src-v2/components/dashboard/stats-row.tsx`

4 StatCard components:
1. **Deployed** — label: "Deployed", value: `stats.total`, change: "+X% MoM" (placeholder), icon: Plane
2. **Interviews** — label: "Interviews", value: `stats.applied`, change: "+X this week", icon: Check
3. **Response Rate** — label: "Response", value: `stats.success_rate`%, change: "+X.Xpp", icon: Chart
4. **Avg Match** — label: "Avg Match", value: placeholder "—", icon: Target

### 3.4 Pipeline Card

**File:** `frontend/src-v2/components/dashboard/pipeline-card.tsx`

**Header:** CardHeader with title "PIPELINE"

**Pipeline Status Boxes:** 4-column row
- QUEUED: `queue.queue_depth` — colored `pri`
- IN-FLIGHT: `queue.in_progress_count` — colored `pri`
- LANDED: `stats.applied` — colored `ok`
- NO-GO: `stats.failed` — colored `fail`

Each box: centered number (mono 20px/700) + label (mono 8px/700, 0.1em, uppercase), colored semantic bg

**Recent Job Rows:** 5 most recent applications, rendered as `JRow` components
- Data from `GET /api/applications?per_page=5`
- Map application data → JRow job format
- Click → opens SidePanel

### 3.5 Activity Feed (Flight Log)

**File:** `frontend/src-v2/components/dashboard/activity-feed.tsx`

**Header:** CardHeader with title "FLIGHT LOG"

**MVP: Static placeholder data** (5 entries):
```
[pri LED] STR moved to interview — T-02:14
[pri LED] VCL in flight filling 3/5 — T-04:30
[pri LED] ANT resume tailored — T-06:22
[fail LED] NTN rejected — T-08:15
[pri LED] SYS 24 new matches queued — T-12:00
```

Each entry: Led dot (7px) + text (mono 11px/500) + timestamp (mono 10px, `t400`)

Later: connect to `GET /api/activity` or derive from recent applications.

### 3.6 ATS Coverage Card

**File:** `frontend/src-v2/components/dashboard/ats-coverage.tsx`

**Header:** CardHeader with title "ATS COVERAGE"

**MVP: Static placeholder data:**
- Greenhouse — 85% — Progress bar
- Lever — 62%
- Ashby — 45%
- Workday — 28%

Each row: label (mono 11px/600, 90px width) + Progress bar (flex 1) + percentage (mono 11px, 28px right-aligned)

### 3.7 Weekly Chart Card

**File:** `frontend/src-v2/components/dashboard/weekly-chart.tsx`

**Header:** CardHeader with title "WEEKLY SORTIE"

**MVP: Static placeholder data** — 7-day bar chart (M-S)

Bars: vertical, height proportional to value, 60% of column width, 2px radius, `pri` color
Labels: mono 9px below each bar

Simple CSS-based bars (no charting library needed):
```tsx
{days.map(d => (
  <div className="flex flex-col items-center flex-1">
    <div style={{ height: `${(d.value / max) * 100}%` }} className="w-3/5 bg-pri rounded-sm" />
    <span className="text-[9px] font-mono mt-1 text-t-400">{d.label}</span>
  </div>
))}
```

### 3.8 SidePanel Integration

When any JRow on the dashboard is clicked:
1. Fetch job detail: `GET /api/jobs/{job_id}`
2. Fetch match breakdown: `GET /api/jobs/{job_id}/match`
3. Open SidePanel with full data
4. Action buttons based on application status

Use the global `ui-store` to manage panel state.

---

## Verification Checklist

- [ ] Stats row shows 4 cards with real data from API
- [ ] Pipeline card shows correct queue/in-flight/landed/failed counts
- [ ] Recent applications render as JRow components
- [ ] Clicking a JRow opens the SidePanel
- [ ] Activity feed shows placeholder entries with LED indicators
- [ ] ATS coverage shows progress bars
- [ ] Weekly chart shows bar visualization
- [ ] Layout is correct: stats / pipeline+feed / ats+chart
- [ ] Both themes render correctly
- [ ] Loading state shows while data fetches
- [ ] Empty state handles zero data gracefully
