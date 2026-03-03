import { useState } from "react";
import { Loader2, ArrowLeft, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/auto-apply/tag-input";
import { useUpdateAutoApplyConfig } from "@/hooks/use-auto-apply-status";
import { useCompleteOnboarding } from "@/hooks/use-onboarding";
import type { AutoApplyConfigResponse } from "@/types/auto-apply";

const EXPERIENCE_LEVELS = [
  { value: "", label: "Any level" },
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Staff" },
];

const LOCATION_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

interface StepJobSearchProps {
  config?: AutoApplyConfigResponse;
  onBack: () => void;
  onComplete: () => void;
}

export function StepJobSearch({
  config,
  onBack,
  onComplete,
}: StepJobSearchProps) {
  const configMutation = useUpdateAutoApplyConfig();
  const completeMutation = useCompleteOnboarding();

  const [targetTitles, setTargetTitles] = useState<string[]>(
    config?.target_titles ?? [],
  );
  const [targetLocations, setTargetLocations] = useState<string[]>(
    config?.target_locations ?? [],
  );
  const [experienceLevel, setExperienceLevel] = useState(
    config?.experience_level ?? "",
  );
  const [locationTypePref, setLocationTypePref] = useState<string[]>(
    config?.location_type_pref ?? [],
  );

  const [error, setError] = useState<string | null>(null);

  const toggleLocationType = (value: string) => {
    setLocationTypePref((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  };

  const isProcessing = configMutation.isPending || completeMutation.isPending;

  const handleComplete = async () => {
    setError(null);

    if (targetTitles.length === 0) {
      setError("Add at least one target job title.");
      return;
    }

    // Save config first, then complete onboarding
    configMutation.mutate(
      {
        target_titles: targetTitles,
        target_locations:
          targetLocations.length > 0 ? targetLocations : null,
        experience_level: experienceLevel || null,
        location_type_pref:
          locationTypePref.length > 0 ? locationTypePref : null,
      },
      {
        onSuccess: () => {
          completeMutation.mutate(undefined, {
            onSuccess: () => onComplete(),
            onError: (err) => {
              setError(
                err instanceof Error
                  ? err.message
                  : "Failed to complete onboarding. Please try again.",
              );
            },
          });
        },
        onError: () => {
          setError("Failed to save settings. Please try again.");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-text-primary">
          What jobs are you looking for?
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Tell us what to search for. You can refine these later.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-text-secondary">
            Target Job Titles <span className="text-red-400">*</span>
          </Label>
          <TagInput
            value={targetTitles}
            onChange={setTargetTitles}
            placeholder="e.g. Software Engineer, Full Stack Developer (press Enter)"
          />
          <p className="text-xs text-text-muted">
            Press Enter to add each title
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-text-secondary">Target Locations</Label>
          <TagInput
            value={targetLocations}
            onChange={setTargetLocations}
            placeholder="e.g. San Francisco, New York, Remote (press Enter)"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="experience_level" className="text-text-secondary">
            Experience Level
          </Label>
          <select
            id="experience_level"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full rounded-md border border-border-card bg-bg px-3 py-2 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
          >
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-text-secondary">Work Arrangement</Label>
          <div className="flex flex-wrap gap-2">
            {LOCATION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleLocationType(type.value)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  locationTypePref.includes(type.value)
                    ? "border-accent-purple bg-accent-purple/10 text-accent-purple"
                    : "border-border-card text-text-secondary hover:border-border-hover"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleComplete}
          disabled={isProcessing}
          className="bg-accent-purple hover:bg-accent-purple/90"
        >
          {isProcessing ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="mr-1.5 h-4 w-4" />
          )}
          Complete Setup
        </Button>
      </div>
    </div>
  );
}
