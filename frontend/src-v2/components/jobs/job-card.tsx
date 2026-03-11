import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchDot } from "@/components/shared/match-dot";
import {
  formatSalaryRange,
  formatLocationType,
  formatExperienceLevel,
  formatEmploymentType,
} from "@/lib/utils";
import type { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
  onApply: (jobId: string) => void;
  onClick: (job: Job) => void;
}

function companyCode(name: string): string {
  return name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

export function JobCard({ job, onApply, onClick }: JobCardProps) {
  const salary = formatSalaryRange(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
    job.ai_enrichment?.salary,
  );

  const meta = [job.company, job.location, salary].filter(Boolean).join(" / ");

  const badges: { label: string; color: "pri" | "muted" }[] = [];

  const locType = formatLocationType(job.location_type);
  if (locType) {
    badges.push({
      label: locType,
      color: job.location_type === "remote" ? "pri" : "muted",
    });
  }

  const expLevel = formatExperienceLevel(job.experience_level);
  if (expLevel) badges.push({ label: expLevel, color: "muted" });

  const empType = formatEmploymentType(job.employment_type);
  if (empType) badges.push({ label: empType, color: "muted" });

  return (
    <div
      className="grid cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-3 transition-all hover:border-[var(--pri-border)] hover:shadow-[0_0_0_2px_var(--pri-glow)]"
      style={{ gridTemplateColumns: "48px 1fr 120px auto" }}
    >
      {/* Logo */}
      <div
        className="flex h-[44px] w-[44px] items-center justify-center rounded-lg bg-bg-deep"
        onClick={() => onClick(job)}
      >
        <span className="font-mono text-[10px] font-bold text-pri">
          {companyCode(job.company ?? "")}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0" onClick={() => onClick(job)}>
        <p className="truncate font-sans text-[14px] font-semibold text-t-900 hover:text-pri transition-colors">
          {job.title}
        </p>
        <p className="truncate font-mono text-[11px] text-t-400">{meta}</p>
        {badges.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <Badge key={b.label} color={b.color}>
                {b.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Match */}
      <div className="w-[120px]">
        {job.match_score != null && <MatchDot score={job.match_score} />}
      </div>

      {/* Actions */}
      <div>
        <Button
          variant="primary"
          onClick={() => onApply(job.id)}
          className="px-3 py-1.5 text-[10px]"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
