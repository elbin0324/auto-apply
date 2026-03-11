# Phase 5: Flight Queue

> **Depends on:** Phase 1 (app shell), Phase 2 (shared components)
> **Blocks:** Nothing (independent page)
> **Parallelizable with:** Phases 3, 4, 6-9
> **Complexity:** HIGH — this is the most complex page

---

## Goal

Build the Flight Queue page for managing applications across their lifecycle: review pending items, monitor in-flight applications, browse queued/landed/failed history, and preview/edit AI-generated answers.

---

## API Endpoints Used

| Action | Endpoint |
|--------|----------|
| Tab counts | `GET /api/applications/stats` + `GET /api/auto-apply/queue` |
| List by status | `GET /api/applications?status={status}` |
| In-flight progress | `GET /api/applications/{id}` (poll 3-5s) |
| Approve | `POST /api/auto-apply/review/{id}?action=approve` |
| Reject | `POST /api/auto-apply/review/{id}?action=reject` |
| Batch approve/reject | Sequential calls (or `POST /api/auto-apply/review/batch` from Phase BE) |
| Preview answers | `GET /api/applications/{id}` → `generated_application` |
| Submit edited answers | `POST /api/applications/{id}/submit` |

---

## Steps

### 5.1 Queue Data Hooks

**File:** `frontend/src-v2/hooks/use-applications.ts`

```tsx
export function useApplications(status?: string, page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['applications', status, page],
    queryFn: () => api.get('/api/applications', { params: { status, page, per_page: perPage } }),
  });
}

export function useApplicationStats() {
  return useQuery({
    queryKey: ['application-stats'],
    queryFn: () => api.get('/api/applications/stats'),
  });
}

export function useQueueStatus() {
  return useQuery({
    queryKey: ['queue-status'],
    queryFn: () => api.get('/api/auto-apply/queue'),
    refetchInterval: 10_000, // poll every 10s
  });
}
```

**File:** `frontend/src-v2/hooks/use-review-actions.ts`

```tsx
export function useReviewActions() {
  const queryClient = useQueryClient();

  const approve = useMutation({
    mutationFn: (appId: string) => api.post(`/api/auto-apply/review/${appId}?action=approve`),
    onSuccess: () => invalidateAll(queryClient),
  });

  const reject = useMutation({
    mutationFn: (appId: string) => api.post(`/api/auto-apply/review/${appId}?action=reject`),
    onSuccess: () => invalidateAll(queryClient),
  });

  const batchAction = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: 'approve' | 'reject' }) => {
      // Try batch endpoint first, fall back to sequential
      return Promise.all(ids.map(id => api.post(`/api/auto-apply/review/${id}?action=${action}`)));
    },
    onSuccess: () => invalidateAll(queryClient),
  });

  return { approve, reject, batchAction };
}
```

### 5.2 In-Flight Monitor

**File:** `frontend/src-v2/components/queue/in-flight-monitor.tsx`

Only renders when `in_progress_count > 0`.

**Layout:**
```
Card with priBg background, priBorder border
├── Header: "LIVE" + Led(pri) glow
├── For each in-progress application:
│   ├── Logo + Title + Company + ATS name
│   └── Progress Bar (5 segments)
│       NAV | EXTRACT | AI-GEN | FILL | SUBMIT
│       Filled segments = pri, unfilled = bgMuted
│       "3/5" indicator on right
```

**Progress phases mapping:**
```
navigating  → segment 1 (NAV)
extracting  → segment 2 (EXTRACT)
answering   → segment 3 (AI-GEN)
filling     → segment 4 (FILL)
submitting  → segment 5 (SUBMIT)
```

**Polling:** For each in-progress app, poll `GET /api/applications/{id}` every 3-5 seconds:
```tsx
useQuery({
  queryKey: ['application', id],
  queryFn: () => api.get(`/api/applications/${id}`),
  refetchInterval: 4_000,
  enabled: status === 'in_progress',
});
```

### 5.3 Tab Bar

**File:** `frontend/src-v2/components/queue/tab-bar.tsx`

5 tabs (no "ALL" tab):

| Tab | Status Filter | Color | Count Source |
|-----|--------------|-------|-------------|
| REVIEW | `pending_review` | `warn` | `queue.pending_review_count` |
| IN-FLIGHT | `in_progress` | `pri` | `queue.in_progress_count` |
| QUEUED | `queued` | `priDim` | `queue.queue_depth` |
| LANDED | `applied` | `ok` | `stats.applied` |
| FAILED | `failed` | `fail` | `stats.failed` |

**Styling:**
- Active tab: colored bg (tinted), colored border (bottom 2px), colored text, white count badge on colored bg
- Inactive tab: transparent bg, `t500` text, `bgMuted` count badge
- Labels: mono 9px/700, 0.1em, uppercase

```tsx
interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: Record<string, number>;
}
```

### 5.4 Review Tab Content

**File:** `frontend/src-v2/components/queue/review-list.tsx`

When REVIEW tab is active:

**Batch Actions Bar (top):**
- "Select All" / "Deselect" toggle button
- When items selected: selection count + "Approve All" (success btn) + "Reject All" (danger btn)

**Application List:**
Each item is a `JRow` with additional inline actions below:
- "Approve" (success btn, small) — `POST /api/auto-apply/review/{id}?action=approve`
- "Reject" (danger btn, small) — `POST /api/auto-apply/review/{id}?action=reject`
- "Preview" (ghost btn, small) — opens SidePanel with generated answers

**Selection state:** `Set<string>` of selected application IDs. Select All adds all visible IDs.

### 5.5 Standard Tab Content

**File:** `frontend/src-v2/components/queue/application-list.tsx`

For QUEUED, LANDED, FAILED tabs: simple list of `JRow` components.
- Click any row → open SidePanel
- Pagination at bottom
- Empty state: "No applications in this category."

### 5.6 Answer Preview in SidePanel

When "Preview" is clicked on a review item, or when viewing an extract_only application:

The SidePanel shows `generated_application` data:
- **Fields section:** Each form field with its label, type, and the AI-generated answer
- **Editable answers:** For extract_only apps, answers are editable text inputs
- **Submit button:** `POST /api/applications/{id}/submit` with `{ answers: { field_name: value } }`

**File:** `frontend/src-v2/components/queue/answer-preview.tsx`

```tsx
interface AnswerPreviewProps {
  fields: GeneratedApplicationField[];
  answers: GeneratedApplicationAnswer[];
  editable?: boolean;
  onSubmit?: (answers: Record<string, string>) => void;
}
```

### 5.7 Queue Page Assembly

**File:** `frontend/src-v2/pages/queue.tsx`

**Layout:**
```
[In-Flight Monitor — conditional]
[Tab Bar]
[Content based on active tab]
  - REVIEW → ReviewList with batch actions
  - IN-FLIGHT → ApplicationList (read-only, with progress)
  - QUEUED/LANDED/FAILED → ApplicationList
```

**State:**
- `activeTab` — defaults to "pending_review"
- `selectedIds` — Set for batch selection (REVIEW only)

**Tab switch:** Changes `status` param → refetches applications.

---

## Verification Checklist

- [ ] In-flight monitor shows when in_progress apps exist
- [ ] Progress phases render correctly (filled/unfilled segments)
- [ ] Progress updates via polling (3-5s)
- [ ] Tab bar shows correct counts
- [ ] Tab switching filters applications by status
- [ ] REVIEW tab shows approve/reject/preview inline actions
- [ ] Single approve/reject works (moves app to correct status)
- [ ] Batch select all/deselect works
- [ ] Batch approve/reject works for multiple items
- [ ] Preview opens SidePanel with generated answers
- [ ] Editable answers work for extract_only applications
- [ ] Submit edited answers works
- [ ] QUEUED/LANDED/FAILED tabs show correct applications
- [ ] Clicking any JRow opens SidePanel
- [ ] Empty states show for each tab
- [ ] Pagination works
- [ ] Both themes render correctly
