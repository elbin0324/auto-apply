import { useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Briefcase, Settings } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { useAutoApplyConfig } from "@/hooks/use-auto-apply-status";
import { JobSearchBar } from "@/components/jobs/job-search-bar";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobList } from "@/components/jobs/job-list";
import { Button } from "@/components/ui/button";
import type { JobSearchParams } from "@/types/job";

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

  const updateFilters = useCallback((partial: Partial<JobSearchParams>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Check if user has no config or no titles set
  const hasConfig = config && config.target_titles && config.target_titles.length > 0;
  const noFiltersActive = !filters.query && !filters.location && !filters.location_type?.length && !filters.salary_min && !filters.status;
  const showEmptyState = !isLoading && data?.total === 0 && noFiltersActive;

  return (
    <div className="space-y-4">
      <JobSearchBar
        value={filters.query ?? ""}
        onChange={(query) => updateFilters({ query: query || null, page: 1 })}
      />
      <JobFilters
        filters={filters}
        onChange={updateFilters}
        onClear={clearFilters}
      />

      {showEmptyState && !hasConfig ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Settings className="h-12 w-12 text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Set up your job preferences
          </h3>
          <p className="text-sm text-text-muted mb-4 max-w-md">
            Configure your target job titles, locations, and preferences to start seeing matched jobs.
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
            We're searching for jobs that match your preferences. This usually takes about a minute.
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
