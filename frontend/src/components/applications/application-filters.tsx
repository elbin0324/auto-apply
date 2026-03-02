import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApplicationStatus } from "@/types/application";

const statusOptions: { value: ApplicationStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "queued", label: "Queued" },
  { value: "pending_review", label: "Pending Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "applied", label: "Applied" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
  { value: "withdrawn", label: "Withdrawn" },
];

export interface ApplicationFilters {
  status: string | null;
  date_from: string | null;
  date_to: string | null;
}

interface ApplicationFiltersProps {
  filters: ApplicationFilters;
  onUpdate: (filters: Partial<ApplicationFilters>) => void;
  onClear: () => void;
}

export function ApplicationFiltersBar({
  filters,
  onUpdate,
  onClear,
}: ApplicationFiltersProps) {
  const hasFilters = filters.status || filters.date_from || filters.date_to;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              onUpdate({ status: e.target.value || null })
            }
            className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            value={filters.date_from ?? ""}
            onChange={(e) =>
              onUpdate({ date_from: e.target.value || null })
            }
            className="w-40"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            value={filters.date_to ?? ""}
            onChange={(e) =>
              onUpdate({ date_to: e.target.value || null })
            }
            className="w-40"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
