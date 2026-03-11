import { JRow } from "@/components/shared/job-row";
import type { Application } from "@/types/application";

const EMPTY_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  queued: {
    title: "No applications in queue",
    subtitle: "Jobs matched to your profile will queue up here",
  },
  applied: {
    title: "No landed applications yet",
    subtitle: "Successfully submitted applications appear here",
  },
  failed: {
    title: "No failed applications",
    subtitle: "Applications that encountered errors will show here",
  },
  in_progress: {
    title: "No active applications",
    subtitle: "Applications currently being processed appear here",
  },
};

interface ApplicationListProps {
  applications: Application[];
  status: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectApplication: (application: Application) => void;
}

export function ApplicationList({
  applications,
  status,
  page,
  totalPages,
  onPageChange,
  onSelectApplication,
}: ApplicationListProps) {
  if (applications.length === 0) {
    const empty = EMPTY_MESSAGES[status] ?? {
      title: "No applications",
      subtitle: "Nothing to show for this status",
    };
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="font-mono text-[12px] text-t-400">{empty.title}</p>
        <p className="mt-1 font-mono text-[10px] text-t-300">{empty.subtitle}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-border-subtle">
        {applications.map((app) => {
          const job = app.job;
          const rowJob = {
            id: app.id,
            company: job?.company ?? "Unknown",
            company_logo_url: job?.company_logo_url,
            title: job?.title ?? "Application",
            location: job?.location ?? undefined,
            salary_min: job?.salary_min ?? undefined,
            salary_max: job?.salary_max ?? undefined,
            match_score: job?.match_score ?? undefined,
            application_status: app.status,
          };
          return (
            <JRow
              key={app.id}
              job={rowJob}
              onClick={() => onSelectApplication(app)}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2 border-t border-border-subtle py-3">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="cursor-pointer rounded border border-border-main bg-bg-card px-3 py-1.5 font-mono text-[10px] font-semibold text-t-500 transition-colors hover:bg-bg-inset disabled:cursor-not-allowed disabled:opacity-40"
      >
        PREV
      </button>
      <span className="font-mono text-[10px] text-t-400">
        {page} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="cursor-pointer rounded border border-border-main bg-bg-card px-3 py-1.5 font-mono text-[10px] font-semibold text-t-500 transition-colors hover:bg-bg-inset disabled:cursor-not-allowed disabled:opacity-40"
      >
        NEXT
      </button>
    </div>
  );
}
