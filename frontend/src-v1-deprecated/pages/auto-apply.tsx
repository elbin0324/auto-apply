import { useAutoApplyConfig } from "@/hooks/use-auto-apply-status";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageEnter } from "@/hooks/use-page-enter";
import { ControlPanel } from "@/components/auto-apply/control-panel";
import { ConfigForm } from "@/components/auto-apply/config-form";

export default function AutoApplyPage() {
  const pageRef = usePageEnter();
  const { data: config, isLoading } = useAutoApplyConfig();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 page-enter">
        <div className="rounded-xl border border-border-subtle bg-bg-card p-6 text-center space-y-4">
          <Skeleton className="mx-auto h-6 w-40" />
          <Skeleton className="mx-auto h-4 w-64" />
          <Skeleton className="mx-auto h-10 w-48" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border-subtle bg-bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={pageRef} className="mx-auto max-w-3xl space-y-6">
      <ControlPanel />
      {config && <ConfigForm config={config} />}
    </div>
  );
}
