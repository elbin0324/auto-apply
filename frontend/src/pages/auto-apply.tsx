import { Loader2 } from "lucide-react";
import { useAutoApplyConfig } from "@/hooks/use-auto-apply-status";
import { ControlPanel } from "@/components/auto-apply/control-panel";
import { ConfigForm } from "@/components/auto-apply/config-form";

export default function AutoApplyPage() {
  const { data: config, isLoading } = useAutoApplyConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ControlPanel />
      {config && <ConfigForm config={config} />}
    </div>
  );
}
