import { useState } from "react";
import { Plus, Trash2, Loader2, Save, GripVertical } from "lucide-react";
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
  const mutation = useUpdateExperiences();

  const updateItem = (index: number, field: string, value: string | null) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyExperience(prev.length)]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const save = () => {
    const cleaned = items
      .filter((e) => e.company || e.title)
      .map((e, i) => ({ ...e, sort_order: i }));
    mutation.mutate(cleaned);
  };

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <p className="py-6 text-center text-sm text-text-muted">
          No experiences added yet.
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
              <Label>Company</Label>
              <Input
                value={item.company}
                onChange={(e) => updateItem(index, "company", e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={item.title}
                onChange={(e) => updateItem(index, "title", e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input
                value={item.location ?? ""}
                onChange={(e) =>
                  updateItem(index, "location", e.target.value || null)
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
                    updateItem(index, "start_date", e.target.value || null)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>End</Label>
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

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={item.description ?? ""}
              onChange={(e) =>
                updateItem(index, "description", e.target.value || null)
              }
              placeholder="What did you do in this role?"
            />
          </div>
        </div>
      ))}

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
