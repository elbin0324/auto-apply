import { useEffect } from "react";
import type { Job, MatchBreakdown } from "@/types/job";
import type { Application } from "@/types/application";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Check } from "@/icons";
import { matchScoreColor, matchScoreLabel, statusColor, statusLabel } from "@/theme/tokens";

interface SidePanelProps {
  job: Job | null;
  application?: Application | null;
  matchBreakdown?: MatchBreakdown | null;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (jobId: string) => void;
  onApprove?: (appId: string) => void;
  onReject?: (appId: string) => void;
}

function MetaTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-bg-inset px-2 py-1 font-mono text-[10px] text-t-400">
      {children}
    </span>
  );
}

function SectionHeader({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <h4
      className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
      style={{ color: color ?? "var(--color-t-500)" }}
    >
      {children}
    </h4>
  );
}

export function SidePanel({
  job,
  application,
  matchBreakdown,
  isOpen,
  onClose,
  onApply,
  onApprove,
  onReject,
}: SidePanelProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !job) return null;

  const score = job.match_score;
  const scoreColor = score != null ? matchScoreColor(score) : undefined;
  const scoreLabel = score != null ? matchScoreLabel(score) : undefined;
  const isPendingReview = application?.status === "pending_review";
  const isNewJob = !application;

  const metaTags = [
    job.location,
    job.location_type,
    job.employment_type,
    job.experience_level,
    job.salary_min || job.salary_max
      ? `$${job.salary_min ?? "?"}k-$${job.salary_max ?? "?"}k`
      : null,
  ].filter(Boolean);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[150] bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-[200] flex h-full w-full flex-col border-l border-border-main bg-bg-card shadow-panel md:w-[440px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-bg-inset px-5 py-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-t-500">
            {application ? "Application Detail" : "Job Detail"}
          </span>
          <button
            onClick={onClose}
            className="cursor-pointer rounded p-1 text-t-400 transition-colors hover:bg-bg-muted hover:text-t-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Company block */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bg-deep">
              <span className="font-mono text-[11px] font-bold text-pri">
                {(job.company ?? "").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-sans text-[16px] font-bold text-t-900">{job.title}</h2>
              <p className="font-mono text-[12px] text-t-400">{job.company}</p>
            </div>
          </div>

          {/* Status */}
          {application && (
            <Badge color={statusColor(application.status)}>
              {statusLabel(application.status)}
            </Badge>
          )}

          {/* Meta tags */}
          {metaTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {metaTags.map((tag) => (
                <MetaTag key={tag}>{tag}</MetaTag>
              ))}
            </div>
          )}

          {/* Match score */}
          {score != null && scoreColor && (
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full font-mono text-[14px] font-bold"
                style={{
                  border: `2px solid ${scoreColor}`,
                  color: scoreColor,
                }}
              >
                {score}
              </div>
              <div>
                <p className="font-mono text-[11px] font-semibold" style={{ color: scoreColor }}>
                  {scoreLabel}
                </p>
                <p className="font-mono text-[10px] text-t-400">/100</p>
              </div>
            </div>
          )}

          {/* Summary */}
          {matchBreakdown?.reasoning && (
            <div>
              <SectionHeader>Summary</SectionHeader>
              <p className="font-sans text-[13px] leading-[1.7] text-t-700">
                {matchBreakdown.reasoning}
              </p>
            </div>
          )}

          {/* Strengths */}
          {matchBreakdown?.matched_skills && matchBreakdown.matched_skills.length > 0 && (
            <div>
              <SectionHeader color="var(--color-ok-dim)">Strengths</SectionHeader>
              <ul className="space-y-1.5">
                {matchBreakdown.matched_skills.map((skill) => (
                  <li key={skill} className="flex items-start gap-2 text-[12px] text-t-700">
                    <Check size={14} color="var(--color-ok)" className="mt-0.5 shrink-0" />
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {matchBreakdown?.missing_skills && matchBreakdown.missing_skills.length > 0 && (
            <div>
              <SectionHeader color="var(--color-warn-dim)">Concerns</SectionHeader>
              <ul className="space-y-1.5">
                {matchBreakdown.missing_skills.map((skill) => (
                  <li key={skill} className="flex items-start gap-2 text-[12px] text-t-700">
                    <span
                      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--color-warn)" }}
                    />
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Matches & Key Gaps */}
          {matchBreakdown && (
            <div className="grid grid-cols-2 gap-4">
              {matchBreakdown.matched_skills && matchBreakdown.matched_skills.length > 0 && (
                <div>
                  <SectionHeader>Key Matches</SectionHeader>
                  <ul className="space-y-1">
                    {matchBreakdown.matched_skills.slice(0, 5).map((s) => (
                      <li key={s} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-ok" />
                        <span className="font-mono text-[10px] text-t-500">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {matchBreakdown.missing_skills && matchBreakdown.missing_skills.length > 0 && (
                <div>
                  <SectionHeader>Key Gaps</SectionHeader>
                  <ul className="space-y-1">
                    {matchBreakdown.missing_skills.slice(0, 5).map((s) => (
                      <li key={s} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-warn" />
                        <span className="font-mono text-[10px] text-t-500">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {(isNewJob || isPendingReview) && (
          <div className="mt-auto flex gap-3 border-t border-border-subtle px-5 py-4">
            {isNewJob && onApply && (
              <Button variant="primary" onClick={() => onApply(job.id)} className="flex-1">
                Apply
              </Button>
            )}
            {isPendingReview && application && onApprove && onReject && (
              <>
                <Button variant="success" onClick={() => onApprove(application.id)} className="flex-1">
                  Approve
                </Button>
                <Button variant="danger" onClick={() => onReject(application.id)} className="flex-1">
                  Reject
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
