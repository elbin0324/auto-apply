import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchDot } from "@/components/shared/match-dot";
import type { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
  onApply: (jobId: string) => void;
  onClick: (job: Job) => void;
}

function companyCode(name: string): string {
  return name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return "";
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);
  if (min && max) return `${fmt(min)}-${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export function JobCard({ job, onApply, onClick }: JobCardProps) {
  const meta = [job.company, job.location, formatSalary(job.salary_min, job.salary_max)]
    .filter(Boolean)
    .join(" / ");

  const tags = job.tags?.slice(0, 4) ?? [];

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
        {tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} color="muted">
                {tag}
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
