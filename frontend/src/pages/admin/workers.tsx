import { useState } from "react";
import {
  Cpu,
  Clock,
  Loader2,
  Search,
  BarChart3,
  Zap,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useWorkers,
  useTriggerCrawl,
  useTriggerRescore,
  useTriggerEnrich,
  useTriggerRematch,
} from "@/hooks/use-admin";
import type { WorkerStatus } from "@/types/admin";

function statusColor(status: string) {
  if (status === "idle") return "bg-emerald-400";
  if (status === "processing") return "bg-amber-400";
  return "bg-red-400";
}

function statusBg(status: string) {
  if (status === "idle") return "bg-emerald-400/10 text-emerald-400";
  if (status === "processing") return "bg-amber-400/10 text-amber-400";
  return "bg-red-400/10 text-red-400";
}

function timeAgo(isoString: string | null): string {
  if (!isoString) return "n/a";
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function workerLabel(name: string): string {
  const labels: Record<string, string> = {
    scheduler: "Scheduler (arq)",
    crawl: "Crawl Worker",
    score: "Score Worker",
    enrich: "Enrich Worker",
  };
  return labels[name] ?? name;
}

function WorkerCard({ worker }: { worker: WorkerStatus }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${statusColor(worker.status)}`}
          />
          <span className="text-sm font-medium text-text-primary">
            {workerLabel(worker.name)}
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBg(worker.status)}`}
        >
          {worker.status}
        </span>
      </div>

      {worker.is_alive ? (
        <div className="space-y-2 text-xs text-text-muted">
          {worker.worker_id && (
            <div className="flex justify-between">
              <span>Instance</span>
              <span className="font-mono text-text-secondary">
                {worker.worker_id}
              </span>
            </div>
          )}
          {worker.started_at && (
            <div className="flex justify-between">
              <span>Uptime</span>
              <span className="text-text-secondary">
                {timeAgo(worker.started_at)}
              </span>
            </div>
          )}
          {worker.last_beat_at && (
            <div className="flex justify-between">
              <span>Last heartbeat</span>
              <span className="text-text-secondary">
                {timeAgo(worker.last_beat_at)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Processed / Failed</span>
            <span className="text-text-secondary">
              <span className="text-emerald-400 font-mono">
                {worker.tasks_processed}
              </span>
              {" / "}
              <span
                className={`font-mono ${worker.tasks_failed > 0 ? "text-red-400" : "text-text-muted"}`}
              >
                {worker.tasks_failed}
              </span>
            </span>
          </div>
          {worker.current_task && (
            <div className="pt-1">
              <span className="rounded bg-amber-400/10 px-2 py-0.5 text-xs font-mono text-amber-400">
                {worker.current_task}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-text-muted">
          Worker is not running or heartbeat has expired
        </p>
      )}
    </div>
  );
}

export default function AdminWorkersPage() {
  const { data, isLoading, dataUpdatedAt } = useWorkers();

  const triggerCrawl = useTriggerCrawl();
  const triggerRescore = useTriggerRescore();
  const triggerEnrich = useTriggerEnrich();
  const triggerRematch = useTriggerRematch();

  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  async function handleTrigger(
    name: string,
    mutateAsync: () => Promise<{ detail: string }>,
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to trigger "${name}" now?`,
    );
    if (!confirmed) return;

    try {
      const result = await mutateAsync();
      setTriggerMessage(result.detail);
      setTimeout(() => setTriggerMessage(null), 5000);
    } catch {
      setTriggerMessage(`Failed to trigger ${name}`);
      setTimeout(() => setTriggerMessage(null), 5000);
    }
  }

  const anyTriggerPending =
    triggerCrawl.isPending ||
    triggerRescore.isPending ||
    triggerEnrich.isPending ||
    triggerRematch.isPending;

  const triggers = [
    {
      label: "Crawl",
      description: "Enqueue stale companies for ATS crawling",
      icon: Search,
      mutation: triggerCrawl,
    },
    {
      label: "Rescore",
      description: "Re-score all active user profiles",
      icon: BarChart3,
      mutation: triggerRescore,
    },
    {
      label: "Enrich",
      description: "Enrich un-enriched jobs via LLM",
      icon: Sparkles,
      mutation: triggerEnrich,
    },
    {
      label: "Rematch",
      description: "Re-run matching for active auto-apply users",
      icon: Users,
      mutation: triggerRematch,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Workers</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Worker status and manual triggers — auto-refreshes every 10s
          </p>
        </div>
        {dataUpdatedAt > 0 && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Clock className="h-3 w-3" />
            Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Worker status cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-subtle bg-bg-card p-5"
              >
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))
          : data?.workers.map((worker) => (
              <WorkerCard key={worker.name} worker={worker} />
            ))}
      </div>

      {/* Manual triggers */}
      <div className="rounded-xl border border-border-subtle bg-bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent-purple/10 p-2">
            <Zap className="h-5 w-5 text-accent-purple" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Manual Triggers
            </h2>
            <p className="text-sm text-text-muted">
              Immediately run scheduled tasks outside their cron cycle
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {triggers.map(({ label, description, icon: Icon, mutation }) => (
            <Button
              key={label}
              variant="outline"
              className="h-auto flex-col items-start gap-1 p-4 text-left"
              disabled={anyTriggerPending}
              onClick={() =>
                handleTrigger(label, () => mutation.mutateAsync())
              }
            >
              <div className="flex items-center gap-2">
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="font-medium">{label}</span>
              </div>
              <span className="text-xs text-text-muted font-normal">
                {description}
              </span>
            </Button>
          ))}
        </div>

        {triggerMessage && (
          <div className="rounded-lg border border-border-subtle bg-emerald-400/5 px-4 py-3">
            <p className="text-sm text-emerald-400">{triggerMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
