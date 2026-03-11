# Phase 10: Polish

> **Depends on:** All previous phases (0-9)
> **Blocks:** Nothing (final phase)
> **Cannot be parallelized** — runs after all pages are built

---

## Goal

Add loading states, error handling, empty states, responsive design, performance optimizations, and final visual polish across all pages.

---

## Steps

### 10.1 Loading States

**Skeleton Components:** `frontend/src-v2/components/ui/skeleton.tsx`

Create skeleton shimmer components matching the shape of real content:
- `SkeletonStatCard` — rectangle with shimmer animation
- `SkeletonJRow` — row with circle + lines shimmer
- `SkeletonCard` — generic card skeleton
- `SkeletonTable` — table rows shimmer

**Apply across pages:**
- Dashboard: 4 skeleton stat cards + skeleton pipeline card while loading
- Job Radar: skeleton job cards while loading
- Flight Queue: skeleton JRows while loading
- Profile: skeleton contact card + resume card while loading
- Tracker: skeleton table rows while loading

**Button loading states:**
- Apply/Skip/Approve/Reject buttons show loading spinner when mutation is pending
- Disable button during loading
- Use `loading` prop on Button component

**Shimmer animation:**
```css
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
```

### 10.2 Error Handling

**Toast Notifications:** `frontend/src-v2/components/ui/toast.tsx`

Simple toast system:
- Positioned top-right, stacked
- Success toast: `okBg` background, `okDim` text, Check icon
- Error toast: `failBg` background, `failDim` text, X icon
- Auto-dismiss after 5 seconds
- Manual dismiss via X button

**Zustand toast store:** `frontend/src-v2/stores/toast-store.ts`
```tsx
interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}
```

**API Error Handling:**
- Wrap TanStack Query error callbacks to show toasts
- 401: attempt refresh, then redirect to login (already in api.ts)
- 400/409: show error message from `detail` field
- 500: show "Something went wrong. Please try again."
- Network error: show "Connection lost. Check your internet."

**Inline Error Messages:**
- Form validation errors below inputs (fail color, mono 10px)
- Use Zod + React Hook Form for validation where needed

### 10.3 Empty States

Create empty state components for each page:

| Page | Condition | Message |
|------|-----------|---------|
| Dashboard (no data) | `stats.total === 0` | Show zero values, not empty state |
| Job Radar (no jobs) | Empty job list | "No new jobs. Check back soon or adjust your targeting." + Target icon |
| Queue (empty tab) | Tab has 0 items | "No applications in this category." |
| Queue (review, nothing pending) | 0 pending_review | "All caught up! No applications waiting for review." |
| Profile (no resume) | No `raw_resume_url` | Dashed upload zone (already handled) |
| Profile (no experience) | Empty experiences | "Add your work experience to improve match accuracy." |
| Profile (no skills) | Empty skills | "Add skills to help us match you with relevant jobs." |
| Tracker (no applications) | Empty table | "No applications yet. Start applying from Job Radar." |

**Styling:** Centered, icon (50% opacity, 40px) + message (mono 12px, t400) + optional action button

### 10.4 Responsiveness

**Breakpoints:**
- Desktop: >= 1024px (full layout)
- Tablet: 768-1023px (collapsible sidebar)
- Mobile: < 768px (stacked, hidden sidebar)

**Sidebar:**
- Desktop: always visible, fixed 240px
- Tablet/Mobile: hidden by default, slide-over overlay
- Toggle button in header (hamburger icon) for mobile
- Close on nav item click (mobile)

**Content grid adjustments:**
- Stats row: 4 cols → 2 cols on tablet → 1 col on mobile
- Dashboard pipeline + feed: side-by-side → stacked
- Profile/Autopilot 2-col: → stacked on tablet
- Tracker stats: 5 cols → 3+2 or stacked
- Job cards: maintain layout but reduce padding

**SidePanel:**
- Desktop: 440px fixed right
- Mobile: full-width overlay

**Touch targets:** All interactive elements at least 44px tap target.

### 10.5 Performance

**Lazy Loading:**
```tsx
const DashboardPage = lazy(() => import('./pages/dashboard'));
const JobsPage = lazy(() => import('./pages/jobs'));
// ... etc
```

Wrap in `<Suspense fallback={<PageSkeleton />}>`.

**Memoization:**
- `React.memo()` on JRow components (many rendered in lists)
- `useMemo()` on expensive computations (match score colors, filtered lists)
- `useCallback()` on event handlers passed as props

**Debouncing:**
- Search input: 300ms debounce
- Tag input: 200ms debounce
- Config auto-save: 1000ms debounce

**Query Caching:**
- Job list: `staleTime: 30_000` (30s)
- Profile: `staleTime: 60_000` (1min)
- Application stats: `staleTime: 10_000` (10s)
- Auto-apply config: `staleTime: 30_000`

### 10.6 Page Transition Animations

Simple fade/slide-in animations for page content:

```css
.page-enter {
  animation: pageIn 0.3s ease-out;
}

@keyframes pageIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Apply to main content wrapper on route change.

### 10.7 Final Visual Audit

- [ ] All colors match design system exactly
- [ ] Typography scale is consistent (check every page)
- [ ] Spacing is consistent (gap sizes, padding)
- [ ] Border radii are consistent (8px buttons/inputs, 12px cards)
- [ ] Shadows are correct
- [ ] Icons are all aligned and consistent size
- [ ] JetBrains Mono loads correctly (not fallback font)
- [ ] Both dark and light themes are complete
- [ ] No flicker on theme toggle
- [ ] Sidebar always stays dark in light mode

---

## Verification Checklist

- [ ] Skeleton loading states show on every page while data loads
- [ ] Button loading spinners work on all action buttons
- [ ] Error toasts appear on API failures
- [ ] Inline form errors show correctly
- [ ] Token refresh works silently on 401
- [ ] Empty states show for all empty-data scenarios
- [ ] Sidebar collapses on mobile/tablet
- [ ] Content stacks correctly on smaller screens
- [ ] SidePanel is full-width on mobile
- [ ] Touch targets are 44px+
- [ ] Pages lazy-load (check network tab)
- [ ] Search debounces correctly
- [ ] No unnecessary re-renders (React DevTools)
- [ ] Page transitions are smooth
- [ ] Visual audit passes for all pages in both themes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
