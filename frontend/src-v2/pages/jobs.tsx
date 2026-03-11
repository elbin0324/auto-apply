import { useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/shared/side-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobCard } from "@/components/jobs/job-card";
import { SkeletonJRow } from "@/components/ui/skeleton";
import { Target } from "@/icons";
import { useJobs, type UseJobsParams } from "@/hooks/use-jobs";
import { useJobActions } from "@/hooks/use-job-actions";
import { useJobDetail } from "@/hooks/use-job-detail";
import type { Job } from "@/types/job";

export default function JobsPage() {
  const [filters, setFilters] = useState<UseJobsParams>({
    sort_by: "match",
    page: 1,
    per_page: 20,
  });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { data, isLoading } = useJobs(filters);
  const { apply } = useJobActions();
  const { job: jobDetail, match: matchDetail } = useJobDetail(selectedJobId);

  const jobs = data?.jobs ?? [];
  const totalPages = data?.pages ?? 1;
  const currentPage = data?.page ?? 1;

  // Find the list-level job for instant rendering while detail loads
  const selectedListJob = useMemo(
    () => (selectedJobId ? jobs.find((j) => j.id === selectedJobId) ?? null : null),
    [selectedJobId, jobs],
  );

  const handleFilterChange = useCallback((next: UseJobsParams) => {
    setFilters(next);
  }, []);

  const handleApply = useCallback(
    (jobId: string) => {
      apply.mutate(jobId);
      if (selectedJobId === jobId) setSelectedJobId(null);
    },
    [apply, selectedJobId],
  );

  const handleJobClick = useCallback((job: Job) => {
    setSelectedJobId(job.id);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedJobId(null);
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      setFilters((prev) => ({ ...prev, page }));
    },
    [],
  );

  return (
    <>
      <div className="space-y-4">
        <JobFilters filters={filters} onFilterChange={handleFilterChange} />

        {/* Job list */}
        {isLoading && (
          <Card>
            <div className="divide-y divide-border-subtle">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonJRow key={i} />
              ))}
            </div>
          </Card>
        )}

        {!isLoading && jobs.length === 0 && (
          <Card>
            <EmptyState
              icon={<Target size={40} />}
              message="No new jobs. Check back soon or adjust your targeting."
            />
          </Card>
        )}

        {!isLoading && jobs.length > 0 && (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id}>
                <JobCard
                  job={job}
                  onApply={handleApply}
                  onClick={handleJobClick}
                />
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 text-[10px]"
            >
              Prev
            </Button>
            <span className="font-mono text-[11px] text-t-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-[10px]"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Side panel for job detail */}
      <SidePanel
        job={jobDetail.data ?? null}
        selectedJob={selectedListJob}
        matchBreakdown={matchDetail.data ?? null}
        isOpen={selectedJobId !== null}
        isLoadingDetail={jobDetail.isLoading}
        isLoadingMatch={matchDetail.isLoading}
        onClose={handleClosePanel}
        onApply={handleApply}
      />
    </>
  );
}
