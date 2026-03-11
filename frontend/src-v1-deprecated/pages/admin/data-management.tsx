import { useState } from "react";
import { Briefcase, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminOverview, useWipeJobs } from "@/hooks/use-admin";
import type { WipeResult } from "@/types/admin";

function ResultBanner({ result, label }: { result: WipeResult; label: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-emerald-400/5 px-4 py-3">
      <p className="text-sm text-emerald-400">
        {result.action === "hard_delete" ? "Hard deleted" : "Soft deleted"}{" "}
        <span className="font-mono font-bold">{result.affected}</span> {label}.
      </p>
    </div>
  );
}

export default function AdminDataManagementPage() {
  const { data: overview } = useAdminOverview();
  const wipeJobs = useWipeJobs();

  const [jobsResult, setJobsResult] = useState<WipeResult | null>(null);

  async function handleWipeJobs(hard: boolean) {
    const action = hard ? "HARD DELETE" : "soft delete";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ALL jobs?\n\n` +
        (hard
          ? "This will permanently remove all job records. Match scores will cascade-delete. Applications will have job_id set to NULL."
          : "This will set is_active=false on all jobs."),
    );
    if (!confirmed) return;

    const result = await wipeJobs.mutateAsync({ hard });
    setJobsResult(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Data Management
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Wipe jobs from the database
        </p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-400">
            Destructive operations
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Hard deletes are permanent. Soft deletes set is_active=false and can
            be reversed with a database update. Always prefer soft delete unless
            you need to reclaim storage.
          </p>
        </div>
      </div>

      {/* Jobs section */}
      <div className="rounded-xl border border-border-subtle bg-bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent-blue/10 p-2">
            <Briefcase className="h-5 w-5 text-accent-blue" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Jobs
            </h2>
            <p className="text-sm text-text-muted">
              {overview
                ? `${overview.active_job_count} active / ${overview.job_count} total`
                : "Loading..."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => handleWipeJobs(false)}
            disabled={wipeJobs.isPending}
          >
            {wipeJobs.isPending && !wipeJobs.variables?.hard ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Soft Delete All
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleWipeJobs(true)}
            disabled={wipeJobs.isPending}
          >
            {wipeJobs.isPending && wipeJobs.variables?.hard ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Hard Delete All
          </Button>
        </div>

        {jobsResult && <ResultBanner result={jobsResult} label="jobs" />}
      </div>
    </div>
  );
}
