import { useState } from "react";
import {
  useAutoApplyConfig,
  useUpdateAutoApplyConfig,
  useStartAutopilot,
  useStopAutopilot,
  useQueueStatus,
  useApplicationStats,
} from "@/hooks/use-auto-apply";
import { EngageCard } from "@/components/autopilot/engage-card";
import { TargetingCard } from "@/components/autopilot/targeting-card";
import { ModeCard } from "@/components/autopilot/mode-card";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { AutoApplyConfig } from "@/types/auto-apply";

function AutopilotSkeleton() {
  return (
    <div className="flex flex-col gap-3.5">
      {/* Engage card skeleton */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3.5">
            <Skeleton className="h-[44px] w-[44px] rounded-lg" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="flex border-t border-border-subtle bg-bg-inset">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-1 items-center justify-center gap-1.5 py-2.5"
              style={i < 3 ? { borderRight: "1px solid var(--border-subtle)" } : {}}
            >
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </Card>
      {/* Targeting + Mode skeleton */}
      <div className="grid gap-3.5 md:grid-cols-2">
        <Card>
          <div className="border-b border-border-subtle bg-bg-inset px-[18px] py-3">
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </Card>
        <Card>
          <div className="border-b border-border-subtle bg-bg-inset px-[18px] py-3">
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-full rounded-md" />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AutopilotPage() {
  const { data: config, isLoading: configLoading } = useAutoApplyConfig();
  const { data: queueStatus } = useQueueStatus();
  const { data: stats } = useApplicationStats();
  const updateConfig = useUpdateAutoApplyConfig();
  const startAutopilot = useStartAutopilot();
  const stopAutopilot = useStopAutopilot();
  const [billingError, setBillingError] = useState<import("@/types/billing").BillingError | null>(
    null,
  );

  const handleSave = (data: Partial<AutoApplyConfig>) => {
    updateConfig.mutate(data);
  };

  if (configLoading) return <AutopilotSkeleton />;

  return (
    <div className="flex flex-col gap-3.5">
      <EngageCard
        config={config}
        queueStatus={queueStatus}
        stats={stats}
        onEngage={() => {
          startAutopilot.mutate(undefined, {
            onError: (error) => {
              if (error instanceof ApiError && error.status === 403) {
                const body = error.body as { detail?: import("@/types/billing").BillingError } | undefined;
                if (body?.detail?.code) {
                  setBillingError(body.detail);
                }
              }
            },
          });
        }}
        onDisengage={() => stopAutopilot.mutate()}
        isEngaging={startAutopilot.isPending}
        isDisengaging={stopAutopilot.isPending}
      />
      <div className="grid gap-3.5 md:grid-cols-2">
        <TargetingCard config={config} onSave={handleSave} />
        <ModeCard config={config} onSave={handleSave} />
      </div>

      {billingError && (
        <UpgradeModal error={billingError} onClose={() => setBillingError(null)} />
      )}
    </div>
  );
}
