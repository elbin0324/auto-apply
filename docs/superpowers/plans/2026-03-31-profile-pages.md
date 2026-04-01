# Profile Pages Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build out the 4 profile section pages (Resume, Job Preferences, App Preferences, Account) with form-per-section architecture, surfacing all backend capabilities.

**Architecture:** Each profile sub-route renders a dedicated page component via the existing `profile.tsx` router. Each page is a vertical stack of Card sections that save independently. New hooks for education CRUD and application preferences. New components follow the ExperienceEditor/ExperienceForm pattern.

**Tech Stack:** React 19, TypeScript, TanStack Query, Tailwind CSS 4, shadcn/ui Card/Input/Button/TagInput/Select/Badge

**Spec:** `docs/superpowers/specs/2026-03-31-profile-pages-design.md`

---

## File Structure

**New files:**
- `frontend/src-v2/hooks/use-application-preferences.ts` — Read/write application preferences
- `frontend/src-v2/components/profile/resume-doc-card.tsx` — PDF preview, upload/replace, re-parse
- `frontend/src-v2/components/profile/summary-card.tsx` — Professional summary editor
- `frontend/src-v2/components/profile/education-editor.tsx` — Education list with add/edit/delete
- `frontend/src-v2/components/profile/education-form.tsx` — Inline form for education entries
- `frontend/src-v2/components/profile/custom-answers-editor.tsx` — Key-value row editor

**Modified files:**
- `frontend/src-v2/hooks/use-profile.ts` — Add `useUpdateEducation()` hook
- `frontend/src-v2/components/profile/contact-card.tsx` — Add website_url field
- `frontend/src-v2/pages/profile.tsx` — Rewrite to render full page content for each section

---

### Task 1: Add useUpdateEducation hook and useApplicationPreferences hooks

**Files:**
- Modify: `frontend/src-v2/hooks/use-profile.ts`
- Create: `frontend/src-v2/hooks/use-application-preferences.ts`

- [ ] **Step 1: Add useUpdateEducation to use-profile.ts**

Add the following after the `useUpdateSkills` function in `frontend/src-v2/hooks/use-profile.ts`:

```typescript
export function useUpdateEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (educations: unknown[]) => {
      const payload = (educations as Record<string, unknown>[]).map(
        ({ id: _id, profile_id: _pid, ...rest }) => rest,
      );
      return api.put("/api/profile/education", payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}
```

- [ ] **Step 2: Create use-application-preferences.ts**

Create `frontend/src-v2/hooks/use-application-preferences.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApplicationPreferences } from "@/types/profile";

export function useApplicationPreferences() {
  return useQuery({
    queryKey: ["application-preferences"],
    staleTime: 60_000,
    queryFn: () => api.get<ApplicationPreferences | null>("/api/profile/preferences"),
  });
}

export function useUpdateApplicationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ApplicationPreferences>) =>
      api.put<ApplicationPreferences>("/api/profile/preferences", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["application-preferences"] }),
  });
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -5`
Expected: Clean build.

- [ ] **Step 4: Commit**

```bash
git add frontend/src-v2/hooks/use-profile.ts frontend/src-v2/hooks/use-application-preferences.ts
git commit -m "feat: add useUpdateEducation and useApplicationPreferences hooks"
```

---

### Task 2: Create ResumeDocCard component

**Files:**
- Create: `frontend/src-v2/components/profile/resume-doc-card.tsx`

This replaces `ResumeCard` on the Resume page. It shows a PDF preview when a resume exists, with Replace and Re-parse buttons. Falls back to a drop zone when no resume is uploaded.

- [ ] **Step 1: Create resume-doc-card.tsx**

Create `frontend/src-v2/components/profile/resume-doc-card.tsx`:

```typescript
import { useState, useRef, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useResumeUpload } from "@/hooks/use-resume";
import { DropZone, formatFileSize } from "./resume-display";
import { Upload } from "@/icons";
import type { Profile } from "@/types/profile";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface ResumeDocCardProps {
  profile: Profile;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ResumeDocCard({ profile }: ResumeDocCardProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, parse } = useResumeUpload();
  const isProcessing = upload.isPending || parse.isPending;

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (file.type !== "application/pdf") {
        setError("Only PDF files are accepted.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`File exceeds ${formatFileSize(MAX_SIZE_BYTES)} limit.`);
        return;
      }
      upload.mutate(file, {
        onSuccess: () => parse.mutate(undefined),
        onError: () => setError("Upload failed. Please try again."),
      });
    },
    [upload, parse],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  const handleReplaceClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleReparse = useCallback(() => {
    parse.mutate(undefined);
  }, [parse]);

  const hasResume = !!profile.raw_resume_url;

  return (
    <Card>
      <CardHeader
        title="Resume"
        right={
          hasResume ? (
            <div className="flex gap-1.5">
              <Button variant="outline" onClick={handleReparse} disabled={isProcessing} loading={parse.isPending}>
                Re-parse
              </Button>
              <Button variant="outline" onClick={handleReplaceClick} disabled={isProcessing}>
                Replace
              </Button>
            </div>
          ) : undefined
        }
      />
      <div className="p-[18px]">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {hasResume ? (
          <div className="space-y-3">
            {/* PDF Preview */}
            <div className="overflow-hidden rounded-lg border border-border-main bg-bg-inset">
              <object
                data={profile.raw_resume_url!}
                type="application/pdf"
                className="h-[400px] w-full"
              >
                {/* Fallback if browser can't embed PDF */}
                <div className="flex h-[400px] flex-col items-center justify-center gap-2">
                  <Upload size={24} color="var(--color-pri)" />
                  <p className="font-mono text-[11px] text-t-400">
                    PDF preview not available
                  </p>
                  <a
                    href={profile.raw_resume_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-pri underline"
                  >
                    Open in new tab
                  </a>
                </div>
              </object>
            </div>

            {/* File metadata */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-t-400">
                {profile.raw_resume_url!.split("/").pop() ?? "resume.pdf"}
              </span>
              {profile.resume_updated_at && (
                <>
                  <span className="font-mono text-[10px] text-t-300">&middot;</span>
                  <span className="font-mono text-[10px] text-t-400">
                    {formatDate(profile.resume_updated_at)}
                  </span>
                </>
              )}
              {isProcessing ? (
                <Badge color="warn">Parsing...</Badge>
              ) : (
                <Badge color="ok">Parsed</Badge>
              )}
            </div>
          </div>
        ) : (
          <DropZone
            dragOver={dragOver}
            isProcessing={isProcessing}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleReplaceClick}
          />
        )}

        {error && (
          <p className="mt-2 font-mono text-[11px] text-fail">{error}</p>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -5`
Expected: Clean build (component not yet used in any page).

- [ ] **Step 3: Commit**

```bash
git add frontend/src-v2/components/profile/resume-doc-card.tsx
git commit -m "feat: add ResumeDocCard with PDF preview, replace, and re-parse"
```

---

### Task 3: Create SummaryCard component

**Files:**
- Create: `frontend/src-v2/components/profile/summary-card.tsx`

- [ ] **Step 1: Create summary-card.tsx**

Create `frontend/src-v2/components/profile/summary-card.tsx`:

```typescript
import { useState, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUpdateProfile } from "@/hooks/use-profile";

interface SummaryCardProps {
  summary: string | null | undefined;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(summary ?? "");
  const updateProfile = useUpdateProfile();

  const handleEdit = useCallback(() => {
    setValue(summary ?? "");
    setEditing(true);
  }, [summary]);

  const handleCancel = useCallback(() => {
    setValue(summary ?? "");
    setEditing(false);
  }, [summary]);

  const handleSave = useCallback(() => {
    updateProfile.mutate(
      { summary: value || null },
      { onSuccess: () => setEditing(false) },
    );
  }, [value, updateProfile]);

  return (
    <Card>
      <CardHeader
        title="Summary"
        right={
          !editing ? (
            <Button variant="outline" onClick={handleEdit}>
              Edit
            </Button>
          ) : undefined
        }
      />
      <div className="p-[18px]">
        {editing ? (
          <div className="space-y-3">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={4}
              placeholder="A brief professional summary..."
              className="w-full rounded-md border border-border-main bg-bg-inset px-3 py-2 font-sans text-[13px] text-t-900 outline-none transition-colors placeholder:text-t-400 focus:border-pri"
            />
            <div className="flex items-center gap-2">
              <Button variant="primary" onClick={handleSave} loading={updateProfile.isPending} disabled={updateProfile.isPending}>
                Save
              </Button>
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="font-sans text-[13px] text-t-700">
            {summary || <span className="text-t-400">No summary yet. Click "Edit" to add one.</span>}
          </p>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -5`
Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add frontend/src-v2/components/profile/summary-card.tsx
git commit -m "feat: add SummaryCard for professional summary editing"
```

---

### Task 4: Create EducationEditor and EducationForm components

**Files:**
- Create: `frontend/src-v2/components/profile/education-form.tsx`
- Create: `frontend/src-v2/components/profile/education-editor.tsx`

These follow the exact same pattern as ExperienceEditor/ExperienceForm.

- [ ] **Step 1: Create education-form.tsx**

Create `frontend/src-v2/components/profile/education-form.tsx`:

```typescript
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface EducationFormData {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

const EMPTY_FORM: EducationFormData = {
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  gpa: "",
};

interface EducationFormProps {
  initial?: EducationFormData;
  onSave: (data: EducationFormData) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function EducationForm({ initial, onSave, onCancel, saving }: EducationFormProps) {
  const [form, setForm] = useState<EducationFormData>(initial ?? EMPTY_FORM);

  const set = useCallback(
    (field: keyof EducationFormData) => (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    onSave(form);
  }, [form, onSave]);

  return (
    <div className="space-y-3 rounded-lg border border-border-main bg-bg-inset p-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Institution" value={form.institution} onChange={set("institution")} placeholder="MIT" />
        <Input label="Degree" value={form.degree} onChange={set("degree")} placeholder="Bachelor's" />
        <Input label="Field of Study" value={form.fieldOfStudy} onChange={set("fieldOfStudy")} placeholder="Computer Science" />
        <Input label="GPA" value={form.gpa} onChange={set("gpa")} placeholder="3.8" mono />
        <Input label="Start Date" value={form.startDate} onChange={set("startDate")} placeholder="Sep 2018" mono />
        <Input label="End Date" value={form.endDate} onChange={set("endDate")} placeholder="Jun 2022" mono />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving}>
          Save
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function toFormData(edu: {
  institution: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  gpa?: string | null;
}): EducationFormData {
  return {
    institution: edu.institution,
    degree: edu.degree ?? "",
    fieldOfStudy: edu.field_of_study ?? "",
    startDate: edu.start_date ?? "",
    endDate: edu.end_date ?? "",
    gpa: edu.gpa ?? "",
  };
}

export function fromFormData(
  data: EducationFormData,
  existingId?: string,
  profileId?: string,
  sortOrder?: number,
) {
  return {
    id: existingId ?? crypto.randomUUID(),
    profile_id: profileId ?? "",
    institution: data.institution,
    degree: data.degree || null,
    field_of_study: data.fieldOfStudy || null,
    start_date: data.startDate || null,
    end_date: data.endDate || null,
    gpa: data.gpa || null,
    sort_order: sortOrder ?? 0,
  };
}
```

- [ ] **Step 2: Create education-editor.tsx**

Create `frontend/src-v2/components/profile/education-editor.tsx`:

```typescript
import { useState, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUpdateEducation } from "@/hooks/use-profile";
import { EducationForm, toFormData, fromFormData } from "./education-form";
import type { EducationFormData } from "./education-form";
import type { Education } from "@/types/profile";

interface EducationEditorProps {
  educations: Education[];
  profileId: string;
}

export function EducationEditor({ educations, profileId }: EducationEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const updateEducation = useUpdateEducation();

  const handleAdd = useCallback(
    (data: EducationFormData) => {
      const newEdu = fromFormData(data, undefined, profileId, 0);
      const updated = [newEdu, ...educations];
      updateEducation.mutate(updated, {
        onSuccess: () => setAdding(false),
      });
    },
    [educations, profileId, updateEducation],
  );

  const handleEdit = useCallback(
    (id: string, data: EducationFormData) => {
      const updated = educations.map((edu) =>
        edu.id === id ? fromFormData(data, edu.id, edu.profile_id, edu.sort_order) : edu,
      );
      updateEducation.mutate(updated, {
        onSuccess: () => setEditingId(null),
      });
    },
    [educations, updateEducation],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const updated = educations.filter((edu) => edu.id !== id);
      updateEducation.mutate(updated);
    },
    [educations, updateEducation],
  );

  return (
    <Card>
      <CardHeader
        title="Education"
        count={educations.length}
        right={
          !adding ? (
            <Button variant="outline" onClick={() => setAdding(true)}>
              + Add
            </Button>
          ) : undefined
        }
      />
      <div className="p-[18px] space-y-4">
        {adding && (
          <EducationForm
            onSave={handleAdd}
            onCancel={() => setAdding(false)}
            saving={updateEducation.isPending}
          />
        )}

        {educations.length === 0 && !adding && (
          <p className="font-mono text-[11px] text-t-400">
            No education entries yet. Click "+ Add" to get started.
          </p>
        )}

        {educations.map((edu) =>
          editingId === edu.id ? (
            <EducationForm
              key={edu.id}
              initial={toFormData(edu)}
              onSave={(data) => handleEdit(edu.id, data)}
              onCancel={() => setEditingId(null)}
              saving={updateEducation.isPending}
            />
          ) : (
            <EducationEntry
              key={edu.id}
              education={edu}
              onEdit={() => setEditingId(edu.id)}
              onDelete={() => handleDelete(edu.id)}
            />
          ),
        )}
      </div>
    </Card>
  );
}

interface EducationEntryProps {
  education: Education;
  onEdit: () => void;
  onDelete: () => void;
}

function EducationEntry({ education, onEdit, onDelete }: EducationEntryProps) {
  return (
    <div className="group">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-sans text-[14px] font-semibold text-t-900">{education.institution}</p>
          {(education.degree || education.field_of_study) && (
            <p className="mt-0.5 font-mono text-[12px] text-t-400">
              {[education.degree, education.field_of_study].filter(Boolean).join(" — ")}
            </p>
          )}
          {(education.start_date ?? education.end_date) && (
            <p className="mt-0.5 font-mono text-[11px] text-t-400">
              {education.start_date ?? ""}
              {education.start_date && education.end_date && " — "}
              {education.end_date ?? ""}
            </p>
          )}
          {education.gpa && (
            <p className="mt-0.5 font-mono text-[11px] text-t-400">GPA: {education.gpa}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" onClick={onEdit} className="!px-2 !py-1 !text-[10px]">
            Edit
          </Button>
          <Button variant="ghost" onClick={onDelete} className="!px-2 !py-1 !text-[10px]">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -5`
Expected: Clean build.

- [ ] **Step 4: Commit**

```bash
git add frontend/src-v2/components/profile/education-form.tsx frontend/src-v2/components/profile/education-editor.tsx
git commit -m "feat: add EducationEditor and EducationForm components"
```

---

### Task 5: Build Resume page and update ContactCard

**Files:**
- Modify: `frontend/src-v2/components/profile/contact-card.tsx`
- Modify: `frontend/src-v2/pages/profile.tsx`

- [ ] **Step 1: Add website_url field to ContactCard**

In `frontend/src-v2/components/profile/contact-card.tsx`, add a `websiteUrl` state alongside the existing `linkedinUrl` state. Find:

```typescript
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");
```

Replace with:

```typescript
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url ?? "");
```

In `resetForm`, find:

```typescript
    setLinkedinUrl(profile.linkedin_url ?? "");
  }, [profile]);
```

Replace with:

```typescript
    setLinkedinUrl(profile.linkedin_url ?? "");
    setWebsiteUrl(profile.website_url ?? "");
  }, [profile]);
```

In `handleSave`, find:

```typescript
        linkedin_url: linkedinUrl || null,
      },
```

Replace with:

```typescript
        linkedin_url: linkedinUrl || null,
        website_url: websiteUrl || null,
      },
```

In the `handleSave` dependency array, find:

```typescript
  }, [fullName, email, phone, location, linkedinUrl, updateProfile]);
```

Replace with:

```typescript
  }, [fullName, email, phone, location, linkedinUrl, websiteUrl, updateProfile]);
```

After the existing LinkedIn `<Input>` `</div>`, find:

```typescript
        {editing && (
```

Replace with:

```typescript
        <div className="mt-3">
          <Input
            label="Website URL"
            value={editing ? websiteUrl : (profile.website_url ?? "")}
            onChange={editing ? setWebsiteUrl : undefined}
            readOnly={!editing}
            placeholder="https://janedoe.dev"
            mono
          />
        </div>
        {editing && (
```

- [ ] **Step 2: Rewrite profile.tsx to render full Resume page**

Replace the full contents of `frontend/src-v2/pages/profile.tsx`:

```typescript
import { useRouterState } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import { SkeletonCard } from "@/components/ui/skeleton";

// Resume page components
import { ResumeDocCard } from "@/components/profile/resume-doc-card";
import { ContactCard } from "@/components/profile/contact-card";
import { SummaryCard } from "@/components/profile/summary-card";
import { ExperienceEditor } from "@/components/profile/experience-editor";
import { EducationEditor } from "@/components/profile/education-editor";
import { SkillsEditor } from "@/components/profile/skills-editor";

// Account page components
import { SubscriptionCard } from "@/components/settings/subscription-card";
import { AccountCard } from "@/components/settings/account-card";

// Lazy page components for preferences (defined below)
import { JobPreferencesContent } from "@/components/profile/job-preferences-content";
import { AppPreferencesContent } from "@/components/profile/app-preferences-content";

function sectionFromPath(pathname: string): string {
  if (pathname === "/profile/preferences") return "preferences";
  if (pathname === "/profile/applications") return "applications";
  if (pathname === "/profile/account") return "account";
  return "resume";
}

export default function ProfilePage() {
  const routerState = useRouterState();
  const section = sectionFromPath(routerState.location.pathname);

  // Profile is needed for resume + account sections
  const { data: profile, isLoading, isError } = useProfile();

  // Job Preferences and App Preferences don't need profile data
  if (section === "preferences") {
    return <JobPreferencesContent />;
  }

  if (section === "applications") {
    return <AppPreferencesContent />;
  }

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono text-[13px] text-t-400">
          Unable to load profile. Please try again later.
        </p>
      </div>
    );
  }

  if (section === "account") {
    return (
      <div className="space-y-3.5">
        <SubscriptionCard />
        <AccountCard />
      </div>
    );
  }

  // Resume section (default)
  return (
    <div className="space-y-3.5">
      <ResumeDocCard profile={profile} />
      <ContactCard profile={profile} />
      <SummaryCard summary={profile.summary} />
      <ExperienceEditor experiences={profile.experiences} profileId={profile.id} />
      <EducationEditor educations={profile.educations} profileId={profile.id} />
      <SkillsEditor skills={profile.skills} />
    </div>
  );
}
```

Note: This references `JobPreferencesContent` and `AppPreferencesContent` which will be created in Tasks 6 and 7. To avoid build errors, create placeholder files now.

- [ ] **Step 3: Create placeholder for JobPreferencesContent**

Create `frontend/src-v2/components/profile/job-preferences-content.tsx`:

```typescript
import { Card } from "@/components/ui/card";

export function JobPreferencesContent() {
  return (
    <Card>
      <div className="p-6">
        <p className="font-mono text-[11px] text-t-400">Loading job preferences...</p>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Create placeholder for AppPreferencesContent**

Create `frontend/src-v2/components/profile/app-preferences-content.tsx`:

```typescript
import { Card } from "@/components/ui/card";

export function AppPreferencesContent() {
  return (
    <Card>
      <div className="p-6">
        <p className="font-mono text-[11px] text-t-400">Loading app preferences...</p>
      </div>
    </Card>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -5`
Expected: Clean build.

- [ ] **Step 6: Commit**

```bash
git add frontend/src-v2/components/profile/contact-card.tsx frontend/src-v2/pages/profile.tsx frontend/src-v2/components/profile/job-preferences-content.tsx frontend/src-v2/components/profile/app-preferences-content.tsx
git commit -m "feat: assemble Resume page with all sections, add website_url to ContactCard"
```

---

### Task 6: Build Job Preferences page

**Files:**
- Modify: `frontend/src-v2/components/profile/job-preferences-content.tsx`

- [ ] **Step 1: Replace placeholder with full Job Preferences content**

Replace the full contents of `frontend/src-v2/components/profile/job-preferences-content.tsx`:

```typescript
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { Select } from "@/components/ui/select";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useAutoApplyConfig, useUpdateAutoApplyConfig } from "@/hooks/use-auto-apply";
import type { AutoApplyConfig } from "@/types/auto-apply";

const LOCATION_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const EXPERIENCE_LEVELS = [
  { value: "", label: "Any" },
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
];

function useDebouncedSave(save: (data: Partial<AutoApplyConfig>) => void, delay = 1000) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  return useCallback(
    (data: Partial<AutoApplyConfig>) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(data), delay);
    },
    [save, delay],
  );
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div>
      <label className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-t-400">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`cursor-pointer rounded-md border px-3 py-1.5 font-mono text-[11px] font-medium transition-colors ${
                isSelected
                  ? "border-pri bg-[var(--pri-bg)] text-pri"
                  : "border-border-main bg-bg-card text-t-400 hover:text-t-600"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function JobPreferencesContent() {
  const { data: config, isLoading } = useAutoApplyConfig();
  const updateConfig = useUpdateAutoApplyConfig();
  const debouncedSave = useDebouncedSave((data) => updateConfig.mutate(data));

  // Local state mirrors config for instant UI updates
  const [titles, setTitles] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [locationTypes, setLocationTypes] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  // Sync from server config
  useEffect(() => {
    if (!config) return;
    setTitles(config.target_titles ?? []);
    setLocations(config.target_locations ?? []);
    setLocationTypes(config.location_type_pref ?? []);
    setMinSalary(config.min_salary != null ? String(config.min_salary) : "");
    setMaxSalary(config.max_salary != null ? String(config.max_salary) : "");
    setEmploymentTypes(config.employment_type_pref ?? []);
    setExperienceLevel(config.experience_level ?? "");
    setExcludedCompanies(config.excluded_companies ?? []);
    setIndustries(config.preferred_industries ?? []);
  }, [config]);

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const handleTitles = (v: string[]) => { setTitles(v); debouncedSave({ target_titles: v }); };
  const handleLocations = (v: string[]) => { setLocations(v); debouncedSave({ target_locations: v }); };
  const handleLocationTypes = (v: string[]) => { setLocationTypes(v); debouncedSave({ location_type_pref: v }); };
  const handleMinSalary = (v: string) => { setMinSalary(v); debouncedSave({ min_salary: v ? Number(v) : null }); };
  const handleMaxSalary = (v: string) => { setMaxSalary(v); debouncedSave({ max_salary: v ? Number(v) : null }); };
  const handleEmploymentTypes = (v: string[]) => { setEmploymentTypes(v); debouncedSave({ employment_type_pref: v }); };
  const handleExperienceLevel = (v: string) => { setExperienceLevel(v); debouncedSave({ experience_level: v || null }); };
  const handleExcluded = (v: string[]) => { setExcludedCompanies(v); debouncedSave({ excluded_companies: v }); };
  const handleIndustries = (v: string[]) => { setIndustries(v); debouncedSave({ preferred_industries: v }); };

  return (
    <div className="space-y-3.5">
      <Card>
        <CardHeader title="Job Titles" />
        <div className="p-[18px]">
          <TagInput tags={titles} onChange={handleTitles} placeholder="e.g., Software Engineer, Backend Developer" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Location Preferences" />
        <div className="p-[18px] space-y-4">
          <TagInput tags={locations} onChange={handleLocations} placeholder="e.g., Toronto, New York" />
          <CheckboxGroup label="Work Type" options={LOCATION_TYPES} selected={locationTypes} onChange={handleLocationTypes} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Salary Range" />
        <div className="p-[18px]">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Minimum" value={minSalary} onChange={handleMinSalary} placeholder="50000" mono />
            <Input label="Maximum" value={maxSalary} onChange={handleMaxSalary} placeholder="120000" mono />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Employment Preferences" />
        <div className="p-[18px] space-y-4">
          <CheckboxGroup label="Employment Type" options={EMPLOYMENT_TYPES} selected={employmentTypes} onChange={handleEmploymentTypes} />
          <Select label="Experience Level" value={experienceLevel} onChange={handleExperienceLevel} options={EXPERIENCE_LEVELS} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Exclusions & Industries" />
        <div className="p-[18px] space-y-4">
          <TagInput tags={excludedCompanies} onChange={handleExcluded} placeholder="Companies to exclude" variant="danger" />
          <TagInput tags={industries} onChange={handleIndustries} placeholder="Preferred industries" />
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -5`
Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add frontend/src-v2/components/profile/job-preferences-content.tsx
git commit -m "feat: build Job Preferences page with targeting, salary, employment settings"
```

---

### Task 7: Build App Preferences page with CustomAnswersEditor

**Files:**
- Create: `frontend/src-v2/components/profile/custom-answers-editor.tsx`
- Modify: `frontend/src-v2/components/profile/app-preferences-content.tsx`

- [ ] **Step 1: Create custom-answers-editor.tsx**

Create `frontend/src-v2/components/profile/custom-answers-editor.tsx`:

```typescript
import { useState, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "@/icons";

interface CustomAnswersEditorProps {
  answers: Record<string, string>;
  onSave: (answers: Record<string, string>) => void;
}

interface AnswerRow {
  key: string;
  question: string;
  answer: string;
}

export function CustomAnswersEditor({ answers, onSave }: CustomAnswersEditorProps) {
  const [rows, setRows] = useState<AnswerRow[]>(() =>
    Object.entries(answers).map(([question, answer]) => ({
      key: crypto.randomUUID(),
      question,
      answer,
    })),
  );

  const saveRows = useCallback(
    (updated: AnswerRow[]) => {
      const result: Record<string, string> = {};
      for (const row of updated) {
        if (row.question.trim()) {
          result[row.question.trim()] = row.answer;
        }
      }
      onSave(result);
    },
    [onSave],
  );

  const handleAdd = useCallback(() => {
    setRows((prev) => [...prev, { key: crypto.randomUUID(), question: "", answer: "" }]);
  }, []);

  const handleRemove = useCallback(
    (key: string) => {
      const updated = rows.filter((r) => r.key !== key);
      setRows(updated);
      saveRows(updated);
    },
    [rows, saveRows],
  );

  const handleChange = useCallback(
    (key: string, field: "question" | "answer", value: string) => {
      const updated = rows.map((r) => (r.key === key ? { ...r, [field]: value } : r));
      setRows(updated);
      saveRows(updated);
    },
    [rows, saveRows],
  );

  return (
    <Card>
      <CardHeader
        title="Custom Answers"
        count={Object.keys(answers).length}
        right={
          <Button variant="outline" onClick={handleAdd}>
            + Add
          </Button>
        }
      />
      <div className="p-[18px] space-y-2">
        {rows.length === 0 && (
          <p className="font-mono text-[11px] text-t-400">
            Add default answers for common application questions.
          </p>
        )}
        {rows.map((row) => (
          <div key={row.key} className="flex items-start gap-2">
            <input
              value={row.question}
              onChange={(e) => handleChange(row.key, "question", e.target.value)}
              placeholder="Question..."
              className="flex-[2] rounded-md border border-border-main bg-bg-inset px-3 py-2 font-mono text-[12px] text-t-900 outline-none transition-colors placeholder:text-t-400 focus:border-pri"
            />
            <input
              value={row.answer}
              onChange={(e) => handleChange(row.key, "answer", e.target.value)}
              placeholder="Answer..."
              className="flex-1 rounded-md border border-border-main bg-bg-inset px-3 py-2 font-mono text-[12px] text-t-900 outline-none transition-colors placeholder:text-t-400 focus:border-pri"
            />
            <button
              onClick={() => handleRemove(row.key)}
              className="mt-2 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-t-400 transition-colors hover:text-fail"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Replace app-preferences-content.tsx with full content**

Replace the full contents of `frontend/src-v2/components/profile/app-preferences-content.tsx`:

```typescript
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useApplicationPreferences, useUpdateApplicationPreferences } from "@/hooks/use-application-preferences";
import { CustomAnswersEditor } from "./custom-answers-editor";
import type { ApplicationPreferences } from "@/types/profile";

function useDebouncedSave(save: (data: Partial<ApplicationPreferences>) => void, delay = 1000) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  return useCallback(
    (data: Partial<ApplicationPreferences>) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(data), delay);
    },
    [save, delay],
  );
}

function TriToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null | undefined;
  onChange: (v: boolean | null) => void;
}) {
  const options = [
    { value: true, label: "Yes" },
    { value: false, label: "No" },
    { value: null, label: "Not Set" },
  ] as const;

  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-mono text-[11px] text-t-700">{label}</span>
      <div className="flex gap-1">
        {options.map((opt) => {
          const isSelected = value === opt.value || (opt.value === null && value == null);
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={`cursor-pointer rounded-md border px-2.5 py-1 font-mono text-[10px] font-medium transition-colors ${
                isSelected
                  ? "border-pri bg-[var(--pri-bg)] text-pri"
                  : "border-border-main bg-bg-card text-t-400 hover:text-t-600"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AppPreferencesContent() {
  const { data: prefs, isLoading } = useApplicationPreferences();
  const updatePrefs = useUpdateApplicationPreferences();
  const debouncedSave = useDebouncedSave((data) => updatePrefs.mutate(data));

  // Local state
  const [authorizedUs, setAuthorizedUs] = useState<boolean | null>(null);
  const [authorizedCa, setAuthorizedCa] = useState<boolean | null>(null);
  const [sponsorship, setSponsorship] = useState<boolean | null>(null);
  const [relocate, setRelocate] = useState<boolean | null>(null);
  const [startDate, setStartDate] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("USD");
  const [over18, setOver18] = useState<boolean | null>(null);
  const [driversLicense, setDriversLicense] = useState<boolean | null>(null);
  const [felony, setFelony] = useState<boolean | null>(null);
  const [howHeard, setHowHeard] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  // Sync from server
  useEffect(() => {
    if (!prefs) return;
    setAuthorizedUs(prefs.authorized_us ?? null);
    setAuthorizedCa(prefs.authorized_ca ?? null);
    setSponsorship(prefs.requires_sponsorship ?? null);
    setRelocate(prefs.willing_to_relocate ?? null);
    setStartDate(prefs.earliest_start_date ?? "");
    setNoticePeriod(prefs.notice_period_days != null ? String(prefs.notice_period_days) : "");
    setSalaryMin(prefs.desired_salary_min != null ? String(prefs.desired_salary_min) : "");
    setSalaryMax(prefs.desired_salary_max != null ? String(prefs.desired_salary_max) : "");
    setSalaryCurrency(prefs.salary_currency ?? "USD");
    setOver18(prefs.over_18 ?? null);
    setDriversLicense(prefs.has_drivers_license ?? null);
    setFelony(prefs.felony_conviction ?? null);
    setHowHeard(prefs.how_did_you_hear ?? "");
    setCustomAnswers(prefs.custom_answers ?? {});
  }, [prefs]);

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const saveToggle = (field: keyof ApplicationPreferences) => (v: boolean | null) => {
    const setter: Record<string, (v: boolean | null) => void> = {
      authorized_us: setAuthorizedUs,
      authorized_ca: setAuthorizedCa,
      requires_sponsorship: setSponsorship,
      willing_to_relocate: setRelocate,
      over_18: setOver18,
      has_drivers_license: setDriversLicense,
      felony_conviction: setFelony,
    };
    setter[field]?.(v);
    updatePrefs.mutate({ [field]: v });
  };

  return (
    <div className="space-y-3.5">
      <Card>
        <CardHeader title="Work Authorization" />
        <div className="p-[18px]">
          <TriToggle label="Authorized to work in the US" value={authorizedUs} onChange={saveToggle("authorized_us")} />
          <TriToggle label="Authorized to work in Canada" value={authorizedCa} onChange={saveToggle("authorized_ca")} />
          <TriToggle label="Requires visa sponsorship" value={sponsorship} onChange={saveToggle("requires_sponsorship")} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Availability" />
        <div className="p-[18px] space-y-3">
          <TriToggle label="Willing to relocate" value={relocate} onChange={saveToggle("willing_to_relocate")} />
          <Input
            label="Earliest Start Date"
            value={startDate}
            onChange={(v) => { setStartDate(v); debouncedSave({ earliest_start_date: v || null }); }}
            placeholder="2026-05-01"
            mono
          />
          <Input
            label="Notice Period (days)"
            value={noticePeriod}
            onChange={(v) => { setNoticePeriod(v); debouncedSave({ notice_period_days: v ? Number(v) : null }); }}
            placeholder="14"
            mono
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Desired Compensation" />
        <div className="p-[18px]">
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Minimum"
              value={salaryMin}
              onChange={(v) => { setSalaryMin(v); debouncedSave({ desired_salary_min: v ? Number(v) : null }); }}
              placeholder="80000"
              mono
            />
            <Input
              label="Maximum"
              value={salaryMax}
              onChange={(v) => { setSalaryMax(v); debouncedSave({ desired_salary_max: v ? Number(v) : null }); }}
              placeholder="150000"
              mono
            />
            <Input
              label="Currency"
              value={salaryCurrency}
              onChange={(v) => { setSalaryCurrency(v); debouncedSave({ salary_currency: v || "USD" }); }}
              placeholder="USD"
              mono
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Background" />
        <div className="p-[18px] space-y-3">
          <TriToggle label="Over 18 years old" value={over18} onChange={saveToggle("over_18")} />
          <TriToggle label="Has driver's license" value={driversLicense} onChange={saveToggle("has_drivers_license")} />
          <TriToggle label="Felony conviction" value={felony} onChange={saveToggle("felony_conviction")} />
          <Input
            label="'How did you hear about us?' default answer"
            value={howHeard}
            onChange={(v) => { setHowHeard(v); debouncedSave({ how_did_you_hear: v || null }); }}
            placeholder="LinkedIn"
          />
        </div>
      </Card>

      <CustomAnswersEditor
        answers={customAnswers}
        onSave={(v) => { setCustomAnswers(v); debouncedSave({ custom_answers: v }); }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -5`
Expected: Clean build.

- [ ] **Step 4: Commit**

```bash
git add frontend/src-v2/components/profile/custom-answers-editor.tsx frontend/src-v2/components/profile/app-preferences-content.tsx
git commit -m "feat: build App Preferences page with work auth, availability, compensation, custom Q&A"
```

---

### Task 8: Final verification — build + typecheck + lint

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -10`
Expected: Clean build.

- [ ] **Step 2: Run TypeScript check**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm typecheck 2>&1 | tail -10`
Expected: No type errors.

- [ ] **Step 3: Run lint**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm lint 2>&1 | tail -30`
Expected: No new errors from our changes.

- [ ] **Step 4: Commit any fixes**

If any build/lint/type fixes were needed:

```bash
git add -u
git commit -m "fix: resolve build/lint issues from profile pages"
```
