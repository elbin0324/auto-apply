import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { Select } from "@/components/ui/select";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useAutoApplyConfig, useUpdateAutoApplyConfig } from "@/hooks/use-auto-apply";
import type { AutoApplyConfig } from "@/types/auto-apply";

const LOCATION_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const EXPERIENCE_LEVELS = [
  { value: "", label: "Any" },
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
];

function useDebouncedSave(save: (data: Partial<AutoApplyConfig>) => void, delay = 1000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return useCallback(
    (data: Partial<AutoApplyConfig>) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(data), delay);
    },
    [save, delay],
  );
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div>
      <label className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-t-400">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`cursor-pointer rounded-md border px-3 py-1.5 font-mono text-[11px] font-medium transition-colors ${
                isSelected
                  ? "border-pri bg-[var(--pri-bg)] text-pri"
                  : "border-border-main bg-bg-card text-t-400 hover:text-t-600"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function JobPreferencesContent() {
  const { data: config, isLoading } = useAutoApplyConfig();
  const updateConfig = useUpdateAutoApplyConfig();
  const debouncedSave = useDebouncedSave((data) => updateConfig.mutate(data));

  const [titles, setTitles] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [locationTypes, setLocationTypes] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  useEffect(() => {
    if (!config) return;
    setTitles(config.target_titles ?? []);
    setLocations(config.target_locations ?? []);
    setLocationTypes(config.location_type_pref ?? []);
    setMinSalary(config.min_salary != null ? String(config.min_salary) : "");
    setMaxSalary(config.max_salary != null ? String(config.max_salary) : "");
    setEmploymentTypes(config.employment_type_pref ?? []);
    setExperienceLevel(config.experience_level ?? "");
    setExcludedCompanies(config.excluded_companies ?? []);
    setIndustries(config.preferred_industries ?? []);
  }, [config]);

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const handleTitles = (v: string[]) => { setTitles(v); debouncedSave({ target_titles: v }); };
  const handleLocations = (v: string[]) => { setLocations(v); debouncedSave({ target_locations: v }); };
  const handleLocationTypes = (v: string[]) => { setLocationTypes(v); debouncedSave({ location_type_pref: v }); };
  const handleMinSalary = (v: string) => { setMinSalary(v); debouncedSave({ min_salary: v ? Number(v) : null }); };
  const handleMaxSalary = (v: string) => { setMaxSalary(v); debouncedSave({ max_salary: v ? Number(v) : null }); };
  const handleEmploymentTypes = (v: string[]) => { setEmploymentTypes(v); debouncedSave({ employment_type_pref: v }); };
  const handleExperienceLevel = (v: string) => { setExperienceLevel(v); debouncedSave({ experience_level: v || null }); };
  const handleExcluded = (v: string[]) => { setExcludedCompanies(v); debouncedSave({ excluded_companies: v }); };
  const handleIndustries = (v: string[]) => { setIndustries(v); debouncedSave({ preferred_industries: v }); };

  return (
    <div className="space-y-3.5">
      <Card>
        <CardHeader title="Job Titles" />
        <div className="p-[18px]">
          <TagInput label="Target Titles" tags={titles} onChange={handleTitles} placeholder="e.g., Software Engineer, Backend Developer" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Location Preferences" />
        <div className="p-[18px] space-y-4">
          <TagInput label="Locations" tags={locations} onChange={handleLocations} placeholder="e.g., Toronto, New York" />
          <CheckboxGroup label="Work Type" options={LOCATION_TYPES} selected={locationTypes} onChange={handleLocationTypes} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Salary Range" />
        <div className="p-[18px]">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Minimum" value={minSalary} onChange={handleMinSalary} placeholder="50000" mono />
            <Input label="Maximum" value={maxSalary} onChange={handleMaxSalary} placeholder="120000" mono />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Employment Preferences" />
        <div className="p-[18px] space-y-4">
          <CheckboxGroup label="Employment Type" options={EMPLOYMENT_TYPES} selected={employmentTypes} onChange={handleEmploymentTypes} />
          <Select label="Experience Level" value={experienceLevel} onChange={handleExperienceLevel} options={EXPERIENCE_LEVELS} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Exclusions & Industries" />
        <div className="p-[18px] space-y-4">
          <TagInput label="Excluded Companies" tags={excludedCompanies} onChange={handleExcluded} placeholder="Companies to exclude" variant="danger" />
          <TagInput label="Preferred Industries" tags={industries} onChange={handleIndustries} placeholder="Preferred industries" />
        </div>
      </Card>
    </div>
  );
}
