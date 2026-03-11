# ApplyPilot Routing & State Management

> Navigation structure, authentication gates, theme state, global polling, and sidepanel behavior.

---

## 1. Route Structure

| Route | Page | Auth Required | Sidebar Shown |
|-------|------|--------------|---------------|
| `/` | Redirect → `/dashboard` or `/onboarding` | Yes | — |
| `/dashboard` | Dashboard (Flight Ops) | Yes | Yes |
| `/jobs` | Job Radar | Yes | Yes |
| `/queue` | Flight Queue | Yes | Yes |
| `/profile` | Resume Hangar | Yes | Yes |
| `/autopilot` | Autopilot Config | Yes | Yes |
| `/tracker` | Flight Tracker | Yes | Yes |
| `/analytics` | Analytics | Yes | Yes |
| `/settings` | Settings | Yes | Yes |
| `/onboarding` | Onboarding (Pre-flight) | Yes | **No** (full-page) |
| `/login` | Login page | No | No |
| `/signup` | Signup page | No | No |

---

## 2. Authentication Flow

### Token Management
- Supabase Auth handles JWT tokens
- Store `access_token` and `refresh_token` from login/signup response
- Attach to every API call: `Authorization: Bearer {access_token}`
- On `401` response: call `supabase.auth.refreshSession()`, retry once
- On refresh failure: redirect to `/login`

### Auth Gate (App-Level)
On every route load:
1. Check if Supabase session exists (client-side)
2. If no session → redirect to `/login`
3. If session exists → `GET /api/auth/me`
4. If `onboarding_completed === false` → redirect to `/onboarding`
5. Otherwise → render requested page

### OAuth Flow
1. User clicks "Sign in with Google"
2. `POST /api/auth/oauth/google` → get redirect URL
3. Redirect user to Google consent screen
4. Google redirects back to `/api/auth/oauth/callback?code=...`
5. Backend exchanges code, redirects to `/?access_token=...`
6. Frontend extracts token from URL, stores in Supabase client
7. Normal auth gate proceeds

---

## 3. Theme State

### Storage
- Theme preference (`"dark"` | `"light"`) stored in `localStorage` under key `applypilot-theme`
- Default: `"dark"` if no preference stored
- Read on app initialization, before first render (to prevent flash)

### Toggle
- Sun/moon button in page header
- On click: toggle theme, update localStorage, re-render

### Implementation
Use React Context:
```
ThemeProvider wraps entire app
  → provides current theme object (all tokens)
  → provides toggle function
  → every component calls useTheme() to get tokens
```

Sidebar and systems bar always use `tw*` (white-on-dark) tokens regardless of theme, since they stay dark in both modes.

---

## 4. Global State

### User State
Loaded once on auth gate, available globally:
- `user`: id, email, role, onboarding_completed
- `profile`: full profile data (lazy-loaded on profile page)
- `autoApplyConfig`: loaded when needed (autopilot page, dashboard)

### Navigation State
- `currentPage`: active page ID (synced to URL)
- `sidePanel`: `{ isOpen: boolean, job: JobData | null }` — global since any page can open it

### Queue Polling
When `autoApplyConfig.is_active === true`:
- Poll `GET /api/auto-apply/queue` every 10 seconds
- Update sidebar badges (queue count, review count)
- If `in_progress_count > 0`, also poll individual in-progress applications every 5 seconds for phase updates

### Data Refresh Triggers
- After `POST /api/jobs/{id}/queue` (Apply): refetch job radar list + queue counts
- After `POST /api/auto-apply/review/{id}` (Approve/Reject): refetch queue page
- After `POST /api/auto-apply/start`: start polling, refetch config
- After `POST /api/auto-apply/stop`: stop polling, refetch config
- After `POST /api/profile/resume/parse`: refetch profile
- After onboarding completion: redirect to dashboard, fetch everything fresh

---

## 5. SidePanel Behavior

### Opening
- Triggered by clicking any job row (JRow), table row, or "Preview" button
- Pass the full job/application object to the panel
- If only a job ID is available, fetch `GET /api/jobs/{id}` and `GET /api/jobs/{id}/match`
- If application, also load `GET /api/applications/{id}` for generated_application data

### Closing
- Click the X button in panel header
- Click the overlay backdrop
- Press Escape key
- Navigate to a different page (sidebar click)

### URL Integration (Optional)
Consider adding `?job={id}` or `?app={id}` query param when panel is open, so the state is shareable/bookmarkable. On page load, if param exists, auto-open panel.

### Panel Content Adapts to Context
- **New job (no status):** Shows match analysis + "Apply" / "Skip" buttons
- **Pending review:** Shows match analysis + generated answers (if available) + "Approve" / "Reject"
- **In-progress:** Shows match analysis + live progress phases
- **Applied/Failed:** Shows match analysis + outcome details (screenshot proof, error message)

---

## 6. Error Handling

### API Errors
- `400` Bad Request: show inline error message near the triggering action
- `401` Unauthorized: attempt token refresh, retry once, then redirect to login
- `403` Forbidden: show "access denied" — shouldn't happen for regular users
- `404` Not Found: show empty state or "not found" message
- `409` Conflict: show specific message (e.g., "Already applied to this job")
- `500` Server Error: show generic error toast, log to console

### Loading States
Every data fetch should show:
- Initial load: skeleton/shimmer in the component shape
- Subsequent loads (tab switch, filter change): keep existing data visible, show subtle loading indicator
- Actions (apply, approve): show loading state on the button, disable it

### Empty States
Each page/section has a specific empty state:
- Job Radar (no new jobs): "No new jobs. All have been processed."
- Queue (empty tab): "No applications in this category."
- Dashboard (no data): Show zero values, not empty state
