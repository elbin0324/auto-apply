import { AnalyticsStats } from "@/components/analytics/analytics-stats";
import { AtsSuccess } from "@/components/analytics/ats-success";
import { useApplicationStats } from "@/hooks/use-applications";

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useApplicationStats();

  return (
    <div className="space-y-3.5">
      {/* Stats Row — 4 equal columns */}
      <AnalyticsStats stats={stats} isLoading={isLoading} />

      {/* ATS Success Rate Card — full width */}
      <AtsSuccess />
    </div>
  );
}
