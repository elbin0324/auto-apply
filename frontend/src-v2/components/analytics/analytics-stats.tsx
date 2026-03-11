import { StatCard } from "@/components/ui/stat-card";
import { SkeletonStatCard } from "@/components/ui/skeleton";
import type { ApplicationStats } from "@/types/application";

interface AnalyticsStatsProps {
  stats?: ApplicationStats;
  isLoading: boolean;
}

export function AnalyticsStats({ stats, isLoading }: AnalyticsStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
    );
  }

  const interviewRate =
    stats.total > 0 ? Math.round((stats.applied / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <StatCard label="Applications" value={stats.total} change={`+${stats.this_week} this week`} />
      <StatCard label="Interview Rate" value={`${interviewRate}%`} change="+2.1pp" />
      <StatCard label="Avg Time" value="38s" change="-12s" />
      <StatCard label="Variants" value="23" />
    </div>
  );
}
