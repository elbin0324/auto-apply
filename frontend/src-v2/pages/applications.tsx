import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/shared/side-panel";
import { Pagination } from "@/components/shared/pagination";
import { TrackerStats } from "@/components/tracker/tracker-stats";
import { ApplicationTable } from "@/components/tracker/application-table";
import { useApplications, useApplicationStats } from "@/hooks/use-applications";
import { useJobDetail } from "@/hooks/use-job-detail";
import type { Application } from "@/types/application";
import type { Job } from "@/types/job";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In-Flight" },
  { value: "applied", label: "Applied" },
  { value: "failed", label: "Failed" },
] as const;

export default function ApplicationsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const { data: stats, isLoading: statsLoading } = useApplicationStats();
  const { data: appData, isLoading: appsLoading } = useApplications({
    status: statusFilter || undefined,
    page,
    per_page: 20,
  });

  const applications = appData?.applications ?? [];
  const totalPages = appData?.pages ?? 1;

  const handleRowClick = useCallback((application: Application) => {
    setSelectedApp(application);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedApp(null);
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  const panelJob: Job | null = selectedApp?.job ?? null;
  const selectedJobId = selectedApp?.job_id ?? selectedApp?.job?.id ?? null;
  const { job: jobDetail, match: matchDetail } = useJobDetail(selectedJobId);

  return (
    <>
      <div className="space-y-3.5">
        {/* Stats Row */}
        <TrackerStats stats={stats} isLoading={statsLoading} />

        {/* Status Filter */}
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? "primary" : "ghost"}
              onClick={() => handleStatusChange(f.value)}
              className="px-3 py-1.5 text-[10px]"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Application Table */}
        <Card>
          <ApplicationTable
            applications={applications}
            onRowClick={handleRowClick}
            loading={appsLoading}
          />
        </Card>

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Side Panel for application detail — read-only, no approve/reject */}
      <SidePanel
        job={jobDetail.data ?? panelJob}
        selectedJob={panelJob}
        application={selectedApp}
        matchBreakdown={matchDetail.data ?? null}
        isOpen={selectedApp !== null}
        isLoadingDetail={jobDetail.isLoading}
        isLoadingMatch={matchDetail.isLoading}
        onClose={handleClosePanel}
      />
    </>
  );
}
