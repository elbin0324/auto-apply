import { Card, CardHeader } from "@/components/ui/card";
import { JRow } from "@/components/shared/job-row";
import type { ApplicationStats } from "@/types/application";
import type { Application } from "@/types/application";
import type { QueueStatus } from "@/types/auto-apply";

interface PipelineBoxProps {
  label: string;
  value: number;
  variant: "pri" | "ok" | "fail";
}

function PipelineBox({ label, value, variant }: PipelineBoxProps) {
  const colorMap = {
    pri: "var(--color-pri)",
    ok: "var(--color-ok)",
    fail: "var(--color-fail)",
  } as const;

  const bgMap = {
    pri: "var(--pri-bg)",
    ok: "var(--ok-bg)",
    fail: "var(--fail-bg)",
  } as const;

  return (
    <div
      className="flex flex-1 flex-col items-center rounded-lg border py-3"
      style={{ background: bgMap[variant], borderColor: colorMap[variant], opacity: 0.85 }}
    >
      <span
        className="font-mono text-[20px] font-bold leading-none"
        style={{ color: colorMap[variant] }}
      >
        {value}
      </span>
      <span
        className="mt-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.06em]"
        style={{ color: colorMap[variant], opacity: 0.7 }}
      >
        {label}
      </span>
    </div>
  );
}

interface PipelineCardProps {
  stats: ApplicationStats | undefined;
  queue: QueueStatus | undefined;
  recentApplications: Application[];
  onJobClick: (application: Application) => void;
}

export function PipelineCard({
  stats,
  queue,
  recentApplications,
  onJobClick,
}: PipelineCardProps) {
  const queued = queue?.queue_depth ?? 0;
  const inFlight = queue?.in_progress_count ?? 0;
  const landed = stats?.applied ?? 0;
  const noGo = stats?.failed ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader title="PIPELINE" />
      <div className="p-4">
        {/* Pipeline status boxes */}
        <div className="flex gap-2">
          <PipelineBox label="Queued" value={queued} variant="pri" />
          <PipelineBox label="In-Flight" value={inFlight} variant="pri" />
          <PipelineBox label="Landed" value={landed} variant="ok" />
          <PipelineBox label="No-Go" value={noGo} variant="fail" />
        </div>

        {/* Recent applications */}
        <div className="mt-4 space-y-0.5">
          {recentApplications.map((app) => (
            <JRow
              key={app.id}
              job={{
                id: app.job?.id ?? app.id,
                company: app.job?.company ?? "Unknown",
                company_logo_url: app.job?.company_logo_url,
                title: app.job?.title ?? "Application",
                location: app.job?.location ?? undefined,
                salary_min: app.job?.salary_min ?? undefined,
                salary_max: app.job?.salary_max ?? undefined,
                match_score: app.job?.match_score ?? undefined,
                application_status: app.status,
              }}
              onClick={() => onJobClick(app)}
            />
          ))}
          {recentApplications.length === 0 && (
            <p className="py-6 text-center font-mono text-[11px] text-t-400">
              No recent applications
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
