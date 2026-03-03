import {
  Users,
  Briefcase,
  Building2,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAdminOverview } from "@/hooks/use-admin";

const statCards = [
  { label: "Users", key: "user_count" as const, icon: Users, color: "text-accent-purple", bg: "bg-accent-purple/10" },
  { label: "Active Jobs", key: "active_job_count" as const, icon: Briefcase, color: "text-accent-blue", bg: "bg-accent-blue/10" },
  { label: "Active Companies", key: "active_company_count" as const, icon: Building2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { label: "Applications", key: "total_applications" as const, icon: FileText, color: "text-amber-400", bg: "bg-amber-400/10" },
] as const;

function queueBadgeVariant(depth: number) {
  if (depth === 0) return "outline" as const;
  if (depth <= 10) return "secondary" as const;
  return "destructive" as const;
}

export default function AdminOverviewPage() {
  const { data, isLoading } = useAdminOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Admin Overview</h1>
        <p className="mt-1 text-sm text-text-secondary">
          System-wide statistics — auto-refreshes every 30s
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, key, icon: Icon, color, bg }) => (
          <div
            key={key}
            className="rounded-xl border border-border-subtle bg-bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{label}</span>
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <span className={`text-2xl font-bold font-mono ${color}`}>
                  {data?.[key] ?? 0}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Queue depths */}
        <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Queue Depths
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Apply Tasks", value: data?.queue_depths.apply ?? 0 },
                { label: "Crawl Queue", value: data?.queue_depths.crawl ?? 0 },
                { label: "Score Jobs", value: data?.queue_depths.score_jobs ?? 0 },
                { label: "Score Users", value: data?.queue_depths.score_users ?? 0 },
                { label: "Enrich Jobs", value: data?.queue_depths.enrich ?? 0 },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-border-subtle px-4 py-2"
                >
                  <span className="text-sm text-text-secondary">{label}</span>
                  <Badge variant={queueBadgeVariant(value)}>
                    {value}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Application breakdown */}
        <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Applications by Status
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : data?.application_counts ? (
            <div className="space-y-3">
              {Object.entries(data.application_counts)
                .sort(([, a], [, b]) => b - a)
                .map(([appStatus, count]) => (
                  <div
                    key={appStatus}
                    className="flex items-center justify-between rounded-lg border border-border-subtle px-4 py-2"
                  >
                    <span className="text-sm text-text-secondary capitalize">
                      {appStatus.replace("_", " ")}
                    </span>
                    <span className="font-mono text-sm font-medium text-text-primary">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No applications yet</p>
          )}
        </div>
      </div>

      {/* Totals breakdown */}
      <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Totals (Active / Total)
        </h2>
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="text-center">
              <p className="text-sm text-text-secondary">Jobs</p>
              <p className="text-lg font-mono font-medium text-text-primary">
                {data?.active_job_count ?? 0} / {data?.job_count ?? 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-text-secondary">Companies</p>
              <p className="text-lg font-mono font-medium text-text-primary">
                {data?.active_company_count ?? 0} / {data?.company_count ?? 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-text-secondary">Users</p>
              <p className="text-lg font-mono font-medium text-text-primary">
                {data?.user_count ?? 0}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
