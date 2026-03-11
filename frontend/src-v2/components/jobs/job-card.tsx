import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchSignal } from "@/components/shared/match-signal";
import { CompanyLogo } from "@/components/shared/company-logo";
import { ApplyPilotMark } from "@/icons";
import {
  formatSalaryRange,
  formatLocationType,
  formatExperienceLevel,

  formatTimeAgo,
} from "@/lib/utils";
import type { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
  onApply: (jobId: string) => void;
  onClick: (job: Job) => void;
}

export function JobCard({ job, onApply, onClick }: JobCardProps) {
  const salary = formatSalaryRange(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
    job.ai_enrichment?.salary,
  );

  const postedDate = job.posted_at ? formatTimeAgo(new Date(job.posted_at)) : null;

  const meta = [job.company, postedDate, salary, job.location]
    .filter(Boolean)
    .join(" / ");

  const badges: { label: string; color: "pri" | "ok" | "warn" | "fail" | "muted" }[] = [];

  const locType = formatLocationType(job.location_type);
  if (locType) {
    badges.push({ label: locType, color: "muted" });
  }

  const expLevelColorMap: Record<string, "pri" | "ok" | "warn" | "fail" | "muted"> = {
    entry: "pri",
    mid: "ok",
    senior: "warn",
    lead: "fail",
    executive: "fail",
  };
  const expLevel = formatExperienceLevel(job.experience_level);
  if (expLevel) {
    badges.push({ label: expLevel, color: expLevelColorMap[job.experience_level ?? ""] ?? "muted" });
  }



  return (
    <div
      className="grid cursor-pointer items-center gap-6 rounded-lg border border-transparent px-3 py-3 transition-all hover:border-[var(--pri-border)] hover:shadow-[0_0_0_2px_var(--pri-glow)] grid-cols-[48px_1fr_auto] md:grid-cols-[48px_1fr_auto_auto] lg:grid-cols-[48px_1fr_auto_auto_auto]"
    >
      {/* Logo */}
      <div onClick={() => onClick(job)}>
        <CompanyLogo company={job.company ?? ""} logoUrl={job.company_logo_url} />
      </div>

      {/* Info */}
      <div className="min-w-0" onClick={() => onClick(job)}>
        <p className="truncate font-sans text-[14px] font-semibold text-t-900 hover:text-pri transition-colors">
          {job.title}
        </p>
        <p className="truncate font-mono text-[11px] text-t-400">{meta}</p>
      </div>

      {/* Tags — hidden below xl */}
      {badges.length > 0 && (
        <div className="hidden lg:flex shrink-0 gap-1.5">
          {badges.map((b) => (
            <Badge key={b.label} color={b.color}>
              {b.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Match — hidden below md */}
      {job.match_score != null && (
        <div className="hidden md:block">
          <MatchSignal score={job.match_score} />
        </div>
      )}

      {/* Actions */}
      <div>
        <Button
          variant="primary"
          onClick={() => onApply(job.id)}
          className="px-3 py-1.5 text-[10px] gap-1.5"
        >
          Apply
          <ApplyPilotMark size={10} color="currentColor" />
        </Button>
      </div>
    </div>
  );
}
