import { useState, useCallback, useRef } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "@/icons";
import { useUpdateSkills } from "@/hooks/use-profile";
import type { Skill } from "@/types/profile";

interface SkillsEditorProps {
  skills: Skill[];
}

export function SkillsEditor({ skills }: SkillsEditorProps) {
  const [adding, setAdding] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const updateSkills = useUpdateSkills();

  const skillNames = skills.map((s) => s.name);

  const handleAdd = useCallback(() => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (skillNames.includes(trimmed)) {
      setNewSkill("");
      return;
    }
    updateSkills.mutate([...skillNames, trimmed], {
      onSuccess: () => {
        setNewSkill("");
        inputRef.current?.focus();
      },
    });
  }, [newSkill, skillNames, updateSkills]);

  const handleRemove = useCallback(
    (name: string) => {
      updateSkills.mutate(skillNames.filter((s) => s !== name));
    },
    [skillNames, updateSkills],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      }
      if (e.key === "Escape") {
        setAdding(false);
        setNewSkill("");
      }
    },
    [handleAdd],
  );

  const handleStartAdding = useCallback(() => {
    setAdding(true);
    // Focus after render
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  return (
    <Card>
      <CardHeader
        title="Skills"
        count={skills.length}
        right={
          !adding ? (
            <Button variant="ghost" onClick={handleStartAdding}>
              + Add
            </Button>
          ) : undefined
        }
      />
      <div className="p-[18px]">
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <SkillTag
              key={skill.id}
              name={skill.name}
              onRemove={() => handleRemove(skill.name)}
            />
          ))}

          {adding && (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type skill..."
                className="rounded-md border border-border-main bg-bg-inset px-3 py-1.5 font-mono text-[11px] text-t-900 outline-none placeholder:text-t-400 focus:border-pri"
              />
              <Button
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setNewSkill("");
                }}
                className="!px-2 !py-1 !text-[10px]"
              >
                Done
              </Button>
            </div>
          )}
        </div>

        {skills.length === 0 && !adding && (
          <p className="font-mono text-[11px] text-t-400">
            No skills added yet. Click "+ Add" to get started.
          </p>
        )}
      </div>
    </Card>
  );
}

interface SkillTagProps {
  name: string;
  onRemove: () => void;
}

function SkillTag({ name, onRemove }: SkillTagProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-bg-deep px-3 py-1.5 font-mono text-[11px] font-semibold text-pri">
      {name}
      <button
        type="button"
        onClick={onRemove}
        className="cursor-pointer rounded-sm p-0.5 transition-colors hover:bg-bg-inset"
      >
        <X size={10} />
      </button>
    </span>
  );
}
