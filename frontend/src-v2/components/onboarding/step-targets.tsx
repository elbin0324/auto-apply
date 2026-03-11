import { Card } from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";

export interface TargetsFormData {
  target_titles: string[];
  target_locations: string[];
}

interface StepTargetsProps {
  data: TargetsFormData;
  onChange: (data: TargetsFormData) => void;
}

export function StepTargets({ data, onChange }: StepTargetsProps) {
  return (
    <Card>
      <div className="p-6">
        <h2 className="mb-1 font-mono text-sm font-bold text-t-900">
          What roles are you looking for?
        </h2>
        <p className="mb-6 font-mono text-[11px] text-t-500">
          Add at least one target title so we can find the right jobs for you.
        </p>

        <div className="space-y-5">
          <TagInput
            label="Target Titles *"
            tags={data.target_titles}
            onChange={(tags) => onChange({ ...data, target_titles: tags })}
            placeholder="e.g., Software Engineer, Product Manager"
          />
          <TagInput
            label="Target Locations"
            tags={data.target_locations}
            onChange={(tags) => onChange({ ...data, target_locations: tags })}
            placeholder="e.g., Toronto, Remote, New York"
          />
        </div>
      </div>
    </Card>
  );
}
