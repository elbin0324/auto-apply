import { useState, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUpdateExperiences } from "@/hooks/use-profile";
import { ExperienceForm, toFormData, fromFormData } from "./experience-form";
import type { ExperienceFormData } from "./experience-form";
import type { Experience } from "@/types/profile";

interface ExperienceEditorProps {
  experiences: Experience[];
  profileId: string;
}

export function ExperienceEditor({ experiences, profileId }: ExperienceEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const updateExperiences = useUpdateExperiences();

  const handleAdd = useCallback(
    (data: ExperienceFormData) => {
      const newExp = fromFormData(data, undefined, profileId, 0);
      const updated = [newExp, ...experiences];
      updateExperiences.mutate(updated, {
        onSuccess: () => setAdding(false),
      });
    },
    [experiences, profileId, updateExperiences],
  );

  const handleEdit = useCallback(
    (id: string, data: ExperienceFormData) => {
      const updated = experiences.map((exp) =>
        exp.id === id ? fromFormData(data, exp.id, exp.profile_id, exp.sort_order) : exp,
      );
      updateExperiences.mutate(updated, {
        onSuccess: () => setEditingId(null),
      });
    },
    [experiences, updateExperiences],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const updated = experiences.filter((exp) => exp.id !== id);
      updateExperiences.mutate(updated);
    },
    [experiences, updateExperiences],
  );

  return (
    <Card>
      <CardHeader
        title="Experience"
        count={experiences.length}
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
          <ExperienceForm
            onSave={handleAdd}
            onCancel={() => setAdding(false)}
            saving={updateExperiences.isPending}
          />
        )}

        {experiences.length === 0 && !adding && (
          <p className="font-mono text-[11px] text-t-400">
            No experience entries yet. Click "+ Add" to get started.
          </p>
        )}

        {experiences.map((exp) =>
          editingId === exp.id ? (
            <ExperienceForm
              key={exp.id}
              initial={toFormData(exp)}
              onSave={(data) => handleEdit(exp.id, data)}
              onCancel={() => setEditingId(null)}
              saving={updateExperiences.isPending}
            />
          ) : (
            <ExperienceEntry
              key={exp.id}
              experience={exp}
              onEdit={() => setEditingId(exp.id)}
              onDelete={() => handleDelete(exp.id)}
            />
          ),
        )}
      </div>
    </Card>
  );
}

interface ExperienceEntryProps {
  experience: Experience;
  onEdit: () => void;
  onDelete: () => void;
}

function ExperienceEntry({ experience, onEdit, onDelete }: ExperienceEntryProps) {
  return (
    <div className="group">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-sans text-[14px] font-semibold text-t-900">{experience.title}</p>
          <p className="mt-0.5 font-mono text-[12px] text-t-400">{experience.company}</p>
          {(experience.start_date ?? experience.end_date) && (
            <p className="mt-0.5 font-mono text-[11px] text-t-400">
              {experience.start_date ?? ""}
              {experience.start_date && experience.end_date && " - "}
              {experience.end_date ?? ""}
            </p>
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
      {experience.bullets.length > 0 && (
        <ul className="mt-2 space-y-1">
          {experience.bullets.map((bullet, i) => (
            <li
              key={i}
              className="border-l-2 border-pri pl-3 font-sans text-[13px] text-t-700"
            >
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
