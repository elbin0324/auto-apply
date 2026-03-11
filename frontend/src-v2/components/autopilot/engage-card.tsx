import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, Play, Stop } from "@/icons";
import type { AutoApplyConfig, QueueStatus } from "@/types/auto-apply";
import type { ApplicationStats } from "@/types/application";

interface EngageCardProps {
  config: AutoApplyConfig | undefined;
  queueStatus: QueueStatus | undefined;
  stats: ApplicationStats | undefined;
  onEngage: () => void;
  onDisengage: () => void;
  isEngaging: boolean;
  isDisengaging: boolean;
}

export function EngageCard({
  config,
  queueStatus,
  stats,
  onEngage,
  onDisengage,
  isEngaging,
  isDisengaging,
}: EngageCardProps) {
  const isActive = config?.is_active ?? false;

  return (
    <Card className={isActive ? "border-pri" : undefined}>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3.5">
          <div
            className="flex shrink-0 items-center justify-center rounded-lg"
            style={{
              width: 44,
              height: 44,
              background: isActive ? "var(--pri-bg)" : "var(--bg-inset)",
            }}
          >
            <Plane size={20} color={isActive ? "var(--color-pri)" : "var(--color-t-400)"} />
          </div>
          <span
            className="font-mono text-[14px] font-bold uppercase tracking-[0.06em]"
            style={{ color: isActive ? "var(--color-pri)" : "var(--color-t-400)" }}
          >
            {isActive ? "AUTOPILOT ENGAGED" : "AUTOPILOT DISENGAGED"}
          </span>
        </div>
        {isActive ? (
          <Button
            variant="danger"
            icon={<Stop size={12} />}
            onClick={onDisengage}
            loading={isDisengaging}
          >
            DISENGAGE
          </Button>
        ) : (
          <Button
            variant="primary"
            icon={<Play size={12} />}
            onClick={onEngage}
            loading={isEngaging}
          >
            ENGAGE
          </Button>
        )}
      </div>
      <StatsFooter
        queueStatus={queueStatus}
        stats={stats}
        dailyLimit={config?.daily_apply_limit ?? 0}
      />
    </Card>
  );
}

interface StatsFooterProps {
  queueStatus: QueueStatus | undefined;
  stats: ApplicationStats | undefined;
  dailyLimit: number;
}

function StatsFooter({ queueStatus, stats, dailyLimit }: StatsFooterProps) {
  const items = [
    { label: "QUEUE", value: String(queueStatus?.queue_depth ?? 0) },
    { label: "REVIEW", value: String(queueStatus?.pending_review_count ?? 0) },
    { label: "IN-FLIGHT", value: String(queueStatus?.in_progress_count ?? 0) },
    { label: "TODAY", value: `${stats?.this_week ?? 0}/${dailyLimit}` },
  ];

  return (
    <div className="flex items-center gap-0 border-t border-border-subtle bg-bg-inset">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-t-400"
          style={i < items.length - 1 ? { borderRight: "1px solid var(--border-subtle)" } : {}}
        >
          <span>{item.label}:</span>
          <span className="text-t-700">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
