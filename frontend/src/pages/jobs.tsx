import { useState, useCallback } from "react";
import { useJobs } from "@/hooks/use-jobs";
import { JobSearchBar } from "@/components/jobs/job-search-bar";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobList } from "@/components/jobs/job-list";
import type { JobSearchParams } from "@/types/job";

const defaultFilters: JobSearchParams = {
  query: null,
  location: null,
  location_type: null,
  salary_min: null,
  category: null,
  page: 1,
  per_page: 20,
  sort_by: "posted_at",
};

export default function JobsPage() {
  const [filters, setFilters] = useState<JobSearchParams>(defaultFilters);
  const { data, isLoading } = useJobs(filters);

  const updateFilters = useCallback((partial: Partial<JobSearchParams>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

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
      <JobList
        jobs={data?.jobs}
        isLoading={isLoading}
        page={filters.page ?? 1}
        totalPages={data?.pages ?? 1}
        onPageChange={(page) => updateFilters({ page })}
      />
    </div>
  );
}
