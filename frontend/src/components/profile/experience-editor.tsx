import { useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Save,
  Pencil,
  ChevronDown,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateExperiences } from "@/hooks/use-profile";
import type { ExperienceCreate, ExperienceResponse } from "@/types/profile";

interface ExperienceEditorProps {
  experiences: ExperienceResponse[];
}

function emptyExperience(order: number): ExperienceCreate {
  return {
    company: "",
    title: "",
    location: null,
    start_date: null,
    end_date: null,
    description: null,
    bullets: [],
    sort_order: order,
  };
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  const fmt = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  if (!start && !end) return null;
  const startStr = start ? fmt(start) : "?";
  const endStr = end ? fmt(end) : "Present";
  return `${startStr} — ${endStr}`;
}

export function ExperienceEditor({ experiences }: ExperienceEditorProps) {
  const [items, setItems] = useState<ExperienceCreate[]>(
    experiences.map((e, i) => ({
      company: e.company,
      title: e.title,
      location: e.location ?? null,
      start_date: e.start_date ?? null,
      end_date: e.end_date ?? null,
      description: e.description ?? null,
      bullets: e.bullets ?? [],
      sort_order: e.sort_order ?? i,
    })),
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const mutation = useUpdateExperiences();

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
    setItems((prev) => [...prev, emptyExperience(prev.length)]);
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
      .filter((e) => e.company || e.title)
      .map((e, i) => ({ ...e, sort_order: i }));
    mutation.mutate(cleaned);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="py-6 text-center text-sm text-text-muted">
          No experiences added yet.
        </p>
      )}

      {items.map((item, index) => {
        const isEditing = editingIndex === index;
        const dateRange = formatDateRange(item.start_date, item.end_date);

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
                    <Label>Company</Label>
                    <Input
                      value={item.company}
                      onChange={(e) =>
                        updateItem(index, "company", e.target.value)
                      }
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Title</Label>
                    <Input
                      value={item.title}
                      onChange={(e) =>
                        updateItem(index, "title", e.target.value)
                      }
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Location</Label>
                    <Input
                      value={item.location ?? ""}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "location",
                          e.target.value || null,
                        )
                      }
                      placeholder="San Francisco, CA"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Start</Label>
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
                      <Label>End</Label>
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

                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={item.description ?? ""}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "description",
                        e.target.value || null,
                      )
                    }
                    placeholder="What did you do in this role?"
                  />
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {item.title || "Untitled Role"}
                    {item.company && (
                      <span className="font-normal text-text-secondary">
                        {" "}
                        at {item.company}
                      </span>
                    )}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-muted">
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </span>
                    )}
                    {dateRange && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateRange}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-xs text-text-muted line-clamp-2">
                      {item.description}
                    </p>
                  )}
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
          Add Experience
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
        <p className="text-sm text-accent-green">Experiences saved.</p>
      )}
    </div>
  );
}
