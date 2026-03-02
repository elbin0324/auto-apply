import { useState, useCallback } from "react";
import { useApplications } from "@/hooks/use-applications";
import { useApplicationStats } from "@/hooks/use-application-stats";
import { StatsOverview } from "@/components/applications/stats-overview";
import {
  ApplicationFiltersBar,
  type ApplicationFilters,
} from "@/components/applications/application-filters";
import { ApplicationList } from "@/components/applications/application-list";

const defaultFilters: ApplicationFilters = {
  status: null,
  date_from: null,
  date_to: null,
};

export default function ApplicationsPage() {
  const [filters, setFilters] = useState<ApplicationFilters>(defaultFilters);
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useApplicationStats();
  const { data, isLoading } = useApplications({
    status: filters.status,
    date_from: filters.date_from,
    date_to: filters.date_to,
    page,
    per_page: 20,
  });

  const updateFilters = useCallback(
    (update: Partial<ApplicationFilters>) => {
      setFilters((prev) => ({ ...prev, ...update }));
      setPage(1);
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setPage(1);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <StatsOverview stats={stats} isLoading={statsLoading} />

      <ApplicationFiltersBar
        filters={filters}
        onUpdate={updateFilters}
        onClear={clearFilters}
      />

      <ApplicationList
        applications={data?.applications}
        isLoading={isLoading}
        page={page}
        totalPages={data?.pages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
