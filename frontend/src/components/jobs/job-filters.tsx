import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { JobSearchParams } from "@/types/job";

const locationTypes = ["remote", "hybrid", "onsite"] as const;
const sortOptions = [
  { value: "match_score", label: "Match Score" },
  { value: "posted_at", label: "Newest" },
  { value: "salary", label: "Salary" },
];
const statusOptions = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "pending_review", label: "Pending Review" },
  { value: "queued", label: "Queued" },
  { value: "applied", label: "Applied" },
  { value: "skipped", label: "Skipped" },
];

interface JobFiltersProps {
  filters: JobSearchParams;
  onChange: (filters: Partial<JobSearchParams>) => void;
  onClear: () => void;
}

export function JobFilters({ filters, onChange, onClear }: JobFiltersProps) {
  const hasFilters =
    filters.location ||
    filters.location_type?.length ||
    filters.salary_min != null ||
    filters.category ||
    filters.status;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <Label>Location</Label>
          <Input
            value={filters.location ?? ""}
            onChange={(e) =>
              onChange({ location: e.target.value || null, page: 1 })
            }
            placeholder="City or state"
          />
        </div>

        <div className="space-y-1">
          <Label>Location Type</Label>
          <div className="flex gap-3 pt-1">
            {locationTypes.map((type) => {
              const checked = filters.location_type?.includes(type);
              return (
                <label
                  key={type}
                  className="flex items-center gap-1.5 text-sm text-text-secondary"
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
        </div>

        <div className="space-y-1">
          <Label>Min Salary</Label>
          <Input
            type="number"
            value={filters.salary_min ?? ""}
            onChange={(e) =>
              onChange({
                salary_min: e.target.value ? Number(e.target.value) : null,
                page: 1,
              })
            }
            placeholder="50000"
          />
        </div>

        <div className="space-y-1">
          <Label>Status</Label>
          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              onChange({ status: e.target.value || null, page: 1 })
            }
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label>Sort By</Label>
          <select
            value={filters.sort_by ?? "match_score"}
            onChange={(e) => onChange({ sort_by: e.target.value, page: 1 })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1.5 h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
