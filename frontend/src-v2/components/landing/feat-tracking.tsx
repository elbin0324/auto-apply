import { useState } from "react";

type Tab = "overview" | "apps" | "interviews" | "analytics";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "apps", label: "Applications" },
  { key: "interviews", label: "Interviews" },
  { key: "analytics", label: "Analytics" },
];

const BAR_HEIGHTS = [35, 52, 44, 68, 75, 60, 88, 72, 95, 82, 90, 78];
const BAR_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

const APP_LIST = [
  { ico: "G", bg: "linear-gradient(135deg,#4285F4,#34A853)", role: "Google – SWE Intern", sub: "Applied 2 days ago", tag: "Sent", tagBg: "rgba(91,141,255,.1)", tagColor: "var(--accent-2)" },
  { ico: "S", bg: "linear-gradient(135deg,#635BFF,#A259FF)", role: "Stripe – Product Designer", sub: "Applied 3 days ago", tag: "Interview", tagBg: "rgba(91,141,255,.1)", tagColor: "var(--accent-2)" },
  { ico: "S", bg: "linear-gradient(135deg,#1DB954,#169c46)", role: "Spotify – Product Designer", sub: "Applied 5 days ago", tag: "Offer", tagBg: "rgba(251,191,36,.1)", tagColor: "var(--accent-amber)" },
];

const INTERVIEW_LIST = [
  { ico: "S", bg: "linear-gradient(135deg,#635BFF,#A259FF)", role: "Stripe – Round 2 (System Design)", sub: "Tomorrow · 10:00 AM EST", date: "Mar 4" },
  { ico: "F", bg: "linear-gradient(135deg,#0ACF83,#A259FF)", role: "Figma – Portfolio Review", sub: "Wednesday · 2:00 PM EST", date: "Mar 5" },
  { ico: "G", bg: "linear-gradient(135deg,#4285F4,#34A853)", role: "Google – Technical Interview", sub: "Friday · 1:00 PM EST", date: "Mar 7" },
];

const ANALYTICS = [
  { value: "147", label: "Total Applied", change: "↑ 23% this week", color: "var(--accent-2)", changeColor: "var(--accent-green)" },
  { value: "12.4%", label: "Response Rate", change: "↑ 3.1% vs avg", color: "var(--accent-green)", changeColor: "var(--accent-green)" },
  { value: "4.2 days", label: "Avg Response Time", change: "↓ 1.5 days faster", color: "var(--accent-1-light)", changeColor: "var(--accent-green)" },
];

export function FeatTracking() {
  const [active, setActive] = useState<Tab>("overview");

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="mb-4 flex gap-0.5 px-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className="cursor-pointer rounded-lg border-none px-4 py-[7px] font-display text-[0.72rem] font-medium transition-all duration-250"
            style={{
              background: active === t.key ? "rgba(46,196,182,.08)" : "transparent",
              color: active === t.key ? "var(--accent-1-light)" : "var(--tw-20)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {active === "overview" && (
        <div>
          <div className="flex items-end gap-1.5" style={{ height: 100 }}>
            {BAR_HEIGHTS.map((h, i) => (
              <div key={i} className="relative flex-1 cursor-pointer rounded-t transition-colors duration-300 hover:bg-[rgba(46,196,182,.18)]" style={{ height: "100%", background: "rgba(46,196,182,.08)" }}>
                <div className="absolute bottom-0 left-0 right-0 rounded-t" style={{ height: `${h}%`, background: "var(--gradient-btn)", opacity: 0.6 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-1 font-mono text-[0.58rem]" style={{ color: "var(--tw-20)" }}>
            {BAR_LABELS.map((l, i) => <span key={i}>{l}</span>)}
          </div>
        </div>
      )}

      {active === "apps" && (
        <div className="flex flex-col gap-1.5">
          {APP_LIST.map((a, i) => (
            <div key={i} className="flex items-center justify-between rounded-[10px] border px-3 py-2.5" style={{ background: "rgba(255,255,255,.015)", borderColor: "var(--tw-10)" }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[7px] font-mono text-[0.58rem] font-extrabold text-white" style={{ background: a.bg }}>{a.ico}</div>
                <div>
                  <div className="font-display text-[0.78rem] font-semibold" style={{ color: "var(--tw-90)" }}>{a.role}</div>
                  <div className="font-display text-[0.65rem]" style={{ color: "var(--tw-20)" }}>{a.sub}</div>
                </div>
              </div>
              <span className="rounded-full px-2.5 py-[3px] font-mono text-[0.65rem] font-semibold" style={{ background: a.tagBg, color: a.tagColor }}>{a.tag}</span>
            </div>
          ))}
        </div>
      )}

      {active === "interviews" && (
        <div className="flex flex-col gap-1.5">
          {INTERVIEW_LIST.map((iv, i) => (
            <div key={i} className="flex items-center justify-between rounded-[10px] border px-3 py-2.5" style={{ background: "rgba(255,255,255,.015)", borderColor: "var(--tw-10)" }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[7px] font-mono text-[0.58rem] font-extrabold text-white" style={{ background: iv.bg }}>{iv.ico}</div>
                <div>
                  <div className="font-display text-[0.78rem] font-semibold" style={{ color: "var(--tw-90)" }}>{iv.role}</div>
                  <div className="font-display text-[0.65rem]" style={{ color: "var(--tw-20)" }}>{iv.sub}</div>
                </div>
              </div>
              <span className="rounded-md border px-2 py-1 font-mono text-[0.62rem]" style={{ background: "rgba(91,141,255,.06)", borderColor: "rgba(91,141,255,.1)", color: "var(--accent-2)" }}>{iv.date}</span>
            </div>
          ))}
        </div>
      )}

      {active === "analytics" && (
        <div className="grid grid-cols-3 gap-2.5">
          {ANALYTICS.map((a, i) => (
            <div key={i} className="rounded-xl border p-4 text-center" style={{ background: "rgba(255,255,255,.015)", borderColor: "var(--tw-10)" }}>
              <div className="font-mono text-[1.2rem] font-extrabold tracking-[-0.03em]" style={{ color: a.color }}>{a.value}</div>
              <div className="mt-1 font-display text-[0.62rem] uppercase tracking-[.06em]" style={{ color: "var(--tw-20)" }}>{a.label}</div>
              <div className="mt-1.5 font-mono text-[0.6rem] font-semibold" style={{ color: a.changeColor }}>{a.change}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
