import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Led } from "@/components/ui/led";
import { api } from "@/lib/api";
import { cn } from "@/theme/utils";
import type { Application, ApplicationListResponse } from "@/types/application";

const PHASES = ["NAV", "EXTRACT", "AI-GEN", "FILL", "SUBMIT"] as const;

function phaseIndex(phase: string | null | undefined): number {
  if (!phase) return 0;
  const normalized = phase.toUpperCase().replace(/[^A-Z]/g, "");
  if (normalized.includes("NAV")) return 0;
  if (normalized.includes("EXTRACT")) return 1;
  if (normalized.includes("GEN") || normalized.includes("AI")) return 2;
  if (normalized.includes("FILL")) return 3;
  if (normalized.includes("SUBMIT")) return 4;
  return 0;
}

function companyCode(name: string): string {
  return name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

interface SegmentBarProps {
  activeIndex: number;
}

function SegmentBar({ activeIndex }: SegmentBarProps) {
  return (
    <div className="flex items-center gap-1">
      {PHASES.map((label, i) => {
        const isActive = i <= activeIndex;
        const isCurrent = i === activeIndex;
        return (
          <div key={label} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "h-[4px] w-[40px] rounded-full transition-all duration-300",
                isActive ? "bg-pri" : "bg-bg-muted",
                isCurrent && "shadow-[0_0_6px_var(--pri-glow)]",
              )}
            />
            <span
              className={cn(
                "font-mono text-[8px] font-bold uppercase tracking-[0.04em]",
                isActive ? "text-pri" : "text-t-400",
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface FlightRowProps {
  application: Application;
}

function FlightRow({ application }: FlightRowProps) {
  const job = application.job;
  const company = job?.company ?? "Unknown";
  const title = job?.title ?? "Application";
  const active = phaseIndex(application.current_phase);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Logo */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-deep">
        <span className="font-mono text-[9px] font-bold text-pri">
          {companyCode(company)}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-[12px] font-semibold text-t-900">{title}</p>
        <p className="truncate font-mono text-[10px] text-t-400">{company}</p>
      </div>

      {/* Progress */}
      <SegmentBar activeIndex={active} />
    </div>
  );
}

interface InFlightMonitorProps {
  inProgressCount: number;
}

export function InFlightMonitor({ inProgressCount }: InFlightMonitorProps) {
  const isIdle = inProgressCount === 0;

  const { data } = useQuery({
    queryKey: ["applications", "in_progress", 1],
    queryFn: () =>
      api.get<ApplicationListResponse>(
        "/api/applications?status=in_progress&page=1&per_page=10",
      ),
    enabled: !isIdle,
  });

  const applications = data?.applications ?? [];

  if (isIdle) {
    return (
      <Card className="border-border-main opacity-60">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Led color="muted" size={8} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-t-400">
            IDLE
          </span>
          <span className="font-mono text-[10px] text-t-300">
            No applications in flight
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="border-[var(--pri-border)]"
      style={{ background: "var(--pri-bg)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--pri-border)] px-4 py-2.5">
        <Led color="pri" size={8} />
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{ color: "var(--color-pri)" }}
        >
          LIVE
        </span>
        <span className="font-mono text-[10px] text-t-400">
          {inProgressCount} in flight
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[var(--pri-border)]">
        {applications.map((app) => (
          <FlightRow key={app.id} application={app} />
        ))}
        {applications.length === 0 && (
          <div className="px-4 py-3">
            <p className="font-mono text-[11px] text-t-400">Loading in-flight applications...</p>
          </div>
        )}
      </div>
    </Card>
  );
}
