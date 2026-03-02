import { Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminQueues } from "@/hooks/use-admin";

function depthColor(depth: number) {
  if (depth === 0) return "text-emerald-400";
  if (depth <= 10) return "text-amber-400";
  return "text-red-400";
}

function depthBg(depth: number) {
  if (depth === 0) return "bg-emerald-400/10";
  if (depth <= 10) return "bg-amber-400/10";
  return "bg-red-400/10";
}

export default function AdminQueuesPage() {
  const { data, isLoading, dataUpdatedAt } = useAdminQueues();

  const queues = data
    ? [
        {
          label: "Apply Tasks",
          description: "Jobs queued for agent workers to process",
          depth: data.apply_queue_depth,
        },
        {
          label: "Crawl Queue",
          description: "Companies pending career page crawl",
          depth: data.crawl_queue_depth,
        },
        {
          label: "Score Jobs",
          description: "Job batches pending scoring after crawl",
          depth: data.score_jobs_queue_depth,
        },
        {
          label: "Score Users",
          description: "Users pending profile re-scoring",
          depth: data.score_users_queue_depth,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Queue Monitor
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Live queue depths — auto-refreshes every 10s
          </p>
        </div>
        {dataUpdatedAt > 0 && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Clock className="h-3 w-3" />
            Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Queue cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-subtle bg-bg-card p-5"
              >
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-10 w-16" />
              </div>
            ))
          : queues.map(({ label, description, depth }) => (
              <div
                key={label}
                className="rounded-xl border border-border-subtle bg-bg-card p-5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text-primary">
                    {label}
                  </span>
                  <div className={`rounded-lg p-2 ${depthBg(depth)}`}>
                    <Activity className={`h-4 w-4 ${depthColor(depth)}`} />
                  </div>
                </div>
                <p className="text-xs text-text-muted mb-3">{description}</p>
                <span
                  className={`text-3xl font-bold font-mono ${depthColor(depth)}`}
                >
                  {depth}
                </span>
              </div>
            ))}
      </div>

      {/* Dedup keys */}
      {data && (
        <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Deduplication
          </h2>
          <div className="flex items-center justify-between rounded-lg border border-border-subtle px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Crawl Dedup Keys
              </p>
              <p className="text-xs text-text-muted">
                Active dedup keys prevent re-crawling recently processed companies
              </p>
            </div>
            <Badge variant="secondary" className="font-mono">
              {data.crawl_dedup_keys}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
