import { Badge } from "@/components/ui/badge";
import { MatchDot } from "@/components/shared/match-dot";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Plane } from "@/icons";
import { statusColor, statusLabel } from "@/theme/tokens";
import { formatDate } from "@/lib/utils";
import type { Application } from "@/types/application";

interface ApplicationTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  loading: boolean;
}

function CompanyLogo({ name }: { name: string }) {
  const code = name
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded bg-bg-deep">
      <span className="font-mono text-[8px] font-bold text-pri">{code}</span>
    </div>
  );
}

export function ApplicationTable({ applications, onRowClick, loading }: ApplicationTableProps) {
  if (loading) {
    return <SkeletonTable rows={6} />;
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={<Plane size={40} />}
        message="No applications yet. Start applying from Job Radar."
      />
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-subtle bg-bg-inset">
            <th className="px-4 py-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t-400">
              Company
            </th>
            <th className="px-4 py-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t-400">
              Position
            </th>
            <th className="w-[80px] px-4 py-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t-400">
              ATS
            </th>
            <th className="w-[100px] px-4 py-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t-400">
              Match
            </th>
            <th className="w-[80px] px-4 py-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t-400">
              Status
            </th>
            <th className="w-[80px] px-4 py-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t-400">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr
              key={app.id}
              onClick={() => onRowClick(app)}
              className="cursor-pointer border-b border-border-subtle transition-colors hover:bg-bg-inset"
            >
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <CompanyLogo name={app.job?.company ?? "?"} />
                  <span className="font-mono text-[12px] font-semibold text-t-900">
                    {app.job?.company ?? "Unknown"}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <span className="font-sans text-[13px] text-t-700">
                  {app.job?.title ?? "Untitled"}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span className="font-mono text-[10px] text-t-400">
                  {app.job?.source ?? "-"}
                </span>
              </td>
              <td className="px-4 py-2.5">
                {app.job?.match_score != null ? (
                  <MatchDot score={app.job.match_score} size="sm" />
                ) : (
                  <span className="font-mono text-[10px] text-t-400">-</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <Badge color={statusColor(app.status)}>
                  {statusLabel(app.status)}
                </Badge>
              </td>
              <td className="px-4 py-2.5">
                <span className="font-mono text-[10px] text-t-400">
                  {app.applied_at ? formatDate(app.applied_at) : formatDate(app.created_at)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
