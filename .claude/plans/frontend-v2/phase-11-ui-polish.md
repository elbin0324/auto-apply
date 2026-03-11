# Phase 11 — UI Polish Pass

> Targeted visual fixes across Dashboard, Job Radar, Resume Hangar, Tracker, and Settings.

---

## 11.1 Dashboard — Card Outlines & Icon Colors

**Files:** `components/ui/stat-card.tsx`, `components/dashboard/stats-row.tsx`, `components/ui/card.tsx` (verify)

**Changes:**
- **StatCard outline:** The `Card` component already has `border border-border-main`, so stat cards inherit a thin outline. Verify this renders visibly. If the border is too subtle, consider making it slightly more prominent (e.g., `border-border-subtle` → `border-border-main`).
- **Job cards outline:** Dashboard pipeline cards should also show their card border clearly — verify `Card` base class is being used consistently.
- **Icons should be primary, not grey:** In `stats-row.tsx`, the `StatCard` currently renders icons in the default `text-t-400 opacity-50` styling (line 14 of stat-card.tsx). Change:
  - In `stat-card.tsx`: remove `opacity-50 text-t-400` from the icon wrapper, replace with `text-pri` so icons render in primary teal.

---

## 11.2 Job Radar — Search Bar Font & Custom Dropdowns

**Files:** `components/jobs/job-filters.tsx`, `components/ui/select.tsx`

**Changes:**
1. **Search bar font:** Change the search input `font-sans` → `font-mono` in `job-filters.tsx` (line 69) so the search text is monospaced.

2. **Custom Select dropdown (replace native `<select>`):** Replace the native `<select>` in `select.tsx` with a custom React dropdown:
   - Clickable trigger div showing selected value (styled like current select, but with `font-mono`)
   - Dropdown menu: absolutely positioned panel with `bg-bg-card border border-border-main rounded-md shadow-lg`
   - Each option: `px-3 py-2 font-mono text-[13px] text-t-900 hover:bg-bg-inset cursor-pointer`
   - Active option highlighted with `text-pri`
   - Click outside to close (useEffect with document click listener)
   - Chevron down icon in trigger
   - This replaces the native `<select>` element entirely

3. **Dropdowns should also use `font-mono`** — ensure the trigger text and options all use mono.

---

## 11.3 Job Radar — Card Spacing & Apply/Skip Buttons

**Files:** `pages/jobs.tsx`, `components/jobs/job-card.tsx`

**Changes:**
1. **Vertical spacing between job cards:** Currently job cards are in a single `Card` wrapper with `divide-y divide-border-subtle`. Instead, remove the wrapping Card and render each `JobCard` inside its own `Card` with spacing between them. In `pages/jobs.tsx`:
   - Replace the wrapping `<Card><div className="divide-y ...">` with a `<div className="space-y-3">` so each card is separate with background visible between them.
   - Wrap each `JobCard` in its own `<Card>` for individual outlines.

2. **Show Apply, remove Skip button:** In `job-card.tsx`:
   - Keep the "Apply" button
   - Remove the "Skip" button entirely
   - Can simplify the actions column to just the Apply button

---

## 11.4 Resume Hangar — Action Button Outlines & Upload Box

**Files:** `components/profile/resume-card.tsx`, `components/profile/resume-display.tsx`, `components/profile/contact-card.tsx`, `components/profile/experience-editor.tsx`

**Changes:**
1. **Action buttons "Edit", "Upload", "Add" should be outlined with grey:** These buttons use `variant="ghost"`. Either:
   - Add a new `variant="outline"` to `button.tsx` with `border border-border-main text-t-500 hover:border-pri hover:text-pri`, OR
   - Modify the ghost variant to include a border.
   - Apply to: ContactCard "Edit", ResumeCard "Upload", ExperienceEditor "+ Add" buttons.

2. **Resume section upload box:** When a resume IS uploaded, instead of showing just the filename/parsed badge inline, show a rounded upload box styled per the reference design (line 106 of applypilot-v41.jsx):
   - Container: `border border-dashed border-pri rounded-[10px] bg-pri-bg p-7 text-center`
   - Upload icon centered, colored `text-pri`
   - Filename below icon, `font-mono text-[12px] font-semibold text-t-900`
   - File size + date below that, `font-mono text-[10px] text-t-400`
   - `<Badge color="ok">PARSED</Badge>` below
   - This replaces the current `ResumeInfo` component's layout (the flat row layout)

---

## 11.5 Tracker — Colored Stat Cards

**Files:** `components/tracker/tracker-stats.tsx`

**Changes:**
- Replace the current left-border style with colored card fills matching the reference design (line 120 of applypilot-v41.jsx):
  - **Total:** `bg-bg-inset` background (neutral)
  - **Landed:** `bg-ok-bg` background (light green/blue)
  - **Pending:** `bg-warn-bg` background (light amber)
  - **Failed:** `bg-fail-bg` background (light red)
  - **Success:** `bg-ok-bg` background (light green/blue)
- Remove `borderLeftWidth: 3` inline styles.
- Keep the thin card outline via `Card` wrapper (standard `border border-border-main`).
- Center-align text in each card (matching reference: `text-center`).
- Use `StatCard` if possible by adding a `bgClass` prop, or just customize the inline rendering to use colored backgrounds.

---

## 11.6 Settings — Upgrade Button Inline with Plan Name

**Files:** `components/settings/subscription-card.tsx`

**Changes:**
- Match the reference layout (line 126 of applypilot-v41.jsx): The plan name ("BUSINESS CLASS") and price are on the left, with the Upgrade button on the right, all in the **same row** using `flex items-center justify-between`.
- Current layout has them stacked vertically with Upgrade as a full-width button below the price. Restructure to:
  ```
  [BUSINESS CLASS]          [Upgrade button]
  [$49 /mo                              ]
  [68/100 ----progress-bar---- 68%      ]
  ```
- The Upgrade button should use `variant="ghost"` (outline style) matching the reference.

---

## Step Execution Order

1. **11.1** — Dashboard outlines & icon colors (quick, isolated)
2. **11.4.1** — Add outline button variant (needed by Resume Hangar + used elsewhere)
3. **11.2** — Job Radar search font + custom dropdown (most complex step)
4. **11.3** — Job Radar card spacing + remove Skip
5. **11.4.2** — Resume Hangar upload box redesign
6. **11.5** — Tracker colored cards
7. **11.6** — Settings upgrade button layout

---

## Acceptance Criteria

- [ ] Dashboard stat cards and job cards have visible thin outlines
- [ ] Dashboard stat card icons are primary (teal), not grey
- [ ] Job Radar search bar uses monospace font
- [ ] Job Radar dropdowns are custom React components, not native selects
- [ ] Job Radar dropdowns use monospace font and app styling
- [ ] Job cards have visible spacing between them (dark background shows through)
- [ ] Job cards show Apply button only (no Skip)
- [ ] Profile page action buttons (Edit, Upload, Add) have grey outlines
- [ ] Resume section shows upload-box style with dashed primary border when resume exists
- [ ] Tracker stat cards use colored backgrounds instead of left borders
- [ ] Settings Upgrade button is in same row as plan name, right-aligned
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
