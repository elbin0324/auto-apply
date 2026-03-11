import { Card } from "@/components/ui/card";
import { SkeletonStatCard } from "@/components/ui/skeleton";
import type { ApplicationStats } from "@/types/application";

interface TrackerStatsProps {
  stats?: ApplicationStats;
  isLoading: boolean;
}

interface ColoredStatProps {
  label: string;
  value: string | number;
  bgVar: string;
}

function ColoredStat({ label, value, bgVar }: ColoredStatProps) {
  return (
    <Card>
      <div className="p-5 text-center" style={{ backgroundColor: bgVar }}>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-t-400">
          {label}
        </p>
        <p className="mt-2 font-mono text-[26px] font-bold tracking-[-0.02em] text-t-900">
          {value}
        </p>
      </div>
    </Card>
  );
}

export function TrackerStats({ stats, isLoading }: TrackerStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-5">
      <ColoredStat label="Total" value={stats.total} bgVar="var(--color-bg-inset)" />
      <ColoredStat label="Landed" value={stats.applied} bgVar="var(--ok-bg)" />
      <ColoredStat label="Pending" value={stats.pending} bgVar="var(--warn-bg)" />
      <ColoredStat label="Failed" value={stats.failed} bgVar="var(--fail-bg)" />
      <ColoredStat label="Success" value={`${stats.success_rate}%`} bgVar="var(--ok-bg)" />
    </div>
  );
}
