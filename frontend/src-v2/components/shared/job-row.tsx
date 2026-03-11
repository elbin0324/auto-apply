import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { MatchDot } from "./match-dot";
import { statusColor, statusLabel } from "@/theme/tokens";

interface JRowJob {
  id: string;
  company: string;
  title: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  match_score?: number;
  application_status?: string;
  tags?: string[];
}

interface JRowProps {
  job: JRowJob;
  onClick?: () => void;
  actions?: React.ReactNode;
}

function companyCode(name: string): string {
  return name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return "";
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);
  if (min && max) return `${fmt(min)}-${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export const JRow = memo(function JRow({ job, onClick, actions }: JRowProps) {
  const meta = [job.company, job.location, formatSalary(job.salary_min, job.salary_max)]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="group">
      <div
        onClick={onClick}
        className="grid cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-3 transition-all hover:border-[var(--pri-border)] hover:shadow-[0_0_0_2px_var(--pri-glow)]"
        style={{ gridTemplateColumns: "44px 1fr 120px 80px" }}
      >
        {/* Logo */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-deep">
          <span className="font-mono text-[10px] font-bold text-pri">
            {companyCode(job.company)}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="truncate font-sans text-[13px] font-semibold text-t-900">{job.title}</p>
          <p className="truncate font-mono text-[11px] text-t-400">{meta}</p>
        </div>

        {/* Match */}
        <div>
          {job.match_score != null && <MatchDot score={job.match_score} size="sm" />}
        </div>

        {/* Status */}
        <div className="text-right">
          {job.application_status && (
            <Badge color={statusColor(job.application_status)}>
              {statusLabel(job.application_status)}
            </Badge>
          )}
        </div>
      </div>
      {actions && <div className="pl-[56px] pb-2">{actions}</div>}
    </div>
  );
});
