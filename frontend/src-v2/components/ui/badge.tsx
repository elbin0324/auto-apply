type BadgeColor = "pri" | "ok" | "warn" | "fail" | "muted";

interface BadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
}

const COLOR_STYLES: Record<BadgeColor, { bg: string; text: string; border: string }> = {
  pri: { bg: "var(--pri-bg)", text: "var(--color-pri-dim)", border: "var(--pri-border)" },
  ok: { bg: "var(--ok-bg)", text: "var(--color-ok-dim)", border: "var(--ok-border)" },
  warn: { bg: "var(--warn-bg)", text: "var(--color-warn-dim)", border: "var(--warn-border)" },
  fail: { bg: "var(--fail-bg)", text: "var(--color-fail-dim)", border: "var(--fail-border)" },
  muted: { bg: "var(--muted-bg)", text: "var(--color-muted)", border: "var(--muted-border)" },
};

export function Badge({ color = "muted", children }: BadgeProps) {
  const s = COLOR_STYLES[color];
  return (
    <span
      className="inline-block whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-[0.04em]"
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        borderRadius: 4,
        padding: "3px 10px",
      }}
    >
      {children}
    </span>
  );
}
