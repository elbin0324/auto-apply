import { useTheme } from "@/theme/context";
import { matchScoreColor, matchScoreLabel } from "@/theme/tokens";

interface MatchSignalProps {
  score: number;
  showNum?: boolean;
}

export function MatchSignal({ score, showNum = true }: MatchSignalProps) {
  const { theme } = useTheme();
  const color = matchScoreColor(score);
  const label = matchScoreLabel(score);
  const filled = score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score >= 45 ? 2 : 1;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        minWidth: showNum ? 60 : 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, marginTop: -2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: 3.5,
              height: 4 + i * 3,
              borderRadius: 1,
              background: i <= filled ? color : theme.bg.muted,
            }}
          />
        ))}
      </div>
      {showNum && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 700,
            color: theme.text.t900,
            lineHeight: 1,
          }}
        >
          {score}
        </span>
      )}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          color: color,
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </div>
  );
}
