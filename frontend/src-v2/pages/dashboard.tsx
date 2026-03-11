import { useCallback } from "react";
import { useDashboardStats, useQueueStatus, useRecentApplications } from "@/hooks/use-dashboard";
import { useUiStore } from "@/stores/ui-store";
import { StatsRow } from "@/components/dashboard/stats-row";
import { PipelineCard } from "@/components/dashboard/pipeline-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AtsCoverage } from "@/components/dashboard/ats-coverage";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { SidePanel } from "@/components/shared/side-panel";
import type { Application } from "@/types/application";
import type { Job } from "@/types/job";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: queue } = useQueueStatus();
  const { data: applicationsData } = useRecentApplications(5);

  const { sidePanel, openPanel, closePanel } = useUiStore();

  const recentApplications = applicationsData?.applications ?? [];

  const handleJobClick = useCallback(
    (application: Application) => {
      openPanel({
        type: "job-detail",
        id: application.job?.id ?? application.id,
        job: application.job ?? null,
        application,
      });
    },
    [openPanel],
  );

  const panelJob = (sidePanel.data?.job as Job | null) ?? null;
  const panelApplication = (sidePanel.data?.application as Application | null) ?? null;

  return (
    <>
      <div className="space-y-3.5">
        {/* Row 1: Stats */}
        <StatsRow stats={stats} isLoading={statsLoading} />

        {/* Row 2: Pipeline + Activity Feed */}
        <div className="grid gap-3.5 lg:grid-cols-[1fr_340px]">
          <PipelineCard
            stats={stats}
            queue={queue}
            recentApplications={recentApplications}
            onJobClick={handleJobClick}
          />
          <ActivityFeed />
        </div>

        {/* Row 3: ATS Coverage + Weekly Chart */}
        <div className="grid gap-3.5 md:grid-cols-2">
          <AtsCoverage />
          <WeeklyChart />
        </div>
      </div>

      {/* Side Panel for job detail */}
      <SidePanel
        job={panelJob}
        application={panelApplication}
        isOpen={sidePanel.isOpen}
        onClose={closePanel}
      />
    </>
  );
}
