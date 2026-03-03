import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Clock,
  Send,
  X,
  Undo2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/ui/company-logo";
import { MatchScoreBadge } from "@/components/ui/match-score-badge";
import { JobStatusBadge } from "@/components/ui/job-status-badge";
import { formatSalaryRange, formatRelativeDate } from "@/lib/utils";
import { useQueueJob, useSkipJob, useUnskipJob } from "@/hooks/use-job-actions";
import { useReviewApplication } from "@/hooks/use-auto-apply-status";
import type { JobResponse } from "@/types/job";

interface JobCardProps {
  job: JobResponse;
}

export function JobCard({ job }: JobCardProps) {
  const queueMutation = useQueueJob();
  const skipMutation = useSkipJob();
  const unskipMutation = useUnskipJob();
  const reviewMutation = useReviewApplication();

  const appStatus = job.application_status;

  return (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: job.id }}
      className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-card px-5 py-4 hover:border-border-hover hover:bg-bg-card-hover transition-colors duration-200"
    >
      {/* Company logo */}
      <CompanyLogo
        name={job.company}
        logoUrl={job.company_logo_url}
        size="md"
      />

      {/* Text info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-text-primary">
          {job.title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
          <span className="truncate">
            {job.company ?? "Unknown Company"}
          </span>
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
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
              <Clock className="h-3 w-3" />
              {formatRelativeDate(job.posted_at)}
            </span>
          )}
        </div>
      </div>

      {/* Right side: score + status + actions */}
      <div
        className="flex shrink-0 items-center gap-2"
        onClick={(e) => e.preventDefault()}
      >
        {/* Status badge for non-actionable statuses */}
        {appStatus &&
          appStatus !== "pending_review" &&
          appStatus !== "skipped" && (
            <JobStatusBadge status={appStatus} />
          )}

        {/* Match score */}
        <MatchScoreBadge score={job.match_score} />

        {/* New job: Queue / Skip */}
        {appStatus == null && (
          <>
            <Button
              size="sm"
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

        {/* Pending review: Approve / Reject */}
        {appStatus === "pending_review" && job.application_id && (
          <>
            <Button
              size="sm"
              disabled={reviewMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                reviewMutation.mutate({
                  applicationId: job.application_id!,
                  action: "approve",
                });
              }}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-400 hover:text-red-300 hover:border-red-400/50"
              disabled={reviewMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                reviewMutation.mutate({
                  applicationId: job.application_id!,
                  action: "reject",
                });
              }}
            >
              <XCircle className="mr-1 h-3.5 w-3.5" />
              Reject
            </Button>
          </>
        )}

        {/* Skipped: Undo */}
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
