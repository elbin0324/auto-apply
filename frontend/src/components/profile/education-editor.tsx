import { useState } from "react";
import { Plus, Trash2, Loader2, Save, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateEducation } from "@/hooks/use-profile";
import type { EducationCreate, EducationResponse } from "@/types/profile";

interface EducationEditorProps {
  educations: EducationResponse[];
}

function emptyEducation(order: number): EducationCreate {
  return {
    institution: "",
    degree: null,
    field_of_study: null,
    start_date: null,
    end_date: null,
    gpa: null,
    sort_order: order,
  };
}

export function EducationEditor({ educations }: EducationEditorProps) {
  const [items, setItems] = useState<EducationCreate[]>(
    educations.map((e, i) => ({
      institution: e.institution,
      degree: e.degree ?? null,
      field_of_study: e.field_of_study ?? null,
      start_date: e.start_date ?? null,
      end_date: e.end_date ?? null,
      gpa: e.gpa ?? null,
      sort_order: e.sort_order ?? i,
    })),
  );
  const mutation = useUpdateEducation();

  const updateItem = (index: number, field: string, value: string | null) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyEducation(prev.length)]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const save = () => {
    const cleaned = items
      .filter((e) => e.institution)
      .map((e, i) => ({ ...e, sort_order: i }));
    mutation.mutate(cleaned);
  };

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <p className="py-6 text-center text-sm text-text-muted">
          No education added yet.
        </p>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-text-muted">
              <GripVertical className="h-4 w-4" />
              <span className="text-xs font-medium">#{index + 1}</span>
            </div>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="rounded p-1 text-text-muted hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Institution</Label>
              <Input
                value={item.institution}
                onChange={(e) =>
                  updateItem(index, "institution", e.target.value)
                }
                placeholder="MIT"
              />
            </div>
            <div className="space-y-1">
              <Label>Degree</Label>
              <Input
                value={item.degree ?? ""}
                onChange={(e) =>
                  updateItem(index, "degree", e.target.value || null)
                }
                placeholder="B.S."
              />
            </div>
            <div className="space-y-1">
              <Label>Field of Study</Label>
              <Input
                value={item.field_of_study ?? ""}
                onChange={(e) =>
                  updateItem(index, "field_of_study", e.target.value || null)
                }
                placeholder="Computer Science"
              />
            </div>
            <div className="space-y-1">
              <Label>GPA</Label>
              <Input
                value={item.gpa ?? ""}
                onChange={(e) =>
                  updateItem(index, "gpa", e.target.value || null)
                }
                placeholder="3.8"
              />
            </div>
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={item.start_date ?? ""}
                onChange={(e) =>
                  updateItem(index, "start_date", e.target.value || null)
                }
              />
            </div>
            <div className="space-y-1">
              <Label>End Date</Label>
              <Input
                type="date"
                value={item.end_date ?? ""}
                onChange={(e) =>
                  updateItem(index, "end_date", e.target.value || null)
                }
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Education
        </Button>
        <Button type="button" onClick={save} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Save
        </Button>
      </div>

      {mutation.isSuccess && (
        <p className="text-sm text-accent-green">Education saved.</p>
      )}
    </div>
  );
}
