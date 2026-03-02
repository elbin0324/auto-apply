import { useState } from "react";
import { Plus, X, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUpdateSkills } from "@/hooks/use-profile";
import type { SkillCreate, SkillResponse } from "@/types/profile";

interface SkillsEditorProps {
  skills: SkillResponse[];
}

const categories = ["technical", "soft", "language", "tool", "other"];
const proficiencies = ["beginner", "intermediate", "advanced", "expert"];

export function SkillsEditor({ skills }: SkillsEditorProps) {
  const [items, setItems] = useState<SkillCreate[]>(
    skills.map((s) => ({
      name: s.name,
      category: s.category ?? "technical",
      proficiency: s.proficiency ?? "intermediate",
    })),
  );
  const [newSkill, setNewSkill] = useState("");
  const [newCategory, setNewCategory] = useState("technical");
  const [newProficiency, setNewProficiency] = useState("intermediate");
  const mutation = useUpdateSkills();

  const addSkill = () => {
    const name = newSkill.trim();
    if (!name) return;
    if (items.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setItems((prev) => [
      ...prev,
      { name, category: newCategory, proficiency: newProficiency },
    ]);
    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const save = () => {
    mutation.mutate(items);
  };

  return (
    <div className="space-y-4">
      {/* Current skills */}
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">
          No skills added yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((skill, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="gap-1.5 py-1.5 pl-3 pr-1.5"
            >
              <span>{skill.name}</span>
              <span className="text-text-muted">({skill.category})</span>
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-border-hover transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add skill form */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-3">
        <p className="text-sm font-medium text-text-primary">Add Skill</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="React"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Proficiency</Label>
            <select
              value={newProficiency}
              onChange={(e) => setNewProficiency(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {proficiencies.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addSkill}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Save */}
      <Button type="button" onClick={save} disabled={mutation.isPending}>
        {mutation.isPending ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-1.5 h-4 w-4" />
        )}
        Save Skills
      </Button>

      {mutation.isSuccess && (
        <p className="text-sm text-accent-green">Skills saved.</p>
      )}
    </div>
  );
}
