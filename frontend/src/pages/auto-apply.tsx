import { Loader2 } from "lucide-react";
import { useAutoApplyConfig } from "@/hooks/use-auto-apply-status";
import { ControlPanel } from "@/components/auto-apply/control-panel";
import { QueueDisplay } from "@/components/auto-apply/queue-display";
import { ConfigForm } from "@/components/auto-apply/config-form";
import { ReviewQueue } from "@/components/auto-apply/review-queue";

export default function AutoApplyPage() {
  const { data: config, isLoading } = useAutoApplyConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Control panel — start/stop */}
      <ControlPanel />

      {/* Queue status */}
      <QueueDisplay />

      {/* Review queue */}
      <ReviewQueue />

      {/* Configuration form */}
      {config && (
        <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            Search Criteria
          </h2>
          <ConfigForm config={config} />
        </div>
      )}
    </div>
  );
}
