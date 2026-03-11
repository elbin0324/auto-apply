# Phase 2: Shared Components

> **Depends on:** Phase 0 (theme system)
> **Blocks:** Phases 3-9 (all pages use these components)
> **Parallelizable with:** Phase 1 (app shell), Phase BE (backend mods)

---

## Goal

Build the complete reusable component library from `docs/02-COMPONENT_LIBRARY.md`. Every component uses theme tokens, works in both dark and light modes. After this phase, a kitchen sink page demonstrates all components.

---

## Steps

### 2.1 Led Component

**File:** `frontend/src-v2/components/ui/led.tsx`

```tsx
interface LedProps {
  color?: "pri" | "ok" | "warn" | "fail" | "muted";
  size?: number; // default 6
}
```

- Circular dot with `border-radius: 50%`
- Background color resolved from theme token
- Box-shadow glow: `0 0 {size}px {color}55`
- Inline styles (needs dynamic color from theme)

### 2.2 Badge Component

**File:** `frontend/src-v2/components/ui/badge.tsx`

```tsx
interface BadgeProps {
  color?: "pri" | "ok" | "warn" | "fail" | "muted";
  children: React.ReactNode;
}
```

- Mono font, 10px, weight 600, letter-spacing 0.04em, uppercase
- Background: `{color}Bg` token, Text: `{color}Dim` token, Border: `1px solid {color}Border`
- Border-radius: 4px, padding: 3px 10px, white-space: nowrap

### 2.3 Card + CardHeader Components

**File:** `frontend/src-v2/components/ui/card.tsx`

**Card:**
```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
```
- Background: `bgCard`, border: `1px solid border`, radius: 12px
- Box-shadow: `sh1`, overflow: hidden

**CardHeader:**
```tsx
interface CardHeaderProps {
  title: string;
  count?: string | number;
  right?: React.ReactNode;
}
```
- Background: `bgInset`, padding: 12px 18px, bottom border: `borderSubtle`
- Title: mono 11px/600, uppercase, 0.08em, `t500` color
- Count badge: mono 10px, `bgCard` bg, `t400` text, 4px radius, `border` outline

### 2.4 Button Component

**File:** `frontend/src-v2/components/ui/button.tsx`

```tsx
interface ButtonProps {
  variant?: "primary" | "ghost" | "success" | "danger";
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
```

**Variants:**
| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| primary | `pri` | `bgDeep` | none |
| ghost | transparent | `t700` | `1px solid border` |
| success | `okBg` | `okDim` | `1px solid okBorder` |
| danger | `failBg` | `failDim` | `1px solid failBorder` |

Shared: mono 11px/600, 0.03em, uppercase, padding 9px 18px, radius 6px, cursor pointer
Icon rendered inline before children with 6px gap

### 2.5 StatCard Component

**File:** `frontend/src-v2/components/ui/stat-card.tsx`

```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
}
```

- Wraps in `Card`
- Label: mono 10px/600, uppercase, 0.08em, `t400`
- Value: mono 26px/700, -0.02em, `t900`
- Change: mono 10px, `okDim` color
- Icon in top-right at 50% opacity

### 2.6 Progress Component

**File:** `frontend/src-v2/components/ui/progress.tsx`

```tsx
interface ProgressProps {
  pct: number; // 0-100
  color?: string; // default pri
  height?: number; // default 5
}
```

- Track: `height`px, `bgMuted`, rounded full
- Fill: same height, `color` bg, width `pct%`, rounded full, transition width

### 2.7 MatchDot Component

**File:** `frontend/src-v2/components/shared/match-dot.tsx`

```tsx
interface MatchDotProps {
  score: number; // 0-100
  size?: "sm" | "md"; // default "md"
}
```

- Resolve color from score tier (90+ pri, 75+ ok, 60+ warn, else muted)
- Resolve label (Exceptional, Strong, Good, Moderate, Weak, Poor)
- Dot: 8px (sm) or 10px (md) circle with color + glow shadow
- Score number: mono 11px/700 (sm: 10px)
- Label: mono 9px/400, 0.03em, uppercase, `t400`
- **Fixed width**: 100px (sm) or 120px (md) for grid alignment

### 2.8 Input Component

**File:** `frontend/src-v2/components/ui/input.tsx`

```tsx
interface InputProps {
  label: string;
  value: string;
  mono?: boolean;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}
```

- Label: mono 10px/600, 0.06em, uppercase, `t400`, margin-bottom 6px
- Input: `bgInset` bg, `border` border, 6px radius, padding 8px 12px
- Value font: mono (if `mono` prop) or sans 13px/400
- Read-only mode: lighter styling, no cursor

### 2.9 Select Component

**File:** `frontend/src-v2/components/ui/select.tsx`

```tsx
interface SelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
  disabled?: boolean;
}
```

- Same label styling as Input
- Select element with `bgInset` bg, `border` border, 6px radius

### 2.10 JRow (Job Row) Component

**File:** `frontend/src-v2/components/shared/job-row.tsx`

```tsx
interface JRowProps {
  job: {
    id: string;
    company: string;
    title: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    match_score?: number;
    application_status?: string;
    tags?: string[];
  };
  onClick?: () => void;
  actions?: React.ReactNode; // Optional action buttons below row
}
```

**Grid layout:** `44px 1fr 120px 80px` (logo, info, match, status)

**Elements:**
1. **Logo:** 40x40 rounded square (8px radius), `bgDeep` bg, 3-letter company code in mono 10px bold `pri`
2. **Info:** Title (sans 13px/600 `t900`, truncate) + meta line (mono 11px `t400`: "Company / Location / Salary", truncate)
3. **Match:** `MatchDot` size="sm" (120px fixed width)
4. **Status:** `Badge` with status color mapping, or empty if no status

**Hover:** border changes to `priBorder`, subtle glow `0 0 0 2px priGlow`
**Cursor:** pointer

### 2.11 SidePanel Component

**File:** `frontend/src-v2/components/shared/side-panel.tsx`

```tsx
interface SidePanelProps {
  job: Job | null;
  application?: Application | null;
  matchBreakdown?: MatchBreakdown | null;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (jobId: string) => void;
  onSkip?: (jobId: string) => void;
  onApprove?: (appId: string) => void;
  onReject?: (appId: string) => void;
}
```

**Structure (440px wide, fixed right, z-index 200):**
1. Header bar: `bgInset`, "Job Detail" or "Application Detail" title, X close button
2. Company block: 48px logo + title (16px/700) + company (mono 12px)
3. Status badge (if application exists)
4. Meta tags: flex-wrap of mono 10px tags (location, work type, job type, level, salary) on `bgInset` bg
5. Match score: 40px circle with score, tier-colored border, label + "/100"
6. Summary: "SUMMARY" section header + body text (sans 13px, `t700`, line-height 1.7)
7. Fit Analysis:
   - "STRENGTHS" sub-header (`okDim`), each with Check icon + text
   - "CONCERNS" sub-header (`warnDim`), each with dot + text
8. Key Matches / Key Gaps: 2-column grid, small dots + mono text
9. Action buttons (pinned to bottom via `margin-top: auto`):
   - New job: "Apply" (primary) + "Skip" (ghost)
   - Pending review: "Approve" (success) + "Reject" (danger)

**Overlay:** Fixed full-screen `rgba(0,0,0,.3)`, z-index 150, click to close
**Close triggers:** X button, overlay click, Escape key

### 2.12 Kitchen Sink Test Page (temporary)

**File:** `frontend/src-v2/pages/kitchen-sink.tsx`

Display all components in both themes:
- All Led colors and sizes
- All Badge variants
- Card + CardHeader
- All Button variants
- StatCard examples
- Progress at various percentages
- MatchDot at different score tiers
- Input and Select
- JRow with sample job data
- SidePanel (triggered by button)

Add a temporary route `/kitchen-sink` for this page.

---

## Component Index

When complete, the components directory should look like:

```
frontend/src-v2/components/
├── ui/
│   ├── led.tsx
│   ├── badge.tsx
│   ├── card.tsx        (Card + CardHeader)
│   ├── button.tsx
│   ├── stat-card.tsx
│   ├── progress.tsx
│   ├── input.tsx
│   └── select.tsx
├── shared/
│   ├── match-dot.tsx
│   ├── job-row.tsx
│   └── side-panel.tsx
└── layout/
    └── (from Phase 1)
```

---

## Verification Checklist

- [ ] All components render correctly in dark theme
- [ ] All components render correctly in light theme
- [ ] Led glow effect visible for all colors
- [ ] Badge shows correct color variants
- [ ] Button variants all styled correctly
- [ ] StatCard shows label, value, change, icon
- [ ] Progress bar fills to correct percentage
- [ ] MatchDot shows correct color and label per score tier
- [ ] MatchDot has fixed width (no layout shift in grids)
- [ ] JRow grid alignment correct (logo, info, match, status columns)
- [ ] JRow hover effect works
- [ ] SidePanel slides in from right, overlay darkens
- [ ] SidePanel closes on X, overlay click, and Escape
- [ ] Kitchen sink page demonstrates all components
- [ ] `pnpm typecheck` passes
