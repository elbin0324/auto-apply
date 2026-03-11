import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/applications/status-badge";
import { formatRelativeDate } from "@/lib/utils";
import type { ApplicationDetail } from "@/types/application";

interface RecentApplicationsProps {
  applications?: ApplicationDetail[];
  isLoading: boolean;
}

export function RecentApplications({
  applications,
  isLoading,
}: RecentApplicationsProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-card">
        <div className="border-b border-border-subtle px-5 py-4">
          <h2 className="text-sm font-semibold text-text-primary">
            Recent Applications
          </h2>
        </div>
        <div className="divide-y divide-border-subtle">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const items = applications?.slice(0, 5) ?? [];

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card">
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
        <h2 className="text-sm font-semibold text-text-primary">
          Recent Applications
        </h2>
        <Link
          to="/applications"
          className="text-xs text-accent-purple hover:text-accent-purple-light transition-colors"
        >
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <FileText className="h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">No applications yet</p>
          <p className="text-xs text-text-muted">
            Start applying to see your activity here
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {items.map((app) => (
              <Link
                key={app.id}
                to="/applications/$applicationId"
                params={{ applicationId: app.id }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-card-hover transition-colors duration-200"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {app.job?.title ?? "Unknown Position"}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {app.job?.company ?? "Unknown Company"} &middot;{" "}
                    {formatRelativeDate(app.created_at)}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </Link>
          ))}
        </div>
      )}
    </div>
  );
}
