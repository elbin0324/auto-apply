import { Loader2, Zap, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAutoApplyConfig,
  useStartAutoApply,
  useStopAutoApply,
} from "@/hooks/use-auto-apply-status";

export function ControlPanel() {
  const { data: config, isLoading } = useAutoApplyConfig();
  const startMutation = useStartAutoApply();
  const stopMutation = useStopAutoApply();

  const isActive = config?.is_active ?? false;
  const isMutating = startMutation.isPending || stopMutation.isPending;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
        <Skeleton className="mx-auto h-6 w-32" />
        <Skeleton className="mx-auto mt-4 h-12 w-48" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-6 text-center">
      {/* Status indicator */}
      <div className="flex items-center justify-center gap-2.5">
        <span className="relative flex h-3 w-3">
          {isActive && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
          )}
          <span
            className={`relative inline-flex h-3 w-3 rounded-full ${
              isActive ? "bg-accent-green" : "bg-text-muted"
            }`}
          />
        </span>
        <span
          className={`text-lg font-semibold ${
            isActive ? "text-accent-green" : "text-text-muted"
          }`}
        >
          {isActive ? "Auto-Apply Running" : "Auto-Apply Stopped"}
        </span>
      </div>

      <p className="mt-2 text-sm text-text-secondary">
        {isActive
          ? "The system is actively finding and applying to jobs matching your criteria."
          : "Start auto-apply to begin finding and applying to jobs automatically."}
      </p>

      {/* Toggle button */}
      <Button
        className="mt-5"
        size="lg"
        variant={isActive ? "destructive" : "default"}
        disabled={isMutating}
        onClick={() => {
          if (isActive) {
            stopMutation.mutate();
          } else {
            startMutation.mutate();
          }
        }}
      >
        {isMutating ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : isActive ? (
          <Square className="mr-2 h-5 w-5" />
        ) : (
          <Zap className="mr-2 h-5 w-5" />
        )}
        {isMutating
          ? "Updating..."
          : isActive
            ? "Stop Auto-Apply"
            : "Start Auto-Apply"}
      </Button>
    </div>
  );
}
