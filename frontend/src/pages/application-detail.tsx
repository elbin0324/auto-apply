import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  MapPin,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Image,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/applications/status-badge";
import { useApplicationDetail } from "@/hooks/use-applications";
import { formatDate } from "@/lib/utils";

export default function ApplicationDetailPage() {
  const { applicationId } = useParams({ strict: false }) as {
    applicationId: string;
  };
  const { data: app, isLoading } = useApplicationDetail(applicationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-text-secondary">Application not found.</p>
        <Link
          to="/applications"
          className="mt-2 inline-flex items-center gap-1 text-sm text-accent-purple hover:text-accent-purple-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Link
        to="/applications"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </Link>

      {/* Header — Job info + status */}
      <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-text-primary">
              {app.job?.title ?? "Unknown Position"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {app.job?.company ?? "Unknown Company"}
              </span>
              {app.job?.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {app.job.location}
                </span>
              )}
              {app.job?.location_type && (
                <Badge variant="outline">{app.job.location_type}</Badge>
              )}
            </div>
          </div>
          <StatusBadge status={app.status} />
        </div>

        {app.job?.url && (
          <Button className="mt-4" variant="outline" size="sm" asChild>
            <a href={app.job.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              View Job Posting
            </a>
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
        <h2 className="text-sm font-semibold text-text-primary">Timeline</h2>
        <div className="mt-4 space-y-3">
          <TimelineItem
            label="Created"
            date={app.created_at}
            active
          />
          {app.applied_at && (
            <TimelineItem
              label="Applied"
              date={app.applied_at}
              active
            />
          )}
          {app.status === "failed" && (
            <TimelineItem
              label="Failed"
              date={app.applied_at ?? app.created_at}
              active
              variant="error"
            />
          )}
        </div>
      </div>

      {/* Error message */}
      {app.error_message && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h2 className="text-sm font-semibold text-red-400">Error</h2>
          </div>
          <p className="mt-2 text-sm text-red-300 whitespace-pre-wrap">
            {app.error_message}
          </p>
        </div>
      )}

      {/* Cover letter */}
      {app.cover_letter_used && (
        <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
          <h2 className="text-sm font-semibold text-text-primary">
            Cover Letter
          </h2>
          <p className="mt-3 text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {app.cover_letter_used}
          </p>
        </div>
      )}

      {/* Screenshot */}
      {app.screenshot_url && (
        <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">
              Screenshot
            </h2>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-border-subtle">
            <img
              src={app.screenshot_url}
              alt="Application screenshot"
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Resume */}
      {app.resume_used_url && (
        <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
          <h2 className="text-sm font-semibold text-text-primary">
            Resume Used
          </h2>
          <Button className="mt-3" variant="outline" size="sm" asChild>
            <a
              href={app.resume_used_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1.5 h-4 w-4" />
              View Resume
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

function TimelineItem({
  label,
  date,
  active,
  variant = "default",
}: {
  label: string;
  date: string;
  active: boolean;
  variant?: "default" | "error";
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-2.5 w-2.5 rounded-full ${
          !active
            ? "bg-border-subtle"
            : variant === "error"
              ? "bg-red-400"
              : "bg-accent-green"
        }`}
      />
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <span className="text-xs text-text-muted">{formatDate(date)}</span>
    </div>
  );
}
