import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ExperienceFormData {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string;
}

const EMPTY_FORM: ExperienceFormData = {
  title: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  bullets: "",
};

interface ExperienceFormProps {
  initial?: ExperienceFormData;
  onSave: (data: ExperienceFormData) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function ExperienceForm({ initial, onSave, onCancel, saving }: ExperienceFormProps) {
  const [form, setForm] = useState<ExperienceFormData>(initial ?? EMPTY_FORM);

  const set = useCallback(
    (field: keyof ExperienceFormData) => (value: string) => {
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
        <Input label="Title" value={form.title} onChange={set("title")} placeholder="Software Engineer" />
        <Input label="Company" value={form.company} onChange={set("company")} placeholder="Acme Corp" />
        <Input label="Location" value={form.location} onChange={set("location")} placeholder="Remote" />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Start Date" value={form.startDate} onChange={set("startDate")} placeholder="Jan 2023" mono />
          <Input label="End Date" value={form.endDate} onChange={set("endDate")} placeholder="Present" mono />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-t-400">
          Bullet Points (one per line)
        </label>
        <textarea
          value={form.bullets}
          onChange={(e) => set("bullets")(e.target.value)}
          rows={4}
          placeholder={"Led team of 5 engineers\nShipped v2.0 in 3 months"}
          className="w-full rounded-md border border-border-main bg-bg-inset px-3 py-2 font-sans text-[13px] text-t-900 outline-none transition-colors placeholder:text-t-400 focus:border-pri"
        />
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

export function toFormData(exp: {
  title: string;
  company: string;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  bullets: string[];
}): ExperienceFormData {
  return {
    title: exp.title,
    company: exp.company,
    location: exp.location ?? "",
    startDate: exp.start_date ?? "",
    endDate: exp.end_date ?? "",
    bullets: exp.bullets.join("\n"),
  };
}

export function fromFormData(
  data: ExperienceFormData,
  existingId?: string,
  profileId?: string,
  sortOrder?: number,
) {
  return {
    id: existingId ?? crypto.randomUUID(),
    profile_id: profileId ?? "",
    title: data.title,
    company: data.company,
    location: data.location || null,
    start_date: data.startDate || null,
    end_date: data.endDate || null,
    bullets: data.bullets
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean),
    sort_order: sortOrder ?? 0,
  };
}
