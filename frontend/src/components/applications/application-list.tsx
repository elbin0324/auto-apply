import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./status-badge";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import type { ApplicationDetail } from "@/types/application";

interface ApplicationListProps {
  applications?: ApplicationDetail[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ApplicationList({
  applications,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: ApplicationListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-card">
        <div className="divide-y divide-border-subtle">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="ml-auto h-5 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!applications?.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <FileText className="h-10 w-10 text-text-muted" />
        <p className="text-sm text-text-secondary">No applications found</p>
        <p className="text-xs text-text-muted">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border-subtle bg-bg-card">
        {/* Header */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_140px_120px_100px] gap-4 border-b border-border-subtle px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
          <span>Job</span>
          <span>Status</span>
          <span>Applied</span>
          <span>Created</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border-subtle">
          {applications.map((app) => (
            <Link
              key={app.id}
              to="/applications/$applicationId"
              params={{ applicationId: app.id }}
              className="flex flex-col sm:grid sm:grid-cols-[1fr_140px_120px_100px] gap-2 sm:gap-4 sm:items-center px-5 py-4 hover:bg-bg-card-hover transition-colors duration-200"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {app.job?.title ?? "Unknown Position"}
                </p>
                <p className="truncate text-xs text-text-muted">
                  {app.job?.company ?? "Unknown Company"}
                  {app.job?.location && ` · ${app.job.location}`}
                </p>
              </div>
              <div>
                <StatusBadge status={app.status} />
              </div>
              <span className="text-xs text-text-secondary">
                {app.applied_at ? formatDate(app.applied_at) : "—"}
              </span>
              <span className="text-xs text-text-muted">
                {formatRelativeDate(app.created_at)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
