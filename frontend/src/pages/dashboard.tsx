import { useApplicationStats } from "@/hooks/use-application-stats";
import { useApplications } from "@/hooks/use-applications";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentApplications } from "@/components/dashboard/recent-applications";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { AutoApplyWidget } from "@/components/dashboard/auto-apply-widget";

export default function DashboardPage() {
  const stats = useApplicationStats();
  const applications = useApplications({ per_page: 5 });

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <StatsCards stats={stats.data} isLoading={stats.isLoading} />

      {/* Two-column grid: recent apps + sidebar widgets */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentApplications
            applications={applications.data?.applications}
            isLoading={applications.isLoading}
          />
        </div>
        <div className="space-y-6">
          <AutoApplyWidget />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
