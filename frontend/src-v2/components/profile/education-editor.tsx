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
