import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MatchScoreBadgeProps {
  score: number | null | undefined;
  className?: string;
}

function matchColor(score: number | null | undefined) {
  if (score == null) return "text-text-muted bg-text-muted/10";
  if (score >= 80) return "text-accent-green bg-accent-green/15";
  if (score >= 60) return "text-accent-blue bg-accent-blue/15";
  return "text-text-muted bg-text-muted/10";
}

export function MatchScoreBadge({ score, className }: MatchScoreBadgeProps) {
  if (score == null) return null;

  return (
    <Badge
      variant="secondary"
      className={cn("font-mono", matchColor(score), className)}
    >
      {score}%
    </Badge>
  );
}
