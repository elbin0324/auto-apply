type LedColor = "pri" | "ok" | "warn" | "fail" | "muted";

interface LedProps {
  color?: LedColor;
  size?: number;
}

const COLOR_MAP: Record<LedColor, string> = {
  pri: "var(--color-pri)",
  ok: "var(--color-ok)",
  warn: "var(--color-warn)",
  fail: "var(--color-fail)",
  muted: "var(--color-muted)",
};

export function Led({ color = "pri", size = 6 }: LedProps) {
  const c = COLOR_MAP[color];
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: c,
        boxShadow: `0 0 ${size}px color-mix(in srgb, ${c} 33%, transparent)`,
      }}
    />
  );
}
