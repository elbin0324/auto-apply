import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminQueues,
  usePurgeQueue,
  useDLQOverview,
  useDLQDetail,
  useReplayDLQ,
  usePurgeDLQ,
} from "@/hooks/use-admin";

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

function DLQSection() {
  const { data: dlqOverview, isLoading } = useDLQOverview();
  const replayDLQ = useReplayDLQ();
  const purgeDLQ = usePurgeDLQ();
  const [expandedQueue, setExpandedQueue] = useState<string | null>(null);
  const { data: dlqDetail } = useDLQDetail(expandedQueue ?? "");

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!dlqOverview || dlqOverview.total === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-lg bg-emerald-400/10 p-2">
            <AlertTriangle className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">
            Dead-Letter Queues
          </h2>
        </div>
        <p className="text-sm text-text-muted">No failed tasks</p>
      </div>
    );
  }

  async function handleReplay(queueName: string) {
    const confirmed = window.confirm(
      `Replay one item from DLQ "${queueName}" back to its original queue?`,
    );
    if (!confirmed) return;
    await replayDLQ.mutateAsync(queueName);
  }

  async function handlePurgeDLQ(queueName: string) {
    const confirmed = window.confirm(
      `Purge ALL items from DLQ "${queueName}"?\n\nThis will permanently discard all failed tasks.`,
    );
    if (!confirmed) return;
    await purgeDLQ.mutateAsync(queueName);
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-red-400/10 p-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Dead-Letter Queues
          </h2>
          <p className="text-sm text-text-muted">
            {dlqOverview.total} failed task{dlqOverview.total !== 1 ? "s" : ""}{" "}
            across {Object.keys(dlqOverview.queues).length} queue
            {Object.keys(dlqOverview.queues).length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(dlqOverview.queues).map(([queueName, depth]) => (
          <div key={queueName}>
            <div className="flex items-center justify-between rounded-lg border border-border-subtle px-4 py-3">
              <button
                type="button"
                className="flex items-center gap-3 text-left"
                onClick={() =>
                  setExpandedQueue(
                    expandedQueue === queueName ? null : queueName,
                  )
                }
              >
                <span
                  className={`text-xl font-bold font-mono ${depthColor(depth)}`}
                >
                  {depth}
                </span>
                <span className="text-sm font-medium text-text-primary">
                  dlq:{queueName}
                </span>
              </button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-text-muted hover:text-amber-400"
                  disabled={replayDLQ.isPending}
                  onClick={() => handleReplay(queueName)}
                >
                  {replayDLQ.isPending &&
                  replayDLQ.variables === queueName ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RotateCcw className="h-3 w-3 mr-1" />
                  )}
                  Replay 1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-text-muted hover:text-red-400"
                  disabled={purgeDLQ.isPending}
                  onClick={() => handlePurgeDLQ(queueName)}
                >
                  {purgeDLQ.isPending &&
                  purgeDLQ.variables === queueName ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  Purge
                </Button>
              </div>
            </div>

            {expandedQueue === queueName && dlqDetail && (
              <div className="mt-2 space-y-2 pl-4">
                {dlqDetail.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-border-subtle bg-bg px-4 py-3 text-xs"
                  >
                    <p className="text-red-400 font-medium mb-1">
                      {item.error}
                    </p>
                    <p className="text-text-muted">
                      Failed: {new Date(item.failed_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {dlqDetail.items.length === 0 && (
                  <p className="text-xs text-text-muted py-2">
                    No items to display
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminQueuesPage() {
  const { data, isLoading, dataUpdatedAt } = useAdminQueues();
  const purgeQueue = usePurgeQueue();

  const queues = data
    ? [
        {
          label: "Apply Tasks",
          description: "Jobs queued for agent workers to process",
          depth: data.apply_queue_depth,
          purgeKey: null, // Not purgeable — owned by apply-agents contract
        },
        {
          label: "Score Jobs",
          description: "Job batches pending LLM scoring",
          depth: data.score_jobs_queue_depth,
          purgeKey: "score_jobs",
        },
        {
          label: "Enrich Jobs",
          description: "Job batches pending LLM enrichment",
          depth: data.enrich_queue_depth,
          purgeKey: "enrich",
        },
      ]
    : [];

  async function handlePurge(label: string, purgeKey: string) {
    const confirmed = window.confirm(
      `Are you sure you want to purge all items from "${label}"?\n\nThis will discard all pending tasks in this queue.`,
    );
    if (!confirmed) return;
    await purgeQueue.mutateAsync(purgeKey);
  }

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-subtle bg-bg-card p-5"
              >
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-10 w-16" />
              </div>
            ))
          : queues.map(({ label, description, depth, purgeKey }) => (
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
                <div className="flex items-center justify-between">
                  <span
                    className={`text-3xl font-bold font-mono ${depthColor(depth)}`}
                  >
                    {depth}
                  </span>
                  {purgeKey && depth > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-text-muted hover:text-red-400"
                      disabled={purgeQueue.isPending}
                      onClick={() => handlePurge(label, purgeKey)}
                    >
                      {purgeQueue.isPending &&
                      purgeQueue.variables === purgeKey ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-1" />
                      )}
                      Purge
                    </Button>
                  )}
                </div>
              </div>
            ))}
      </div>

      {/* Dead-letter queues */}
      <DLQSection />
    </div>
  );
}
