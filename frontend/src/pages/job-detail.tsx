import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  Loader2,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useJobDetail, useJobMatch } from "@/hooks/use-job-detail";
import { formatSalaryRange, formatDate } from "@/lib/utils";

export default function JobDetailPage() {
  const { jobId } = useParams({ strict: false }) as { jobId: string };
  const { data: job, isLoading } = useJobDetail(jobId);
  const { data: match } = useJobMatch(jobId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-text-secondary">Job not found.</p>
        <Link
          to="/jobs"
          className="mt-2 inline-flex items-center gap-1 text-sm text-accent-purple hover:text-accent-purple-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Link
        to="/jobs"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
        <h1 className="text-xl font-bold text-text-primary">{job.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            {job.company ?? "Unknown"}
          </span>
          {job.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
          )}
          {job.location_type && (
            <Badge variant="outline">{job.location_type}</Badge>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {(job.salary_min || job.salary_max) && (
            <span className="font-mono text-lg font-semibold text-text-primary">
              {formatSalaryRange(job.salary_min, job.salary_max)}
            </span>
          )}
          {job.posted_at && (
            <span className="text-sm text-text-muted">
              Posted {formatDate(job.posted_at)}
            </span>
          )}
        </div>

        {job.url && (
          <Button className="mt-4" asChild>
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Apply on {job.source}
            </a>
          </Button>
        )}
      </div>

      {/* Match score */}
      {match && (
        <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
          <h2 className="text-sm font-semibold text-text-primary">
            Match Score
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-border-subtle">
              <div
                className={`h-full rounded-full transition-all ${
                  match.score >= 80
                    ? "bg-accent-green"
                    : match.score >= 60
                      ? "bg-accent-blue"
                      : "bg-text-muted"
                }`}
                style={{ width: `${match.score}%` }}
              />
            </div>
            <span className="font-mono text-lg font-bold text-text-primary">
              {match.score}%
            </span>
          </div>
          {match.factors &&
            Object.keys(match.factors).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(match.factors).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Tags */}
      {job.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {job.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Description */}
      {job.description && (
        <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">
            Description
          </h2>
          <div className="prose prose-invert prose-sm max-w-none text-text-secondary whitespace-pre-wrap">
            {job.description}
          </div>
        </div>
      )}
    </div>
  );
}
