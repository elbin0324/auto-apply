import { useState, useCallback, useMemo } from "react";
import { SkeletonJRow } from "@/components/ui/skeleton";
import { useApplications, useApplicationStats, useQueueStatus } from "@/hooks/use-applications";
import { useReviewActions } from "@/hooks/use-review-actions";
import { InFlightMonitor } from "@/components/queue/in-flight-monitor";
import { TabBar } from "@/components/queue/tab-bar";
import { ReviewList } from "@/components/queue/review-list";
import { ApplicationList } from "@/components/queue/application-list";
import { AnswerPreview } from "@/components/queue/answer-preview";
import { SidePanel } from "@/components/shared/side-panel";
import type { Application } from "@/types/application";

function statusForTab(tab: string): string {
  return tab;
}

export default function QueuePage() {
  const [activeTab, setActiveTab] = useState("pending_review");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [panelApp, setPanelApp] = useState<Application | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const status = statusForTab(activeTab);
  const { data: appData, isLoading: appsLoading } = useApplications({ status, page });
  const { data: stats } = useApplicationStats();
  const { data: queue } = useQueueStatus();
  const { approve, reject, batchAction } = useReviewActions();

  const applications = appData?.applications ?? [];
  const totalPages = appData?.pages ?? 1;

  // Build tab counts from stats + queue
  const counts = useMemo(() => ({
    pending_review: queue?.pending_review_count ?? 0,
    in_progress: queue?.in_progress_count ?? 0,
    queued: queue?.queue_depth ?? 0,
    applied: stats?.applied ?? 0,
    failed: stats?.failed ?? 0,
  }), [queue, stats]);

  // Reset page + selection on tab change
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedIds(new Set());
    setPanelApp(null);
    setShowAnswers(false);
  }, []);

  // Selection handlers for review list
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(applications.map((a) => a.id)));
  }, [applications]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Review actions
  const handleApprove = useCallback(
    (id: string) => {
      approve.mutate(id);
    },
    [approve],
  );

  const handleReject = useCallback(
    (id: string) => {
      reject.mutate(id);
    },
    [reject],
  );

  const handleBatchApprove = useCallback(
    (ids: string[]) => {
      batchAction.mutate({ ids, action: "approve" });
      setSelectedIds(new Set());
    },
    [batchAction],
  );

  const handleBatchReject = useCallback(
    (ids: string[]) => {
      batchAction.mutate({ ids, action: "reject" });
      setSelectedIds(new Set());
    },
    [batchAction],
  );

  // Panel handlers
  const handlePreview = useCallback((application: Application) => {
    setPanelApp(application);
    setShowAnswers(false);
  }, []);

  const handleSelectApplication = useCallback((application: Application) => {
    setPanelApp(application);
    setShowAnswers(false);
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelApp(null);
    setShowAnswers(false);
  }, []);

  const handlePanelApprove = useCallback(
    (appId: string) => {
      approve.mutate(appId);
      setPanelApp(null);
    },
    [approve],
  );

  const handlePanelReject = useCallback(
    (appId: string) => {
      reject.mutate(appId);
      setPanelApp(null);
    },
    [reject],
  );

  const panelJob = panelApp?.job ?? null;
  const isPanelOpen = panelApp !== null;

  return (
    <div className="space-y-4 p-6">
      {/* In-Flight Monitor — only when in-progress applications exist */}
      <InFlightMonitor inProgressCount={queue?.in_progress_count ?? 0} />

      {/* Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={counts}
      />

      {/* Content */}
      <div>
        {appsLoading ? (
          <div className="divide-y divide-border-subtle rounded-xl border border-border-main bg-bg-card">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonJRow key={i} />
            ))}
          </div>
        ) : activeTab === "pending_review" ? (
          <ReviewList
            applications={applications}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onApprove={handleApprove}
            onReject={handleReject}
            onPreview={handlePreview}
            onBatchApprove={handleBatchApprove}
            onBatchReject={handleBatchReject}
          />
        ) : (
          <ApplicationList
            applications={applications}
            status={activeTab}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onSelectApplication={handleSelectApplication}
          />
        )}
      </div>

      {/* Side Panel */}
      <SidePanel
        job={panelJob}
        application={panelApp}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onApprove={panelApp?.status === "pending_review" ? handlePanelApprove : undefined}
        onReject={panelApp?.status === "pending_review" ? handlePanelReject : undefined}
      />

      {/* Answer Preview overlay within SidePanel content area — shown when panel is open */}
      {isPanelOpen && panelApp?.generated_application && (
        <AnswerPreviewOverlay
          application={panelApp}
          showAnswers={showAnswers}
          onToggle={() => setShowAnswers((v) => !v)}
        />
      )}
    </div>
  );
}

interface AnswerPreviewOverlayProps {
  application: Application;
  showAnswers: boolean;
  onToggle: () => void;
}

function AnswerPreviewOverlay({
  application,
  showAnswers,
  onToggle,
}: AnswerPreviewOverlayProps) {
  const gen = application.generated_application;
  if (!gen) return null;

  const isEditable = application.task_mode === "extract_only";

  return (
    <div className="fixed right-[440px] top-0 z-[180] h-full w-[380px] border-l border-border-main bg-bg-card shadow-panel">
      <div className="flex items-center justify-between border-b border-border-subtle bg-bg-inset px-4 py-2.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-t-500">
          Answers
        </span>
        <button
          onClick={onToggle}
          className="cursor-pointer rounded border border-border-main bg-bg-card px-2 py-1 font-mono text-[10px] text-t-500 transition-colors hover:bg-bg-muted"
        >
          {showAnswers ? "Hide" : "Show"}
        </button>
      </div>

      {showAnswers && (
        <div className="h-[calc(100%-44px)] overflow-y-auto px-4 py-4">
          <AnswerPreview
            fields={gen.fields}
            answers={gen.answers}
            editable={isEditable}
          />
        </div>
      )}
    </div>
  );
}
