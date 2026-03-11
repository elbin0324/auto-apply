import { StatCard } from "@/components/ui/stat-card";
import { SkeletonStatCard } from "@/components/ui/skeleton";
import { Plane, Check, Chart, Target } from "@/icons";
import type { ApplicationStats } from "@/types/application";

interface StatsRowProps {
  stats: ApplicationStats | undefined;
  isLoading: boolean;
}

export function StatsRow({ stats, isLoading }: StatsRowProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <StatCard
        label="Deployed"
        value={stats?.total ?? 0}
        icon={<Plane size={18} />}
      />
      <StatCard
        label="Interviews"
        value={stats?.applied ?? 0}
        icon={<Check size={18} />}
      />
      <StatCard
        label="Response"
        value={stats ? `${stats.success_rate}%` : "0%"}
        icon={<Chart size={18} />}
      />
      <StatCard
        label="Avg Match"
        value={"\u2014"}
        icon={<Target size={18} />}
      />
    </div>
  );
}
