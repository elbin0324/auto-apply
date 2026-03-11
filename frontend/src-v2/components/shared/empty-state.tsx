import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-3 text-t-400 opacity-50">{icon}</div>
      <p className="mb-4 font-mono text-[12px] text-t-400">{message}</p>
      {actionLabel && onAction && (
        <Button variant="ghost" onClick={onAction} className="text-[11px]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
