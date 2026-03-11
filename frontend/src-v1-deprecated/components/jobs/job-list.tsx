import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "./job-card";
import type { JobResponse } from "@/types/job";

interface JobListProps {
  jobs?: JobResponse[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function JobList({
  jobs,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: JobListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-card px-5 py-4"
          >
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!jobs?.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Briefcase className="h-10 w-10 text-text-muted" />
        <p className="text-sm text-text-secondary">No jobs found</p>
        <p className="text-xs text-text-muted">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 stagger-in">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
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
