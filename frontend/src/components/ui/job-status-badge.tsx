import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface JobStatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending_review: {
    label: "Pending Review",
    className: "text-amber-400 bg-amber-400/15",
  },
  queued: {
    label: "Queued",
    className: "text-accent-blue bg-accent-blue/15",
  },
  in_progress: {
    label: "Applying...",
    className: "text-purple-400 bg-purple-400/15",
  },
  applied: {
    label: "Applied",
    className: "text-accent-green bg-accent-green/15",
  },
  skipped: {
    label: "Skipped",
    className: "text-text-muted bg-text-muted/10 line-through",
  },
  failed: {
    label: "Failed",
    className: "text-red-400 bg-red-400/15",
  },
};

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  if (!status) return null;

  const cfg = statusConfig[status];
  if (!cfg) return null;

  return (
    <Badge
      variant="secondary"
      className={cn("text-xs", cfg.className, className)}
    >
      {cfg.label}
    </Badge>
  );
}
