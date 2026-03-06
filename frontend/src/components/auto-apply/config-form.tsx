import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import { TagInput } from "./tag-input";
import { IndustrySelect } from "./industry-select";
import { useUpdateAutoApplyConfig } from "@/hooks/use-auto-apply-status";
import { EMPLOYMENT_TYPES } from "@/lib/constants";
import type { AutoApplyConfigResponse } from "@/types/auto-apply";

const locationTypes = ["remote", "hybrid", "onsite"] as const;
const experienceLevels = [
  { value: "", label: "Any" },
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
];

const applyModes = [
  {
    value: "safe" as const,
    label: "Safe",
    description:
      "We find and score jobs. You manually queue individual jobs to apply.",
  },
  {
    value: "hybrid" as const,
    label: "Hybrid",
    description:
      "Jobs scoring above your threshold are auto-queued. Lower-scoring jobs await your review.",
  },
  {
    value: "auto" as const,
    label: "Auto",
    description: "All matched jobs are automatically queued for apply.",
  },
];

interface ConfigFormProps {
  config: AutoApplyConfigResponse;
}

export function ConfigForm({ config }: ConfigFormProps) {
  const mutation = useUpdateAutoApplyConfig();

  const [targetTitles, setTargetTitles] = useState<string[]>([]);
  const [targetLocations, setTargetLocations] = useState<string[]>([]);
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>([]);
  const [preferredIndustries, setPreferredIndustries] = useState<string[]>([]);
  const [locationTypePref, setLocationTypePref] = useState<string[]>([]);
  const [employmentTypePref, setEmploymentTypePref] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [minSalary, setMinSalary] = useState<string>("");
  const [maxSalary, setMaxSalary] = useState<string>("");
  const [dailyLimit, setDailyLimit] = useState<string>("20");
  const [applyMode, setApplyMode] = useState<"safe" | "hybrid" | "auto">(
    "safe",
  );
  const [autoApplyThreshold, setAutoApplyThreshold] = useState<string>("70");

  useEffect(() => {
    setTargetTitles(config.target_titles ?? []);
    setTargetLocations(config.target_locations ?? []);
    setExcludedCompanies(config.excluded_companies ?? []);
    setPreferredIndustries(config.preferred_industries ?? []);
    setLocationTypePref(config.location_type_pref ?? []);
    setEmploymentTypePref(config.employment_type_pref ?? []);
    setExperienceLevel(config.experience_level ?? "");
    setMinSalary(config.min_salary?.toString() ?? "");
    setMaxSalary(config.max_salary?.toString() ?? "");
    setDailyLimit(config.daily_apply_limit.toString());
    setApplyMode(config.apply_mode);
    setAutoApplyThreshold(config.auto_apply_threshold.toString());
  }, [config]);

  const save = () => {
    mutation.mutate({
      target_titles: targetTitles.length ? targetTitles : null,
      target_locations: targetLocations.length ? targetLocations : null,
      excluded_companies: excludedCompanies.length ? excludedCompanies : null,
      preferred_industries: preferredIndustries.length
        ? preferredIndustries
        : null,
      location_type_pref: locationTypePref.length ? locationTypePref : null,
      employment_type_pref: employmentTypePref.length
        ? employmentTypePref
        : null,
      experience_level: experienceLevel || null,
      min_salary: minSalary ? Number(minSalary) : null,
      max_salary: maxSalary ? Number(maxSalary) : null,
      daily_apply_limit: Number(dailyLimit) || 20,
      apply_mode: applyMode,
      auto_apply_threshold: Number(autoApplyThreshold) || 70,
    });
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Search criteria */}
      <SectionCard
        title="What jobs to find"
        description="Define the roles, locations, and criteria for your job search."
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Target Job Titles</Label>
            <p className="text-xs text-text-muted">
              Enter core job titles, e.g. &quot;Software Engineer&quot;.
              Seniority levels are handled automatically.
            </p>
            <TagInput
              value={targetTitles}
              onChange={setTargetTitles}
              placeholder="e.g. Software Engineer (press Enter to add)"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Target Locations</Label>
            <p className="text-xs text-text-muted">
              Use full names, e.g. &quot;New York&quot; or &quot;United
              States&quot;. Common abbreviations like &quot;CA&quot;,
              &quot;NYC&quot; are also accepted.
            </p>
            <TagInput
              value={targetLocations}
              onChange={setTargetLocations}
              placeholder="e.g. New York, United States"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Location Type</Label>
            <div className="flex gap-4 pt-1">
              {locationTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-1.5 text-sm capitalize text-text-secondary"
                >
                  <Checkbox
                    checked={locationTypePref.includes(type)}
                    onCheckedChange={(val) => {
                      setLocationTypePref((prev) =>
                        val
                          ? [...prev, type]
                          : prev.filter((t) => t !== type),
                      );
                    }}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Employment Type</Label>
            <div className="flex flex-wrap gap-4 pt-1">
              {EMPLOYMENT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-1.5 text-sm text-text-secondary"
                >
                  <Checkbox
                    checked={employmentTypePref.includes(type.value)}
                    onCheckedChange={(val) => {
                      setEmploymentTypePref((prev) =>
                        val
                          ? [...prev, type.value]
                          : prev.filter((t) => t !== type.value),
                      );
                    }}
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Min Salary</Label>
              <Input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                placeholder="50000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max Salary</Label>
              <Input
                type="number"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                placeholder="200000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Experience Level</Label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {experienceLevels.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 2: Automation rules */}
      <SectionCard
        title="How to apply"
        description="Control how aggressively the system applies on your behalf."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Apply Mode</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {applyModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setApplyMode(mode.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    applyMode === mode.value
                      ? "border-accent-purple bg-accent-purple/10"
                      : "border-border-subtle hover:border-border-hover"
                  }`}
                >
                  <span className="text-sm font-semibold text-text-primary">
                    {mode.label}
                  </span>
                  <p className="mt-1 text-xs text-text-muted">
                    {mode.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {applyMode === "hybrid" && (
            <div className="space-y-1.5">
              <Label>
                Auto-Apply Threshold:{" "}
                <span className="font-mono text-accent-purple">
                  {autoApplyThreshold}%
                </span>
              </Label>
              <p className="text-xs text-text-muted">
                Jobs scoring above this threshold will be automatically queued.
              </p>
              <input
                type="range"
                min={15}
                max={100}
                step={5}
                value={autoApplyThreshold}
                onChange={(e) => setAutoApplyThreshold(e.target.value)}
                className="w-full max-w-[400px]"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Daily Apply Limit</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="max-w-[200px]"
            />
          </div>
        </div>
      </SectionCard>

      {/* Section 3: Exclusions & Industries */}
      <SectionCard
        title="Exclusions & Industries"
        description="Optionally filter out specific companies or focus on preferred industries."
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Excluded Companies</Label>
            <TagInput
              value={excludedCompanies}
              onChange={setExcludedCompanies}
              placeholder="Companies to skip"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Preferred Industries</Label>
            <p className="text-xs text-text-muted">
              Select from the available industry categories to focus your
              search.
            </p>
            <IndustrySelect
              value={preferredIndustries}
              onChange={setPreferredIndustries}
            />
          </div>
        </div>
      </SectionCard>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Save Configuration
        </Button>
        {mutation.isSuccess && (
          <p className="text-sm text-accent-green">Configuration saved.</p>
        )}
        {mutation.isError && (
          <p className="text-sm text-red-400">
            Failed to save. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
