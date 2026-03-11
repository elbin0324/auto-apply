import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Search } from "@/icons";
import type { UseJobsParams } from "@/hooks/use-jobs";

interface JobFiltersProps {
  filters: UseJobsParams;
  onFilterChange: (filters: UseJobsParams) => void;
}

const LOCATION_OPTIONS = [
  { value: "", label: "All" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const EXPERIENCE_OPTIONS = [
  { value: "", label: "All" },
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

const SORT_OPTIONS = [
  { value: "match", label: "Match \u2193" },
  { value: "salary", label: "Salary \u2193" },
  { value: "date", label: "Date \u2193" },
];

export function JobFilters({ filters, onFilterChange }: JobFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.query ?? "");

  const debouncedUpdate = useCallback(
    (value: string) => {
      onFilterChange({ ...filters, query: value || undefined, page: 1 });
    },
    [filters, onFilterChange],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedUpdate(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, debouncedUpdate]);

  const handleSelectChange = (key: keyof UseJobsParams, value: string) => {
    onFilterChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  return (
    <Card className="overflow-visible">
      <CardHeader title="JOB RADAR" />
      <div className="space-y-3 px-[18px] py-4">
        {/* Search input */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-t-400"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search jobs..."
            className="w-full rounded-md border border-border-main bg-bg-inset py-2 pl-10 pr-3 font-mono text-[13px] text-t-900 outline-none transition-colors placeholder:text-t-400 focus:border-pri"
          />
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Location"
            value={filters.location_type ?? ""}
            options={LOCATION_OPTIONS}
            onChange={(v) => handleSelectChange("location_type", v)}
          />
          <Select
            label="Experience"
            value={filters.experience_level ?? ""}
            options={EXPERIENCE_OPTIONS}
            onChange={(v) => handleSelectChange("experience_level", v)}
          />
          <Select
            label="Sort By"
            value={filters.sort_by ?? "match"}
            options={SORT_OPTIONS}
            onChange={(v) => handleSelectChange("sort_by", v)}
          />
        </div>
      </div>
    </Card>
  );
}
