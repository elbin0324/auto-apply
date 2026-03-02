import {
  Send,
  Clock,
  XCircle,
  TrendingUp,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApplicationStats } from "@/types/application";

interface StatsOverviewProps {
  stats?: ApplicationStats;
  isLoading: boolean;
}

const statCards = [
  {
    key: "total" as const,
    label: "Total",
    icon: BarChart3,
    color: "text-accent-purple",
  },
  {
    key: "applied" as const,
    label: "Applied",
    icon: Send,
    color: "text-accent-green",
  },
  {
    key: "pending" as const,
    label: "Pending",
    icon: Clock,
    color: "text-amber-400",
  },
  {
    key: "failed" as const,
    label: "Failed",
    icon: XCircle,
    color: "text-red-400",
  },
  {
    key: "this_week" as const,
    label: "This Week",
    icon: CalendarDays,
    color: "text-accent-blue",
  },
  {
    key: "success_rate" as const,
    label: "Success Rate",
    icon: TrendingUp,
    color: "text-accent-green",
  },
];

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border-subtle bg-bg-card p-4"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-6 w-10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {statCards.map((card) => {
        const value =
          card.key === "success_rate"
            ? `${stats?.success_rate ?? 0}%`
            : (stats?.[card.key] ?? 0);
        return (
          <div
            key={card.key}
            className="rounded-xl border border-border-subtle bg-bg-card p-4"
          >
            <div className="flex items-center gap-1.5">
              <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
              <span className="text-xs text-text-muted">{card.label}</span>
            </div>
            <p className="mt-1.5 font-mono text-xl font-bold text-text-primary">
              {value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
