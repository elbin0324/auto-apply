# Phase 7: Autopilot Config

> **Depends on:** Phase 1 (app shell), Phase 2 (shared components)
> **Blocks:** Nothing (independent page)
> **Parallelizable with:** Phases 3-6, 8-9

---

## Goal

Build the Autopilot page with master engage/disengage control, job targeting configuration, and apply mode selection with threshold/limit sliders.

---

## API Endpoints Used

| Action | Endpoint | Status |
|--------|----------|--------|
| Load config | `GET /api/auto-apply/config` | Ready |
| Update config | `PUT /api/auto-apply/config` | Ready |
| Start autopilot | `POST /api/auto-apply/start` | Ready |
| Stop autopilot | `POST /api/auto-apply/stop` | Ready |
| Queue status | `GET /api/auto-apply/queue` | Ready |
| Stats (today count) | `GET /api/applications/stats` | Partial (no `today`) |

---

## Steps

### 7.1 Auto-Apply Data Hooks

**File:** `frontend/src-v2/hooks/use-auto-apply.ts`

```tsx
export function useAutoApplyConfig() {
  return useQuery({
    queryKey: ['auto-apply-config'],
    queryFn: () => api.get('/api/auto-apply/config'),
  });
}

export function useUpdateAutoApplyConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AutoApplyConfigUpdate) => api.put('/api/auto-apply/config', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auto-apply-config'] }),
  });
}

export function useStartAutopilot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/api/auto-apply/start'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-apply-config'] });
      queryClient.invalidateQueries({ queryKey: ['queue-status'] });
    },
  });
}

export function useStopAutopilot() { /* similar */ }
```

### 7.2 Engage/Disengage Control Card

**File:** `frontend/src-v2/components/autopilot/engage-card.tsx`

**Layout:**
```
Card (full width, conditional priBorder when engaged)
├── Main Area:
│   ├── Icon Container (44x44)
│   │   Running: priBg background, Plane icon in pri
│   │   Stopped: bgInset background, Plane icon in t400
│   ├── Status Text:
│   │   Running: "AUTOPILOT ENGAGED" (mono 14px/700, pri)
│   │   Stopped: "AUTOPILOT DISENGAGED" (mono 14px/700, t400)
│   └── Toggle Button:
│       Running: "DISENGAGE" (danger variant) with Stop icon
│       Stopped: "ENGAGE" (primary variant) with Play icon
│
└── Stats Footer Bar (bgInset background, flex row):
    QUEUE: {count}  |  REVIEW: {count}  |  IN-FLIGHT: {count}  |  TODAY: {count}/{limit}
```

**Data sources:**
- `is_active` from config
- Queue/review/in-flight from `GET /api/auto-apply/queue`
- Today count: `this_week` from stats (or `today` when available)
- Daily limit from config

**Actions:**
- Engage: `POST /api/auto-apply/start` → updates config, starts polling
- Disengage: `POST /api/auto-apply/stop` → updates config, stops polling

### 7.3 Targeting Card

**File:** `frontend/src-v2/components/autopilot/targeting-card.tsx`

**Layout:**
```
Card with CardHeader "TARGETING"
├── Target Titles (tag input)
│   Label: "JOB TITLES" (mono 10px, uppercase)
│   Tags: [Product Engineer ×] [Full Stack ×] [Senior SWE ×]
│   Input: type to add, Enter to confirm
│
├── Locations (tag input)
│   Label: "LOCATIONS"
│   Tags: [Toronto ×] [Remote ×]
│
└── Excluded Companies (tag input, red-styled)
    Label: "EXCLUDED COMPANIES"
    Tags with failBg/failDim styling
```

**Tag Input Component:** `frontend/src-v2/components/ui/tag-input.tsx`

```tsx
interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  variant?: "default" | "danger"; // danger = red tags for excluded
}
```

- Tags are removable chips (× button)
- Input field for adding new tags
- Enter key or comma to add
- Backspace on empty input removes last tag

**Save:** Auto-save on change (debounced 1s) via `PUT /api/auto-apply/config`

### 7.4 Apply Mode Card

**File:** `frontend/src-v2/components/autopilot/mode-card.tsx`

**Layout:**
```
Card with CardHeader "APPLY MODE"
├── Mode Option: SAFE
│   Shield icon + "SAFE" title + "All to review" description
│   Selected: 2px pri border, priBg bg, pri icon/text, "ACTIVE" badge
│   Unselected: 1px border, bgCard bg, muted icon
│
├── Mode Option: HYBRID
│   Sliders icon + "HYBRID" + "Above threshold auto-queues"
│
├── Mode Option: FULL AUTO
│   Plane icon + "FULL AUTO" + "All auto-submit"
│
├── Threshold Slider (shown when HYBRID selected)
│   Label: "AUTO-APPLY THRESHOLD"
│   Range: 15-100, current value displayed
│   Slider with pri color for filled portion
│
└── Daily Limit Slider
    Label: "DAILY APPLY LIMIT"
    Range: 1-100, current value displayed
```

**Mode selection:** Click to select, highlighted with teal styling + "ACTIVE" badge.

**Sliders:** Custom range input styled with:
- Track: `bgMuted`, 5px height, rounded
- Filled portion: `pri` color
- Thumb: 16px circle, `pri` background, white border

**Save:** Auto-save on change via `PUT /api/auto-apply/config`

### 7.5 Autopilot Page Assembly

**File:** `frontend/src-v2/pages/autopilot.tsx`

**Layout:**
```
[Engage/Disengage Control Card — full width]
[Targeting Card (1fr) | Apply Mode Card (1fr)]    — 2-column grid
```

Grid: full width engage card, then `grid grid-cols-2 gap-3.5` for config cards.

---

## Verification Checklist

- [ ] Config loads on page visit
- [ ] Engage card shows correct status (engaged/disengaged)
- [ ] Engage button starts autopilot, updates UI
- [ ] Disengage button stops autopilot, updates UI
- [ ] Card border turns teal when engaged
- [ ] Stats footer shows queue/review/in-flight/today counts
- [ ] Target titles tag input works (add/remove tags)
- [ ] Locations tag input works
- [ ] Excluded companies shows with red styling
- [ ] Mode selector highlights active mode
- [ ] Clicking a mode selects it
- [ ] Threshold slider appears only in HYBRID mode
- [ ] Threshold slider range 15-100, saves on change
- [ ] Daily limit slider range 1-100, saves on change
- [ ] Config changes persist (auto-save debounced)
- [ ] Both themes render correctly
