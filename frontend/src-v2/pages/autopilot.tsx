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
import type { AutoApplyConfig } from "@/types/auto-apply";

export default function AutopilotPage() {
  const { data: config } = useAutoApplyConfig();
  const { data: queueStatus } = useQueueStatus();
  const { data: stats } = useApplicationStats();
  const updateConfig = useUpdateAutoApplyConfig();
  const startAutopilot = useStartAutopilot();
  const stopAutopilot = useStopAutopilot();

  const handleSave = (data: Partial<AutoApplyConfig>) => {
    updateConfig.mutate(data);
  };

  return (
    <div className="flex flex-col gap-3.5">
      <EngageCard
        config={config}
        queueStatus={queueStatus}
        stats={stats}
        onEngage={() => startAutopilot.mutate()}
        onDisengage={() => stopAutopilot.mutate()}
        isEngaging={startAutopilot.isPending}
        isDisengaging={stopAutopilot.isPending}
      />
      <div className="grid gap-3.5 md:grid-cols-2">
        <TargetingCard config={config} onSave={handleSave} />
        <ModeCard config={config} onSave={handleSave} />
      </div>
    </div>
  );
}
