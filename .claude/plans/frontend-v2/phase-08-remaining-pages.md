# Phase 8: Remaining Pages (Tracker, Analytics, Settings)

> **Depends on:** Phase 1 (app shell), Phase 2 (shared components)
> **Blocks:** Nothing
> **Parallelizable with:** Phases 3-7, 9

---

## Goal

Build the three remaining pages: Flight Tracker (full application table), Analytics (stats + ATS breakdown), and Settings (subscription placeholder + account).

---

## 8.1 Flight Tracker

### API Endpoints

| Action | Endpoint |
|--------|----------|
| Stats | `GET /api/applications/stats` |
| Application list | `GET /api/applications?per_page=20` |
| Pagination | `page`, `per_page` params |
| Status filter | `status` param |

### Components

**Stats Row:** `frontend/src-v2/components/tracker/tracker-stats.tsx`

5 compact stat cards in a row (equal columns):
1. TOTAL — `stats.total` — neutral color
2. LANDED — `stats.applied` — `ok` accent
3. PENDING — `stats.pending` — `warn` accent
4. FAILED — `stats.failed` — `fail` accent
5. SUCCESS — `stats.success_rate`% — `pri` accent

Each card: Card with label (mono 10px uppercase), large value (mono 20px/700), colored left border or top accent.

**Application Table:** `frontend/src-v2/components/tracker/application-table.tsx`

Full-width table with columns:
| Column | Width | Content |
|--------|-------|---------|
| COMPANY | auto | Mini logo (26x26, 4px radius) + company name (mono 12px/600) |
| POSITION | 1fr | Job title (sans 13px) |
| ATS | 80px | ATS platform name (mono 10px) |
| MATCH | 100px | MatchDot (sm) |
| STATUS | 80px | Badge with status color |
| DATE | 80px | Formatted date (mono 10px) |

**Table styling:**
- Header: mono 9px/700, 0.1em letter-spacing, `t400`, 9px vertical padding
- Rows: 10-14px vertical padding
- Hover: row bg changes to `bgInset`
- Click: opens SidePanel with application detail
- Border: `borderSubtle` between rows

**Pagination:** `frontend/src-v2/components/shared/pagination.tsx`
- Prev/Next buttons
- Page X of Y indicator
- Mono 10px styling

### Page Assembly

**File:** `frontend/src-v2/pages/tracker.tsx`

```
[Stats Row — 5 equal columns]
[Application Table — full width with pagination]
```

---

## 8.2 Analytics

### API Endpoints

| Action | Endpoint |
|--------|----------|
| Stats | `GET /api/applications/stats` |
| ATS breakdown | Placeholder (no endpoint) |

### Components

**Analytics Stats Row:** `frontend/src-v2/components/analytics/analytics-stats.tsx`

4 StatCard components:
1. Applications — `stats.total` — "+X%"
2. Interview Rate — derived from `applied/total * 100` — "+X.Xpp"
3. Avg Time — placeholder "38s" — "-12s"
4. Variants — placeholder "23"

**ATS Success Card:** `frontend/src-v2/components/analytics/ats-success.tsx`

Card with CardHeader "ATS SUCCESS RATE"

Table of ATS platforms with progress bars:
| ATS | Progress | Rate | Count |
|-----|----------|------|-------|
| Greenhouse | ████████░░ | 88% | 30/34 |
| Lever | ████████░░ | 83% | 15/18 |
| Ashby | █████████░ | 89% | 8/9 |
| Workday | ██████░░░░ | 60% | 3/5 |

Each row: label (mono 11px/600) + Progress bar + percentage (mono 11px) + count (mono 10px, t400)

**MVP:** Static placeholder data. Later: connect to ATS breakdown from dashboard summary endpoint.

### Page Assembly

**File:** `frontend/src-v2/pages/analytics.tsx`

```
[Stats Row — 4 equal columns]
[ATS Success Rate Card — full width]
```

---

## 8.3 Settings

### API Endpoints

| Action | Endpoint |
|--------|----------|
| User info | `GET /api/auth/me` |
| Profile | `GET /api/profile` |

### Components

**Subscription Card:** `frontend/src-v2/components/settings/subscription-card.tsx`

```
Card with CardHeader "SUBSCRIPTION"
├── Tier Label: "BUSINESS CLASS" (pri color, mono 11px/600)
├── Price: "$49/mo" (mono 22px/700)
├── Upgrade Button (primary variant)
└── Usage Bar:
    Label: "68/100 applications this month"
    Progress bar at 68%
```

**Account Card:** `frontend/src-v2/components/settings/account-card.tsx`

```
Card with CardHeader "ACCOUNT"
├── Email: user.email
├── Role: user.role
├── Member since: formatted date
└── Logout button (danger variant)
```

All placeholder content — billing is not implemented yet.

### Page Assembly

**File:** `frontend/src-v2/pages/settings.tsx`

```
[Subscription Card — full width or 1/2]
[Account Card — full width or 1/2]
```

---

## Verification Checklist

### Tracker
- [ ] Stats row shows 5 cards with correct data
- [ ] Application table loads with data
- [ ] Table headers render correctly
- [ ] Rows show company logo, position, ATS, match, status, date
- [ ] Row hover highlights
- [ ] Row click opens SidePanel
- [ ] Pagination works
- [ ] Both themes correct

### Analytics
- [ ] Stats row shows 4 cards
- [ ] ATS success table shows with progress bars
- [ ] Read-only page (no actions)
- [ ] Both themes correct

### Settings
- [ ] Subscription card shows placeholder tier and pricing
- [ ] Usage bar renders
- [ ] Account card shows user email and role
- [ ] Logout button works
- [ ] Both themes correct
