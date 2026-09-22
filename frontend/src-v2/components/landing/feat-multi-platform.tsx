const PLATFORMS = [
  { name: "LinkedIn", width: "92%", color: "var(--accent-2)", count: 68 },
  { name: "Indeed", width: "78%", color: "var(--accent-1)", count: 52 },
  { name: "Greenhouse", width: "55%", color: "var(--accent-green)", count: 31 },
  { name: "Workday", width: "42%", color: "var(--accent-3)", count: 24 },
];

export function FeatMultiPlatform() {
  return (
    <div className="flex flex-col gap-3 p-5">
      {PLATFORMS.map((p) => (
        <div key={p.name} className="flex items-center gap-3.5 rounded-xl border px-4 py-3" style={{ background: "rgba(255,255,255,.015)", borderColor: "var(--tw-10)" }}>
          <span className="w-[100px] font-display text-[0.82rem] font-semibold" style={{ color: "var(--tw-90)" }}>{p.name}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-sm" style={{ background: "rgba(255,255,255,.03)" }}>
            <div className="h-full rounded-sm" style={{ width: p.width, background: p.color }} />
          </div>
          <span className="w-10 text-right font-mono text-[0.72rem]" style={{ color: "var(--tw-40)" }}>{p.count}</span>
          <div className="flex h-5 w-5 items-center justify-center rounded-full font-mono text-[0.6rem]" style={{ background: "rgba(52,211,153,.1)", color: "var(--accent-green)" }}>✓</div>
        </div>
      ))}
    </div>
  );
}
