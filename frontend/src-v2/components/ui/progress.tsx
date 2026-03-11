interface ProgressProps {
  pct: number;
  color?: string;
  height?: number;
}

export function Progress({ pct, color = "var(--color-pri)", height = 5 }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-bg-muted"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}
