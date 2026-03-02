import { CheckCircle2, XCircle, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications } from "@/hooks/use-applications";
import { useReviewApplication } from "@/hooks/use-auto-apply-status";
import { formatDate } from "@/lib/utils";

export function ReviewQueue() {
  const { data, isLoading } = useApplications({
    status: "pending_review",
    per_page: 50,
  });
  const reviewMutation = useReviewApplication();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  const applications = data?.applications ?? [];

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">
          Review Queue
        </h2>
        {applications.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {applications.length} pending
          </Badge>
        )}
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <FileText className="h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">
            No applications awaiting review
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-lg border border-border-subtle bg-bg/50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary truncate">
                    {app.job?.title ?? "Unknown Position"}
                  </p>
                  <p className="mt-0.5 text-sm text-text-secondary truncate">
                    {app.job?.company ?? "Unknown Company"}
                    {app.job?.location && ` · ${app.job.location}`}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Added {formatDate(app.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-400 hover:text-red-300 hover:border-red-400/50"
                    disabled={reviewMutation.isPending}
                    onClick={() =>
                      reviewMutation.mutate({
                        applicationId: app.id,
                        action: "reject",
                      })
                    }
                  >
                    {reviewMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-1 h-4 w-4" />
                    )}
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={reviewMutation.isPending}
                    onClick={() =>
                      reviewMutation.mutate({
                        applicationId: app.id,
                        action: "approve",
                      })
                    }
                  >
                    {reviewMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>

              {/* Cover letter preview */}
              {app.cover_letter_used && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-accent-purple hover:text-accent-purple-light transition-colors">
                    View Cover Letter
                  </summary>
                  <p className="mt-2 rounded-md bg-bg p-3 text-xs text-text-secondary whitespace-pre-wrap">
                    {app.cover_letter_used}
                  </p>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
