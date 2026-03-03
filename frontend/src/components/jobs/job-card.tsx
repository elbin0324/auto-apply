import { Link } from "@tanstack/react-router";
import { MapPin, Clock, Send, X, Undo2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSalaryRange, formatRelativeDate } from "@/lib/utils";
import { useQueueJob, useSkipJob, useUnskipJob } from "@/hooks/use-job-actions";
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

const statusConfig: Record<string, { label: string; className: string }> = {
  pending_review: {
    label: "Pending Review",
    className: "text-amber-400 bg-amber-400/15",
  },
  queued: {
    label: "Queued",
    className: "text-accent-blue bg-accent-blue/15",
  },
  in_progress: {
    label: "Applying...",
    className: "text-purple-400 bg-purple-400/15",
  },
  applied: {
    label: "Applied",
    className: "text-accent-green bg-accent-green/15",
  },
  skipped: {
    label: "Skipped",
    className: "text-text-muted bg-text-muted/10 line-through",
  },
  failed: {
    label: "Failed",
    className: "text-red-400 bg-red-400/15",
  },
};

export function JobCard({ job }: JobCardProps) {
  const queueMutation = useQueueJob();
  const skipMutation = useSkipJob();
  const unskipMutation = useUnskipJob();

  const appStatus = job.application_status;
  const cfg = appStatus ? statusConfig[appStatus] : null;

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
        <div className="flex items-center gap-2 shrink-0">
          {cfg && (
            <Badge variant="secondary" className={`text-xs ${cfg.className}`}>
              {cfg.label}
            </Badge>
          )}
          {job.match_score != null && (
            <Badge
              variant="secondary"
              className={`font-mono ${matchColor(job.match_score)}`}
            >
              {job.match_score}%
            </Badge>
          )}
        </div>
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

      {/* Action buttons */}
      <div
        className="mt-3 flex gap-2"
        onClick={(e) => e.preventDefault()}
      >
        {appStatus == null && (
          <>
            <Button
              size="sm"
              variant="default"
              disabled={queueMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                queueMutation.mutate(job.id);
              }}
            >
              {queueMutation.isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1 h-3.5 w-3.5" />
              )}
              Queue
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={skipMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                skipMutation.mutate(job.id);
              }}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Skip
            </Button>
          </>
        )}
        {appStatus === "skipped" && (
          <Button
            size="sm"
            variant="ghost"
            disabled={unskipMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              unskipMutation.mutate(job.id);
            }}
          >
            <Undo2 className="mr-1 h-3.5 w-3.5" />
            Undo Skip
          </Button>
        )}
      </div>
    </Link>
  );
}
