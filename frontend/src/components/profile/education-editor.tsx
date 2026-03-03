import { useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Save,
  Pencil,
  ChevronDown,
  Calendar,
} from "lucide-react";
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

function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
) {
  const fmt = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { year: "numeric" });
  };
  if (!start && !end) return null;
  const startStr = start ? fmt(start) : "?";
  const endStr = end ? fmt(end) : "Present";
  return `${startStr} — ${endStr}`;
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const mutation = useUpdateEducation();

  const updateItem = (
    index: number,
    field: string,
    value: string | null,
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addItem = () => {
    const newIndex = items.length;
    setItems((prev) => [...prev, emptyEducation(prev.length)]);
    setEditingIndex(newIndex);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
  };

  const save = () => {
    const cleaned = items
      .filter((e) => e.institution)
      .map((e, i) => ({ ...e, sort_order: i }));
    mutation.mutate(cleaned);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="py-6 text-center text-sm text-text-muted">
          No education added yet.
        </p>
      )}

      {items.map((item, index) => {
        const isEditing = editingIndex === index;
        const dateRange = formatDateRange(item.start_date, item.end_date);

        // Build summary line: "B.S. in Computer Science"
        const degreeLine = [item.degree, item.field_of_study]
          .filter(Boolean)
          .join(" in ");

        return (
          <div
            key={index}
            className="rounded-lg border border-border-subtle bg-bg-card overflow-hidden"
          >
            {isEditing ? (
              /* Edit mode */
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    Collapse
                  </button>
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
                        updateItem(
                          index,
                          "degree",
                          e.target.value || null,
                        )
                      }
                      placeholder="B.S."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Field of Study</Label>
                    <Input
                      value={item.field_of_study ?? ""}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "field_of_study",
                          e.target.value || null,
                        )
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
                        updateItem(
                          index,
                          "start_date",
                          e.target.value || null,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={item.end_date ?? ""}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "end_date",
                          e.target.value || null,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {degreeLine || "Degree"}
                    {item.institution && (
                      <span className="font-normal text-text-secondary">
                        {" "}
                        — {item.institution}
                      </span>
                    )}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-muted">
                    {dateRange && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateRange}
                      </span>
                    )}
                    {item.gpa && (
                      <span>GPA: {item.gpa}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(index)}
                    className="rounded p-1.5 text-text-muted hover:text-text-secondary hover:bg-border-subtle transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded p-1.5 text-text-muted hover:text-red-400 hover:bg-border-subtle transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

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
