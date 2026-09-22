import { useState, useRef, useCallback } from "react";
import { ApplyPilotMark } from "@/icons";

type TabKey = "apps" | "matches" | "interviews";

const STATS: { key: TabKey; label: string; value: string; color: string }[] = [
  { key: "apps", label: "Applied Today", value: "47", color: "var(--accent-2)" },
  { key: "matches", label: "Job Matches", value: "12", color: "var(--accent-green)" },
  { key: "interviews", label: "Interviews", value: "6", color: "var(--accent-3)" },
];

const PANEL_LABELS: Record<TabKey, string> = {
  apps: "Recent Applications",
  matches: "Top Job Matches",
  interviews: "Upcoming Interviews",
};

interface JobItem {
  logo: string;
  logoBg: string;
  role: string;
  company: string;
  pills?: string[];
  score?: number;
  tag: string;
  tagStyle: string;
  time?: string;
  date?: string;
}

const APPS: JobItem[] = [
  { logo: "G", logoBg: "linear-gradient(135deg,#4285F4,#34A853)", role: "Software Engineer Intern", company: "Google", pills: ["Mountain View, CA", "Hybrid"], score: 96, tag: "Applied", tagStyle: "rgba(52,211,153,.1);color:var(--accent-green)", time: "2s ago" },
  { logo: "S", logoBg: "linear-gradient(135deg,#635BFF,#A259FF)", role: "Product Designer", company: "Stripe", pills: ["San Francisco, CA", "Remote"], score: 92, tag: "Applied", tagStyle: "rgba(52,211,153,.1);color:var(--accent-green)", time: "14s ago" },
  { logo: "L", logoBg: "linear-gradient(135deg,#5B68F6,#8B5CF6)", role: "Product Manager", company: "Linear", pills: ["San Francisco, CA", "Remote"], score: 88, tag: "Applying...", tagStyle: "rgba(46,196,182,.1);color:var(--accent-1-light)", time: "just now" },
  { logo: "F", logoBg: "linear-gradient(135deg,#0ACF83,#A259FF)", role: "UX Researcher", company: "Figma", pills: ["New York, NY", "Hybrid"], score: 85, tag: "Applied", tagStyle: "rgba(52,211,153,.1);color:var(--accent-green)", time: "1m ago" },
];

const MATCHES: JobItem[] = [
  { logo: "A", logoBg: "linear-gradient(135deg,#FF9900,#FF6600)", role: "Data Analyst", company: "Amazon", pills: ["Seattle, WA", "On-site"], score: 94, tag: "94% fit", tagStyle: "rgba(52,211,153,.08);color:var(--accent-green)" },
  { logo: "S", logoBg: "linear-gradient(135deg,#1DB954,#169c46)", role: "Product Designer", company: "Spotify", pills: ["London, UK", "Hybrid"], score: 91, tag: "91% fit", tagStyle: "rgba(52,211,153,.08);color:var(--accent-green)" },
  { logo: "N", logoBg: "linear-gradient(135deg,#000,#333)", role: "Frontend Engineer", company: "Notion", pills: ["San Francisco, CA", "Remote"], score: 87, tag: "87% fit", tagStyle: "rgba(91,141,255,.08);color:var(--accent-2)" },
  { logo: "M", logoBg: "linear-gradient(135deg,#0668E1,#1877F2)", role: "ML Engineer", company: "Meta", pills: ["Menlo Park, CA", "Hybrid"], score: 82, tag: "82% fit", tagStyle: "rgba(91,141,255,.08);color:var(--accent-2)" },
];

const INTERVIEWS: JobItem[] = [
  { logo: "S", logoBg: "linear-gradient(135deg,#1DB954,#169c46)", role: "Product Designer · Round 1", company: "Spotify", tag: "Scheduled", tagStyle: "rgba(91,141,255,.1);color:var(--accent-2)", date: "Mar 4, 2pm" },
  { logo: "A", logoBg: "linear-gradient(135deg,#FF6B6B,#ee5a24)", role: "UX Researcher · Phone Screen", company: "Airbnb", tag: "Scheduled", tagStyle: "rgba(91,141,255,.1);color:var(--accent-2)", date: "Mar 5, 10am" },
  { logo: "G", logoBg: "linear-gradient(135deg,#4285F4,#34A853)", role: "SWE Intern · Technical", company: "Google", tag: "Scheduled", tagStyle: "rgba(91,141,255,.1);color:var(--accent-2)", date: "Mar 7, 1pm" },
  { logo: "N", logoBg: "linear-gradient(135deg,#000,#333)", role: "Data Analyst · Final Round", company: "Notion", tag: "Scheduled", tagStyle: "rgba(91,141,255,.1);color:var(--accent-2)", date: "Mar 10, 3pm" },
];

const PANELS: Record<TabKey, JobItem[]> = { apps: APPS, matches: MATCHES, interviews: INTERVIEWS };

function parseTagStyle(s: string) {
  const parts = s.split(";");
  const bg = parts[0] || "";
  const color = parts[1]?.replace("color:", "") || "";
  return { background: bg, color };
}

export function HeroDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("apps");
  const cardRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, visible: false });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpotlight({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setSpotlight((s) => ({ ...s, visible: false }));
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ opacity: 0, animation: "dashIn 2s cubic-bezier(0,0,0.2,1) 1.1s forwards" }}>
      {/* Glow backdrop — dual layer */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(46,196,182,.12) 0%, rgba(46,196,182,.03) 40%, transparent 70%)",
          filter: "blur(80px)", top: "50%", left: "50%",
          opacity: 0, animation: "dashGlowIn 2.4s cubic-bezier(0,0,0.2,1) 1.1s forwards",
        }}
      />
      {/* Secondary cyan glow — offset */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 350, height: 350, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,211,238,.08) 0%, transparent 60%)",
          filter: "blur(60px)", top: "40%", left: "60%",
          backgroundSize: "200% 200%",
          opacity: 0, animation: "dashGlowIn 3s cubic-bezier(0,0,0.2,1) 1.4s forwards",
        }}
      />

      {/* Pulse ring — expanding teal border */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 560, height: 400, borderRadius: 20,
          border: "1px solid rgba(46,196,182,.15)",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          animation: "pulseRing 4s ease-out infinite",
          opacity: 0,
          animationDelay: "3s",
        }}
      />

      {/* 3D Float wrapper */}
      <div style={{ animation: "dashFloat3D 7s ease-in-out infinite", transformStyle: "preserve-3d" }}>
        {/* Dashboard card */}
        <div
          ref={cardRef}
          className="relative w-[560px] max-w-full overflow-hidden rounded-[20px]"
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--tw-20)",
            boxShadow: "0 0 0 .5px rgba(255,255,255,.04), 0 24px 80px -12px rgba(0,0,0,.6), 0 0 120px rgba(46,196,182,.05)",
            animation: "dashBorderGlow 8s ease-in-out 4s infinite",
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Cursor spotlight overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-50 rounded-[20px] transition-opacity duration-300"
            style={{
              background: spotlight.visible
                ? `radial-gradient(circle 250px at ${spotlight.x}px ${spotlight.y}px, rgba(46,196,182,.07), transparent)`
                : "transparent",
              opacity: spotlight.visible ? 1 : 0,
            }}
          />

          {/* Shine sweep overlay — double sweep */}
          <div
            className="pointer-events-none absolute inset-0 z-40"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent)",
              animation: "dashShine 1.6s cubic-bezier(0,0,0.2,1) 2.8s forwards",
              transform: "translateX(-100%) rotate(25deg)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 z-40"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,.025), transparent)",
              animation: "dashShine 1.6s cubic-bezier(0,0,0.2,1) 3.1s forwards",
              transform: "translateX(-100%) rotate(25deg)",
            }}
          />

          {/* Top highlight gradient */}
          <div
            className="pointer-events-none absolute inset-0 z-30 rounded-[20px]"
            style={{ background: "linear-gradient(170deg, rgba(255,255,255,.04) 0%, transparent 35%)" }}
          />

          {/* Header */}
          <div className="flex items-center justify-between border-b px-[22px] py-[18px]" style={{ borderColor: "var(--tw-10)" }}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pri">
                <ApplyPilotMark size={14} color="#fff" />
              </div>
              <span className="font-display text-[0.9rem] font-bold tracking-[-0.02em]" style={{ color: "var(--tw-90)" }}>ApplyPilot</span>
            </div>
            <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[.06em]" style={{ color: "var(--accent-green)" }}>
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: "var(--accent-green)", animation: "glowPulse 2s ease-in-out infinite", boxShadow: "0 0 0 0 rgba(52,211,153,.4)" }} />
              LIVE
            </div>
          </div>

          {/* Stat tabs */}
          <div className="grid grid-cols-3 border-b" style={{ borderColor: "var(--tw-10)" }}>
            {STATS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveTab(s.key)}
                className="relative cursor-pointer border-r px-[18px] py-4 text-left transition-colors duration-200 hover:bg-white/2"
                style={{ borderColor: "var(--tw-10)", background: "transparent" }}
              >
                <div className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[.08em]" style={{ color: "var(--tw-20)" }}>
                  <span className="h-[5px] w-[5px] rounded-full" style={{ background: s.color }} />
                  {s.label}
                </div>
                <div className="mt-1.5 font-mono text-[1.35rem] font-extrabold tracking-[-0.03em]" style={{ color: "var(--tw-90)" }}>{s.value}</div>
                {activeTab === s.key && (
                  <div className="absolute bottom-0 left-[20%] right-[20%] h-0.5 rounded-sm" style={{ background: s.color }} />
                )}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex items-center border-b px-[22px] py-3.5" style={{ borderColor: "var(--tw-10)" }}>
            <span className="font-display text-[0.78rem] font-semibold" style={{ color: "var(--tw-90)" }}>Daily Goal</span>
            <div className="mx-3.5 h-[5px] flex-1 overflow-hidden rounded-sm" style={{ background: "rgba(255,255,255,.04)" }}>
              <div className="h-full rounded-sm" style={{ background: "var(--gradient-btn)", animation: "progressFill 2s cubic-bezier(0,0,0.2,1) 3.2s forwards", width: 0 }} />
            </div>
            <span className="font-mono text-[0.78rem] font-semibold" style={{ color: "var(--tw-40)" }}>47 / 50</span>
          </div>

          {/* Panel label */}
          <div className="px-[22px] pt-3.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[.1em]" style={{ color: "var(--tw-20)" }}>
            {PANEL_LABELS[activeTab]}
          </div>

          {/* Job items */}
          <div className="flex flex-col gap-1.5 p-3.5 pt-2">
            {PANELS[activeTab].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors duration-200 hover:bg-white/3"
                style={{ background: "rgba(255,255,255,.015)", borderColor: "var(--tw-10)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[0.68rem] font-extrabold text-white"
                    style={{ background: item.logoBg }}
                  >
                    {item.logo}
                  </div>
                  <div>
                    <div className="font-display text-[0.82rem] font-semibold tracking-[-0.01em]" style={{ color: "var(--tw-90)" }}>{item.role}</div>
                    <div className="font-display text-[0.7rem]" style={{ color: "var(--tw-20)" }}>{item.company}</div>
                    {item.pills && (
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {item.pills.map((p) => (
                          <span key={p} className="whitespace-nowrap rounded-full border px-[7px] py-[2px] font-mono text-[0.58rem]" style={{ background: "rgba(255,255,255,.04)", borderColor: "var(--tw-10)", color: "var(--tw-20)" }}>{p}</span>
                        ))}
                        {item.score != null && (
                          <span className="font-mono text-[0.68rem] font-semibold" style={{ color: "var(--accent-green)" }}>
                            {item.score}%
                            <span className="ml-1 inline-block h-[3px] w-9 overflow-hidden rounded-sm align-middle" style={{ background: "rgba(255,255,255,.04)" }}>
                              <span className="block h-full rounded-sm" style={{ width: `${item.score}%`, background: "var(--accent-green)" }} />
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.time && <span className="font-mono text-[0.65rem]" style={{ color: "var(--tw-20)" }}>{item.time}</span>}
                  {item.date && (
                    <span className="whitespace-nowrap rounded-md border px-2 py-1 font-mono text-[0.62rem]" style={{ background: "rgba(91,141,255,.06)", borderColor: "rgba(91,141,255,.1)", color: "var(--accent-2)" }}>{item.date}</span>
                  )}
                  <span className="whitespace-nowrap rounded-full px-2.5 py-[3px] font-mono text-[0.65rem] font-semibold" style={parseTagStyle(item.tagStyle)}>{item.tag}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Notification */}
          <div
            className="mx-3.5 mb-3.5 flex items-center gap-2.5 rounded-xl border px-3.5 py-3"
            style={{
              background: "linear-gradient(135deg, rgba(46,196,182,.08), rgba(100,181,207,.08))",
              borderColor: "rgba(46,196,182,.12)",
              animation: "slideNotif .6s cubic-bezier(0,0,0.2,1) 4.5s both",
            }}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pri">
              <ApplyPilotMark size={14} color="#fff" />
            </div>
            <div>
              <div className="font-display text-[0.78rem] font-semibold" style={{ color: "var(--tw-90)" }}>New match found!</div>
              <div className="font-display text-[0.68rem]" style={{ color: "var(--tw-40)" }}>Apple · iOS Engineer · 96% fit score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reflection — blurred tinted mirror below card */}
      <div
        className="pointer-events-none mt-1 w-[560px] max-w-full overflow-hidden"
        style={{
          height: 60,
          opacity: 0,
          animation: "dashIn 2s cubic-bezier(0,0,0.2,1) 1.6s forwards",
        }}
      >
        <div
          className="h-[200px] w-full rounded-[20px]"
          style={{
            background: "linear-gradient(180deg, rgba(46,196,182,.04) 0%, rgba(17,28,42,.8) 30%, transparent 100%)",
            transform: "scaleY(-1)",
            filter: "blur(8px)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,.18), transparent 80%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,.18), transparent 80%)",
          }}
        />
      </div>
    </div>
  );
}
