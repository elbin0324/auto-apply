import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { JobSearchParams } from "@/types/job";

const locationTypes = ["remote", "hybrid", "onsite"] as const;
const sortOptions = [
  { value: "match_score", label: "Match Score" },
  { value: "posted_at", label: "Newest" },
  { value: "salary", label: "Salary" },
];

interface JobFiltersProps {
  filters: JobSearchParams;
  onChange: (filters: Partial<JobSearchParams>) => void;
  onClear: () => void;
}

export function JobFilters({ filters, onChange, onClear }: JobFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.query ?? "");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ query: searchInput || null, page: 1 });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const hasFilters =
    filters.query ||
    filters.location ||
    filters.location_type?.length ||
    filters.salary_min != null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Location */}
      <Input
        value={filters.location ?? ""}
        onChange={(e) =>
          onChange({ location: e.target.value || null, page: 1 })
        }
        placeholder="Location"
        className="w-40"
      />

      {/* Location type */}
      <div className="flex items-center gap-2.5">
        {locationTypes.map((type) => {
          const checked = filters.location_type?.includes(type);
          return (
            <label
              key={type}
              className="flex items-center gap-1 text-xs text-text-secondary capitalize"
            >
              <input
                type="checkbox"
                checked={!!checked}
                onChange={(e) => {
                  const current = filters.location_type ?? [];
                  const next = e.target.checked
                    ? [...current, type]
                    : current.filter((t) => t !== type);
                  onChange({
                    location_type: next.length ? next : null,
                    page: 1,
                  });
                }}
                className="rounded border-border-card"
              />
              {type}
            </label>
          );
        })}
      </div>

      {/* Sort */}
      <select
        value={filters.sort_by ?? "match_score"}
        onChange={(e) => onChange({ sort_by: e.target.value, page: 1 })}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Search */}
      <div className="relative ml-auto">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search..."
          className="w-48 pl-8"
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchInput("");
            onClear();
          }}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
