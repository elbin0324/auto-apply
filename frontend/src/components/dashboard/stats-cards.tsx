import { Briefcase, Clock, XCircle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApplicationStats } from "@/types/application";

interface StatsCardsProps {
  stats?: ApplicationStats;
  isLoading: boolean;
}

const cards = [
  {
    label: "Total Applied",
    key: "applied" as const,
    icon: Briefcase,
    color: "text-accent-blue",
    bg: "bg-accent-blue/10",
  },
  {
    label: "Pending",
    key: "pending" as const,
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    label: "Failed",
    key: "failed" as const,
    icon: XCircle,
    color: "text-text-muted",
    bg: "bg-text-muted/10",
  },
  {
    label: "Success Rate",
    key: "success_rate" as const,
    icon: TrendingUp,
    color: "text-accent-purple",
    bg: "bg-accent-purple/10",
  },
];

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ label, key, icon: Icon, color, bg }) => (
        <div
          key={key}
          className="rounded-xl border border-border-subtle bg-bg-card p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">{label}</span>
            <div className={`rounded-lg p-2 ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className={`text-2xl font-bold font-mono ${color}`}>
                {key === "success_rate"
                  ? `${(stats?.success_rate ?? 0).toFixed(1)}%`
                  : (stats?.[key] ?? 0)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
