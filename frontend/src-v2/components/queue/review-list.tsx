import { Button } from "@/components/ui/button";
import { JRow } from "@/components/shared/job-row";
import { EmptyState } from "@/components/shared/empty-state";
import { Check, X } from "@/icons";
import type { Application } from "@/types/application";

interface ReviewListProps {
  applications: Application[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPreview: (application: Application) => void;
  onBatchApprove: (ids: string[]) => void;
  onBatchReject: (ids: string[]) => void;
  isLoading?: boolean;
  approvingId?: string | null;
  rejectingId?: string | null;
  isBatchPending?: boolean;
}

function BatchBar({
  total,
  selectedCount,
  allSelected,
  onToggle,
  onBatchApprove,
  onBatchReject,
  isBatchPending,
}: {
  total: number;
  selectedCount: number;
  allSelected: boolean;
  onToggle: () => void;
  onBatchApprove: () => void;
  onBatchReject: () => void;
  isBatchPending?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border-subtle bg-bg-inset px-4 py-2.5">
      <button
        onClick={onToggle}
        className="cursor-pointer border-none bg-transparent font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-t-500 transition-colors hover:text-t-700"
      >
        {allSelected ? "Deselect" : "Select All"}
      </button>

      {selectedCount > 0 && (
        <>
          <span className="font-mono text-[10px] text-t-400">
            {selectedCount} of {total} selected
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="success"
              onClick={onBatchApprove}
              loading={isBatchPending}
              disabled={isBatchPending}
              className="px-3 py-1.5 text-[10px]"
            >
              <Check size={12} />
              Approve All
            </Button>
            <Button
              variant="danger"
              onClick={onBatchReject}
              loading={isBatchPending}
              disabled={isBatchPending}
              className="px-3 py-1.5 text-[10px]"
            >
              <X size={12} />
              Reject All
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

interface ReviewItemProps {
  application: Application;
  isSelected: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onPreview: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

function ReviewItem({
  application,
  isSelected,
  onToggle,
  onApprove,
  onReject,
  onPreview,
  isApproving,
  isRejecting,
}: ReviewItemProps) {
  const job = application.job;

  const rowJob = {
    id: application.id,
    company: job?.company ?? "Unknown",
    company_logo_url: job?.company_logo_url,
    title: job?.title ?? "Application",
    location: job?.location ?? undefined,
    salary_min: job?.salary_min ?? undefined,
    salary_max: job?.salary_max ?? undefined,
    match_score: job?.match_score ?? undefined,
    application_status: application.status,
  };

  return (
    <div className="relative">
      {/* Selection checkbox area */}
      <div className="absolute left-2 top-1/2 z-10 -translate-y-1/2">
        <label className="flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="h-3.5 w-3.5 cursor-pointer accent-[var(--color-pri)]"
          />
        </label>
      </div>

      <div className="pl-7">
        <JRow
          job={rowJob}
          onClick={onPreview}
          actions={
            <div className="flex gap-2">
              <Button
                variant="success"
                onClick={onApprove}
                loading={isApproving}
                disabled={isApproving || isRejecting}
                className="px-3 py-1 text-[10px]"
              >
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={onReject}
                loading={isRejecting}
                disabled={isApproving || isRejecting}
                className="px-3 py-1 text-[10px]"
              >
                Reject
              </Button>
              <Button
                variant="ghost"
                onClick={onPreview}
                className="px-3 py-1 text-[10px]"
              >
                Preview
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}

export function ReviewList({
  applications,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onApprove,
  onReject,
  onPreview,
  onBatchApprove,
  onBatchReject,
  approvingId,
  rejectingId,
  isBatchPending,
}: ReviewListProps) {
  const allSelected = applications.length > 0 && selectedIds.size === applications.length;
  const selectedCount = selectedIds.size;

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={<Check size={40} />}
        message="All caught up! No applications waiting for review."
      />
    );
  }

  return (
    <div>
      <BatchBar
        total={applications.length}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onToggle={allSelected ? onDeselectAll : onSelectAll}
        onBatchApprove={() => onBatchApprove(Array.from(selectedIds))}
        onBatchReject={() => onBatchReject(Array.from(selectedIds))}
        isBatchPending={isBatchPending}
      />

      <div className="divide-y divide-border-subtle">
        {applications.map((app) => (
          <ReviewItem
            key={app.id}
            application={app}
            isSelected={selectedIds.has(app.id)}
            onToggle={() => onToggleSelect(app.id)}
            onApprove={() => onApprove(app.id)}
            onReject={() => onReject(app.id)}
            onPreview={() => onPreview(app)}
            isApproving={approvingId === app.id}
            isRejecting={rejectingId === app.id}
          />
        ))}
      </div>
    </div>
  );
}
