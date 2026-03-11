import { matchScoreColor, matchScoreLabel } from "@/theme/tokens";

interface MatchDotProps {
  score: number;
  size?: "sm" | "md";
}

export function MatchDot({ score, size = "md" }: MatchDotProps) {
  const color = matchScoreColor(score);
  const label = matchScoreLabel(score);
  const dotSize = size === "sm" ? 8 : 10;
  const scoreFont = size === "sm" ? "text-[10px]" : "text-[11px]";
  const width = size === "sm" ? "w-[100px]" : "w-[120px]";

  return (
    <div className={`flex items-center gap-2 ${width}`}>
      <span
        className="shrink-0 rounded-full"
        style={{
          width: dotSize,
          height: dotSize,
          background: color,
          boxShadow: `0 0 ${dotSize}px ${color}55`,
        }}
      />
      <span className={`font-mono ${scoreFont} font-bold text-t-900`}>{score}</span>
      <span className="font-mono text-[9px] uppercase tracking-[0.03em] text-t-400">
        {label}
      </span>
    </div>
  );
}
