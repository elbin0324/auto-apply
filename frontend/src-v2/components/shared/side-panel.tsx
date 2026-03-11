import { useEffect } from "react";
import type { Job, MatchBreakdown } from "@/types/job";
import type { Application } from "@/types/application";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Check } from "@/icons";
import { matchScoreColor, matchScoreLabel, statusColor, statusLabel } from "@/theme/tokens";
import {
  formatSalaryRange,
  formatSalaryFull,
  formatLocationType,
  formatExperienceLevel,
  formatEmploymentType,
} from "@/lib/utils";

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

function SectionDivider() {
  return <div className="border-t border-border-subtle" />;
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
  const scoreLbl = score != null ? matchScoreLabel(score) : undefined;
  const isPendingReview = application?.status === "pending_review";
  const isNewJob = !application;
  const ai = job.ai_enrichment;

  // Quick facts meta tags
  const metaTags = [
    job.location,
    formatLocationType(job.location_type),
    formatExperienceLevel(job.experience_level),
    formatEmploymentType(job.employment_type),
    formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency, ai?.salary),
  ].filter(Boolean);

  // Salary detail (from AI enrichment, more precise)
  const salaryDetail = ai?.salary
    ? formatSalaryFull(ai.salary.min_value, ai.salary.max_value, ai.salary.currency, ai.salary.unit_text)
    : "";
  const benefits = ai?.benefits?.filter(Boolean) ?? [];

  // Skills / keywords
  const skills = ai?.skills?.filter(Boolean) ?? [];
  const keywords = ai?.keywords?.filter(Boolean) ?? [];
  const displaySkills = skills.length > 0 ? skills.slice(0, 10) : keywords.slice(0, 10);

  // Match breakdown: prefer structured fields, fall back to legacy
  const summary = matchBreakdown?.summary ?? matchBreakdown?.reasoning;
  const strengths = matchBreakdown?.strengths ??
    (matchBreakdown?.matched_skills?.length ? matchBreakdown.matched_skills : null);
  const concerns = matchBreakdown?.concerns ??
    (matchBreakdown?.missing_skills?.length ? matchBreakdown.missing_skills : null);
  const keyMatches = matchBreakdown?.key_matches ??
    (matchBreakdown?.matched_skills?.length ? matchBreakdown.matched_skills : null);
  const keyGaps = matchBreakdown?.key_gaps ??
    (matchBreakdown?.missing_skills?.length ? matchBreakdown.missing_skills : null);

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

          {/* Quick facts */}
          {metaTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {metaTags.map((tag) => (
                <MetaTag key={tag}>{tag}</MetaTag>
              ))}
            </div>
          )}

          {/* Salary detail + benefits */}
          {(salaryDetail || benefits.length > 0) && (
            <>
              <SectionDivider />
              <div>
                <SectionHeader>Compensation</SectionHeader>
                {salaryDetail && (
                  <p className="font-sans text-[14px] font-semibold text-t-900">{salaryDetail}</p>
                )}
                {benefits.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {benefits.map((b) => (
                      <Badge key={b} color="ok">{b}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Job details (visa, hours, education, office days) */}
          {(ai?.visa_sponsorship != null ||
            ai?.working_hours != null ||
            (ai?.education_level && ai.education_level.length > 0) ||
            ai?.work_arrangement_office_days != null) && (
            <>
              <SectionDivider />
              <div>
                <SectionHeader>Details</SectionHeader>
                <div className="space-y-1.5">
                  {ai?.visa_sponsorship != null && (
                    <DetailRow
                      label="Visa Sponsorship"
                      value={ai.visa_sponsorship ? "Yes" : "No"}
                    />
                  )}
                  {ai?.working_hours != null && (
                    <DetailRow label="Working Hours" value={`${ai.working_hours} hrs/week`} />
                  )}
                  {ai?.education_level && ai.education_level.length > 0 && (
                    <DetailRow label="Education" value={ai.education_level.join(", ")} />
                  )}
                  {ai?.work_arrangement_office_days != null && (
                    <DetailRow
                      label="Office Days"
                      value={`${ai.work_arrangement_office_days} days/week`}
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Requirements summary */}
          {ai?.requirements_summary && (
            <>
              <SectionDivider />
              <div>
                <SectionHeader>Requirements</SectionHeader>
                <p className="font-sans text-[13px] leading-[1.7] text-t-700">
                  {ai.requirements_summary}
                </p>
              </div>
            </>
          )}

          {/* Core responsibilities */}
          {ai?.core_responsibilities && (
            <>
              <SectionDivider />
              <div>
                <SectionHeader>Responsibilities</SectionHeader>
                <p className="font-sans text-[13px] leading-[1.7] text-t-700">
                  {ai.core_responsibilities}
                </p>
              </div>
            </>
          )}

          {/* Skills / Keywords */}
          {displaySkills.length > 0 && (
            <>
              <SectionDivider />
              <div>
                <SectionHeader>{skills.length > 0 ? "Skills" : "Keywords"}</SectionHeader>
                <div className="flex flex-wrap gap-1.5">
                  {displaySkills.map((s) => (
                    <Badge key={s} color="pri">{s}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Match score */}
          {score != null && scoreColor && (
            <>
              <SectionDivider />
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
                    {scoreLbl}
                  </p>
                  <p className="font-mono text-[10px] text-t-400">/100</p>
                </div>
              </div>
            </>
          )}

          {/* Summary */}
          {summary && (
            <div>
              <SectionHeader>Summary</SectionHeader>
              <p className="font-sans text-[13px] leading-[1.7] text-t-700">
                {summary}
              </p>
            </div>
          )}

          {/* Strengths */}
          {strengths && strengths.length > 0 && (
            <div>
              <SectionHeader color="var(--color-ok-dim)">Strengths</SectionHeader>
              <ul className="space-y-1.5">
                {strengths.map((skill) => (
                  <li key={skill} className="flex items-start gap-2 text-[12px] text-t-700">
                    <Check size={14} color="var(--color-ok)" className="mt-0.5 shrink-0" />
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {concerns && concerns.length > 0 && (
            <div>
              <SectionHeader color="var(--color-warn-dim)">Concerns</SectionHeader>
              <ul className="space-y-1.5">
                {concerns.map((skill) => (
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
          {(keyMatches?.length || keyGaps?.length) && (
            <div className="grid grid-cols-2 gap-4">
              {keyMatches && keyMatches.length > 0 && (
                <div>
                  <SectionHeader>Key Matches</SectionHeader>
                  <ul className="space-y-1">
                    {keyMatches.slice(0, 5).map((s) => (
                      <li key={s} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-ok" />
                        <span className="font-mono text-[10px] text-t-500">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {keyGaps && keyGaps.length > 0 && (
                <div>
                  <SectionHeader>Key Gaps</SectionHeader>
                  <ul className="space-y-1">
                    {keyGaps.slice(0, 5).map((s) => (
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] text-t-400">{label}</span>
      <span className="font-mono text-[11px] text-t-700">{value}</span>
    </div>
  );
}
