import { useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Briefcase, Settings, Clock, Eye, Loader2 as LoaderIcon } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import {
  useAutoApplyConfig,
  useAutoApplyQueue,
} from "@/hooks/use-auto-apply-status";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobList } from "@/components/jobs/job-list";
import { Button } from "@/components/ui/button";
import type { JobSearchParams } from "@/types/job";

const statusTabs = [
  { value: null, label: "All" },
  { value: "new", label: "New" },
  { value: "pending_review", label: "Pending Review" },
  { value: "queued", label: "Queued" },
  { value: "applied", label: "Applied" },
  { value: "skipped", label: "Skipped" },
] as const;

const defaultFilters: JobSearchParams = {
  query: null,
  location: null,
  location_type: null,
  salary_min: null,
  category: null,
  status: null,
  page: 1,
  per_page: 20,
  sort_by: "match_score",
};

export default function JobsPage() {
  const [filters, setFilters] = useState<JobSearchParams>(defaultFilters);
  const { data, isLoading } = useJobs(filters);
  const { data: config } = useAutoApplyConfig();
  const { data: queue } = useAutoApplyQueue();

  const updateFilters = useCallback((partial: Partial<JobSearchParams>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters((prev) => ({ ...defaultFilters, status: prev.status }));
  }, []);

  const hasConfig =
    config && config.target_titles && config.target_titles.length > 0;
  const noFiltersActive =
    !filters.query &&
    !filters.location &&
    !filters.location_type?.length &&
    !filters.salary_min;
  const showEmptyState =
    !isLoading && data?.total === 0 && noFiltersActive && !filters.status;

  return (
    <div className="space-y-4">
      {/* Queue stats bar */}
      {queue && (
        <div className="flex items-center gap-6 rounded-xl border border-border-subtle bg-bg-card px-5 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-accent-blue" />
            <span className="text-text-muted">Queued</span>
            <span className="font-mono font-semibold text-text-primary">
              {queue.queue_depth}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-amber-400" />
            <span className="text-text-muted">Pending Review</span>
            <span className="font-mono font-semibold text-text-primary">
              {queue.pending_review_count}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <LoaderIcon className="h-4 w-4 text-accent-green" />
            <span className="text-text-muted">In Progress</span>
            <span className="font-mono font-semibold text-text-primary">
              {queue.in_progress_count}
            </span>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border-subtle pb-px">
        {statusTabs.map((tab) => {
          const isActive = (filters.status ?? null) === tab.value;
          return (
            <button
              key={tab.value ?? "all"}
              type="button"
              onClick={() => updateFilters({ status: tab.value, page: 1 })}
              className={`shrink-0 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-accent-purple text-accent-purple"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Compact filters */}
      <JobFilters
        filters={filters}
        onChange={updateFilters}
        onClear={clearFilters}
      />

      {/* Content */}
      {showEmptyState && !hasConfig ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Settings className="h-12 w-12 text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Set up your job preferences
          </h3>
          <p className="text-sm text-text-muted mb-4 max-w-md">
            Configure your target job titles, locations, and preferences to
            start seeing matched jobs.
          </p>
          <Button asChild>
            <Link to="/auto-apply">Configure Preferences</Link>
          </Button>
        </div>
      ) : showEmptyState && hasConfig ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Briefcase className="h-12 w-12 text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Finding jobs for you...
          </h3>
          <p className="text-sm text-text-muted max-w-md">
            We're searching for jobs that match your preferences. This usually
            takes about a minute.
          </p>
        </div>
      ) : (
        <JobList
          jobs={data?.jobs}
          isLoading={isLoading}
          page={filters.page ?? 1}
          totalPages={data?.pages ?? 1}
          onPageChange={(page) => updateFilters({ page })}
        />
      )}
    </div>
  );
}
