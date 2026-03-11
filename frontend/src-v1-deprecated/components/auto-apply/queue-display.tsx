import { Clock, Eye, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAutoApplyConfig,
  useAutoApplyQueue,
} from "@/hooks/use-auto-apply-status";

export function QueueDisplay() {
  const { data: config } = useAutoApplyConfig();
  const { data: queue, isLoading } = useAutoApplyQueue(config?.is_active);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
        <Skeleton className="h-4 w-24" />
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Queued",
      value: queue?.queue_depth ?? 0,
      icon: Clock,
      color: "text-accent-blue",
    },
    {
      label: "Pending Review",
      value: queue?.pending_review_count ?? 0,
      icon: Eye,
      color: "text-amber-400",
    },
    {
      label: "In Progress",
      value: queue?.in_progress_count ?? 0,
      icon: Loader2,
      color: "text-accent-green",
    },
  ];

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
      <h2 className="text-sm font-semibold text-text-primary">Queue Status</h2>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border-subtle bg-bg/50 p-4 text-center"
          >
            <stat.icon className={`mx-auto h-5 w-5 ${stat.color}`} />
            <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
