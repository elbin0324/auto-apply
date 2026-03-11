import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { SidePanel } from "@/components/shared/side-panel";
import { Pagination } from "@/components/shared/pagination";
import { TrackerStats } from "@/components/tracker/tracker-stats";
import { ApplicationTable } from "@/components/tracker/application-table";
import { useApplications, useApplicationStats } from "@/hooks/use-applications";
import type { Application } from "@/types/application";
import type { Job } from "@/types/job";

export default function TrackerPage() {
  const [page, setPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const { data: stats, isLoading: statsLoading } = useApplicationStats();
  const { data: appData, isLoading: appsLoading } = useApplications({ page, per_page: 20 });

  const applications = appData?.applications ?? [];
  const totalPages = appData?.pages ?? 1;

  const handleRowClick = useCallback((application: Application) => {
    setSelectedApp(application);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedApp(null);
  }, []);

  const panelJob: Job | null = selectedApp?.job ?? null;

  return (
    <>
      <div className="space-y-3.5">
        {/* Stats Row — 5 equal columns */}
        <TrackerStats stats={stats} isLoading={statsLoading} />

        {/* Application Table — full width */}
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

      {/* Side Panel for application detail */}
      <SidePanel
        job={panelJob}
        application={selectedApp}
        isOpen={selectedApp !== null}
        onClose={handleClosePanel}
      />
    </>
  );
}
