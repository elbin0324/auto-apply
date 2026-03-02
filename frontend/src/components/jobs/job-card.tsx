import { Link } from "@tanstack/react-router";
import { MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatSalaryRange, formatRelativeDate } from "@/lib/utils";
import type { JobResponse } from "@/types/job";

interface JobCardProps {
  job: JobResponse;
}

function matchColor(score: number | null | undefined) {
  if (score == null) return "text-text-muted bg-text-muted/10";
  if (score >= 80) return "text-accent-green bg-accent-green/15";
  if (score >= 60) return "text-accent-blue bg-accent-blue/15";
  return "text-text-muted bg-text-muted/10";
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: job.id }}
      className="block rounded-xl border border-border-subtle bg-bg-card p-5 hover:border-border-hover hover:bg-bg-card-hover transition-colors duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-text-primary">
            {job.title}
          </h3>
          <p className="mt-0.5 truncate text-sm text-text-secondary">
            {job.company ?? "Unknown Company"}
          </p>
        </div>
        {job.match_score != null && (
          <Badge
            variant="secondary"
            className={`shrink-0 font-mono ${matchColor(job.match_score)}`}
          >
            {job.match_score}%
          </Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.location}
          </span>
        )}
        {job.location_type && (
          <Badge variant="outline" className="text-xs py-0 px-1.5">
            {job.location_type}
          </Badge>
        )}
        {(job.salary_min || job.salary_max) && (
          <span className="font-mono text-text-secondary">
            {formatSalaryRange(job.salary_min, job.salary_max)}
          </span>
        )}
        {job.posted_at && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeDate(job.posted_at)}
          </span>
        )}
      </div>
    </Link>
  );
}
