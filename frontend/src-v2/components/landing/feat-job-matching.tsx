import { useRef } from "react";
import { useInView } from "motion/react";

const JOBS = [
  { logo: "S", logoBg: "linear-gradient(135deg,#1DB954,#169c46)", role: "Product Designer", info: "Spotify · Remote · $130k–$165k", score: 94, color: "var(--accent-green)", label: "Strong Match" },
  { logo: "S", logoBg: "linear-gradient(135deg,#635BFF,#A259FF)", role: "Frontend Engineer", info: "Stripe · New York · $140k–$180k", score: 87, color: "var(--accent-2)", label: "Good Match" },
];

export function FeatJobMatching() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div ref={ref} className="flex flex-col gap-2 p-4">
      {/* Scan line */}
      <div
        className="pointer-events-none absolute left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(46,196,182,.3), transparent)", animation: "scanLine 3s linear infinite" }}
      />
      {JOBS.map((j, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl border px-4 py-3 transition-colors duration-200 hover:bg-white/3"
          style={{ background: "rgba(255,255,255,.015)", borderColor: "var(--tw-10)" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] font-mono text-[0.7rem] font-extrabold text-white" style={{ background: j.logoBg }}>{j.logo}</div>
            <div>
              <div className="font-display text-[0.85rem] font-semibold" style={{ color: "var(--tw-90)" }}>{j.role}</div>
              <div className="font-display text-[0.72rem]" style={{ color: "var(--tw-20)" }}>{j.info}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1 w-[60px] overflow-hidden rounded-sm" style={{ background: "rgba(255,255,255,.04)" }}>
              <div
                className="h-full rounded-sm transition-all duration-[1200ms]"
                style={{
                  width: inView ? `${j.score}%` : "0%",
                  background: j.color,
                  transitionDelay: `${i * 200}ms`,
                  transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            </div>
            <span className="font-mono text-[0.8rem] font-medium" style={{ color: j.color }}>{j.score}%</span>
            <span
              className="whitespace-nowrap rounded-full px-2.5 py-[3px] font-mono text-[0.65rem] font-semibold"
              style={{ background: `color-mix(in srgb, ${j.color} 10%, transparent)`, color: j.color }}
            >
              {j.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
