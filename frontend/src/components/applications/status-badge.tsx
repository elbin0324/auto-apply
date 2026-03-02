import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/types/application";

const statusConfig: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  queued: { label: "Queued", className: "bg-zinc-700 text-zinc-300" },
  pending_review: {
    label: "Pending Review",
    className: "bg-amber-900/50 text-amber-400",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-accent-blue/20 text-accent-blue",
  },
  applied: {
    label: "Applied",
    className: "bg-accent-green/20 text-accent-green",
  },
  failed: { label: "Failed", className: "bg-red-900/50 text-red-400" },
  skipped: { label: "Skipped", className: "bg-zinc-700 text-zinc-400" },
  withdrawn: { label: "Withdrawn", className: "bg-zinc-700 text-zinc-400" },
};

interface StatusBadgeProps {
  status: ApplicationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

export { statusConfig };
