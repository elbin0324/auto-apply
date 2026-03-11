import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAutoApplyConfig,
  useAutoApplyQueue,
  useStartAutoApply,
  useStopAutoApply,
} from "@/hooks/use-auto-apply-status";

export function AutoApplyWidget() {
  const { data: config, isLoading: configLoading } = useAutoApplyConfig();
  const { data: queue, isLoading: queueLoading } = useAutoApplyQueue(
    config?.is_active,
  );
  const startMutation = useStartAutoApply();
  const stopMutation = useStopAutoApply();

  const isActive = config?.is_active ?? false;
  const isLoading = configLoading || queueLoading;
  const isMutating = startMutation.isPending || stopMutation.isPending;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card">
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
        <h2 className="text-sm font-semibold text-text-primary">Auto-Apply</h2>
        <Link
          to="/auto-apply"
          className="text-xs text-accent-purple hover:text-accent-purple-light transition-colors"
        >
          Settings
        </Link>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <>
            {/* Status indicator */}
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                {isActive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    isActive ? "bg-accent-green" : "bg-text-muted"
                  }`}
                />
              </span>
              <span
                className={`text-sm font-medium ${
                  isActive ? "text-accent-green" : "text-text-muted"
                }`}
              >
                {isActive ? "Running" : "Stopped"}
              </span>
            </div>

            {/* Queue stats */}
            {queue && (
              <div className="mt-3 flex gap-4 text-xs text-text-secondary">
                <span>
                  <span className="font-mono text-text-primary">
                    {queue.queue_depth}
                  </span>{" "}
                  queued
                </span>
                <span>
                  <span className="font-mono text-text-primary">
                    {queue.pending_review_count}
                  </span>{" "}
                  review
                </span>
                <span>
                  <span className="font-mono text-text-primary">
                    {queue.in_progress_count}
                  </span>{" "}
                  active
                </span>
              </div>
            )}

            {/* Toggle button */}
            <Button
              className="mt-4 w-full"
              variant={isActive ? "destructive" : "default"}
              size="sm"
              disabled={isMutating}
              onClick={() => {
                if (isActive) {
                  stopMutation.mutate();
                } else {
                  startMutation.mutate();
                }
              }}
            >
              <Zap className="mr-1.5 h-4 w-4" />
              {isMutating
                ? "..."
                : isActive
                  ? "Stop"
                  : "Start"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
