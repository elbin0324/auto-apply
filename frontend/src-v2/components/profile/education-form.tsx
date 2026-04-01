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
