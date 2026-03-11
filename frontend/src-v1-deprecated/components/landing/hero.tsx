import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

/* ── Data (matches the design HTML exactly) ── */

const appItems = [
  { letter: "G", gradient: "linear-gradient(135deg,#4285F4,#34A853)", role: "Software Engineer Intern", company: "Google", location: "Mountain View, CA", type: "Hybrid", match: 96, time: "2s ago", status: "Applied" as const },
  { letter: "S", gradient: "linear-gradient(135deg,#635BFF,#A259FF)", role: "Product Designer", company: "Stripe", location: "San Francisco, CA", type: "Remote", match: 92, time: "14s ago", status: "Applied" as const },
  { letter: "L", gradient: "linear-gradient(135deg,#5B68F6,#8B5CF6)", role: "Product Manager", company: "Linear", location: "San Francisco, CA", type: "Remote", match: 88, time: "just now", status: "Applying" as const },
  { letter: "F", gradient: "linear-gradient(135deg,#0ACF83,#A259FF)", role: "UX Researcher", company: "Figma", location: "New York, NY", type: "Hybrid", match: 85, time: "1m ago", status: "Applied" as const },
];

const matchItems = [
  { letter: "A", gradient: "linear-gradient(135deg,#FF9900,#FF6600)", role: "Data Analyst", company: "Amazon", location: "Seattle, WA", type: "On-site", score: 94 },
  { letter: "S", gradient: "linear-gradient(135deg,#1DB954,#169c46)", role: "Product Designer", company: "Spotify", location: "London, UK", type: "Hybrid", score: 91 },
  { letter: "N", gradient: "linear-gradient(135deg,#000,#333)", role: "Frontend Engineer", company: "Notion", location: "San Francisco, CA", type: "Remote", score: 87 },
  { letter: "M", gradient: "linear-gradient(135deg,#0668E1,#1877F2)", role: "ML Engineer", company: "Meta", location: "Menlo Park, CA", type: "Hybrid", score: 82 },
];

const interviewItems = [
  { letter: "S", gradient: "linear-gradient(135deg,#1DB954,#169c46)", role: "Product Designer \u00b7 Round 1", company: "Spotify", date: "Mar 4, 2pm" },
  { letter: "A", gradient: "linear-gradient(135deg,#FF6B6B,#ee5a24)", role: "UX Researcher \u00b7 Phone Screen", company: "Airbnb", date: "Mar 5, 10am" },
  { letter: "G", gradient: "linear-gradient(135deg,#4285F4,#34A853)", role: "SWE Intern \u00b7 Technical", company: "Google", date: "Mar 7, 1pm" },
  { letter: "N", gradient: "linear-gradient(135deg,#000,#333)", role: "Data Analyst \u00b7 Final Round", company: "Notion", date: "Mar 10, 3pm" },
];

type TabKey = "apps" | "matches" | "interviews";

const panelLabels: Record<TabKey, string> = {
  apps: "Recent Applications",
  matches: "Top Job Matches",
  interviews: "Upcoming Interviews",
};

/* ── Sub-components ── */

function CompanyLogo({ letter, gradient }: { letter: string; gradient: string }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg text-[0.68rem] font-extrabold text-white"
      style={{ width: 32, height: 32, background: gradient }}
    >
      {letter}
    </div>
  );
}

function DashItem({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl transition-colors duration-200 hover:bg-white/[0.03]"
      style={{
        padding: "10px 12px",
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="whitespace-nowrap rounded-full text-[0.58rem]"
      style={{
        padding: "2px 7px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.04)",
        color: "var(--color-text-muted)",
      }}
    >
      {children}
    </span>
  );
}

function MatchScore({ score }: { score: number }) {
  return (
    <span
      className="flex items-center gap-1"
      style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", fontWeight: 600, color: "var(--color-accent-green)" }}
    >
      {score}%
      <span
        className="overflow-hidden"
        style={{ width: 36, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.04)" }}
      >
        <span
          className="block"
          style={{ height: "100%", borderRadius: 2, background: "var(--color-accent-green)", width: `${score}%` }}
        />
      </span>
    </span>
  );
}

/* ── Hero Section ── */

export function Hero() {
  const [activeTab, setActiveTab] = useState<TabKey>("apps");
  const g1Ref = useRef<HTMLDivElement>(null);
  const g2Ref = useRef<HTMLDivElement>(null);

  // Parallax scroll on glow orbs
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const s = window.scrollY;
          if (g1Ref.current) g1Ref.current.style.transform = `translateY(${s * 0.08}px)`;
          if (g2Ref.current) g2Ref.current.style.transform = `translateY(${s * 0.05}px)`;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      className="relative flex min-h-[100dvh] items-center overflow-hidden"
      style={{ padding: "100px clamp(24px,5vw,80px) 80px" }}
    >
      {/* ── Background ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Glow orb 1 */}
        <div
          ref={g1Ref}
          className="absolute"
          style={{
            width: 700, height: 700, borderRadius: "50%",
            background: "rgba(124,92,252,0.08)", filter: "blur(120px)",
            top: "-15%", left: "-10%",
            animation: "glowPulse 8s ease-in-out infinite",
          }}
        />
        {/* Glow orb 2 */}
        <div
          ref={g2Ref}
          className="absolute"
          style={{
            width: 500, height: 500, borderRadius: "50%",
            background: "rgba(91,141,255,0.06)", filter: "blur(100px)",
            bottom: "-10%", right: "10%",
            animation: "glowPulse 10s ease-in-out infinite 3s",
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at 30% 50%, black 15%, transparent 60%)",
            WebkitMaskImage: "radial-gradient(ellipse at 30% 50%, black 15%, transparent 60%)",
          }}
        />
        {/* Noise texture */}
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.025,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px",
          }}
        />
      </div>

      {/* ── Content Grid ── */}
      <div className="relative z-[2] mx-auto grid w-full max-w-[1280px] items-center gap-[60px] grid-cols-1 lg:grid-cols-2">

        {/* ── Left Column ── */}
        <div className="max-w-[560px] max-lg:mx-auto max-lg:text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full text-[0.78rem] font-medium opacity-0"
            style={{
              padding: "6px 16px 6px 8px",
              background: "rgba(124,92,252,0.08)",
              border: "1px solid rgba(124,92,252,0.15)",
              color: "var(--color-accent-purple-light)",
              animation: "heroIn 0.7s var(--ease) 0.1s forwards",
            }}
          >
            <span
              className="flex items-center justify-center rounded-[6px] text-[0.65rem] text-white"
              style={{ width: 22, height: 22, background: "var(--gradient-primary)" }}
            >
              &#9889;
            </span>
            AI-Powered Job Applications
          </div>

          {/* Heading */}
          <h1
            className="mt-8 font-extrabold leading-[1.02] tracking-[-0.045em] opacity-0"
            style={{
              fontSize: "clamp(3rem,5.5vw,4.5rem)",
              animation: "heroIn 0.8s var(--ease) 0.2s forwards",
            }}
          >
            Your Job<br />Application.<br />
            <span className="gradient-text">Fully Automated.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 max-w-[440px] text-[1.05rem] leading-[1.65] opacity-0 max-lg:mx-auto"
            style={{
              color: "var(--color-text-secondary)",
              animation: "heroIn 0.8s var(--ease) 0.35s forwards",
            }}
          >
            AutoApply sends{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>personalized</strong>,
            AI-crafted applications to hundreds of roles on your behalf &mdash; 24/7,
            while you sleep.
          </p>

          {/* Buttons */}
          <div
            className="mt-10 flex gap-3.5 opacity-0 max-lg:justify-center max-md:flex-col max-md:items-center"
            style={{ animation: "heroIn 0.8s var(--ease) 0.5s forwards" }}
          >
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
              style={{
                height: 48, padding: "0 28px", fontSize: "0.92rem",
                background: "var(--gradient-primary)",
                boxShadow: "0 2px 12px rgba(124,92,252,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
                letterSpacing: "-0.01em",
              }}
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06]"
              style={{
                height: 48, padding: "0 24px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
                color: "var(--color-text-primary)",
                fontSize: "0.88rem", fontWeight: 500,
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 24, height: 24,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <svg fill="currentColor" viewBox="0 0 24 24" width={10} height={10} style={{ marginLeft: 1 }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              See How It Works
            </button>
          </div>

          {/* Social proof */}
          <div
            className="mt-10 flex items-center gap-3.5 opacity-0 max-lg:justify-center"
            style={{ animation: "heroIn 0.8s var(--ease) 0.65s forwards" }}
          >
            <div className="flex">
              {[
                { letter: "A", gradient: "linear-gradient(135deg,#7c5cfc,#5b8dff)" },
                { letter: "C", gradient: "linear-gradient(135deg,#34d399,#22d3ee)" },
                { letter: "J", gradient: "linear-gradient(135deg,#f59e0b,#ef4444)" },
                { letter: "M", gradient: "linear-gradient(135deg,#ec4899,#a78bfa)" },
              ].map((ava, i) => (
                <div
                  key={ava.letter}
                  className="flex items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
                  style={{
                    width: 32, height: 32,
                    border: "2px solid var(--color-bg)",
                    background: ava.gradient,
                    marginLeft: i === 0 ? 0 : -8,
                  }}
                >
                  {ava.letter}
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <span style={{ color: "#fbbf24", fontSize: "0.75rem", letterSpacing: "1px" }}>
                &#9733;&#9733;&#9733;&#9733;&#9733;
              </span>
              <span className="mt-0.5 text-[0.78rem]" style={{ color: "var(--color-text-muted)" }}>
                <strong style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>50,000+</strong>{" "}
                people trust AutoApply
              </span>
            </div>
          </div>
        </div>

        {/* ── Right Column — Dashboard ── */}
        <div className="relative flex items-center justify-center max-lg:mt-10">
          <div
            className="opacity-0"
            style={{ animation: "dashIn 2s cubic-bezier(0,0,0.2,1) 1s forwards" }}
          >
            {/* Glow behind dashboard */}
            <div
              className="pointer-events-none absolute"
              style={{
                width: 520, height: 520, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(124,92,252,0.1) 0%, rgba(91,141,255,0.04) 50%, transparent 70%)",
                filter: "blur(100px)",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: -1,
              }}
            />
            <div
              className="pointer-events-none absolute"
              style={{
                width: 280, height: 280, borderRadius: "50%",
                background: "rgba(34,211,238,0.035)", filter: "blur(80px)",
                top: "25%", left: "65%",
                zIndex: -1,
              }}
            />

            {/* Float wrapper */}
            <div style={{ animation: "floatY 7s ease-in-out infinite", transformStyle: "preserve-3d" }}>
              {/* Dashboard card */}
              <div
                className="relative overflow-hidden"
                style={{
                  width: 560, maxWidth: "100%",
                  background: "var(--color-bg-card)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 20,
                  boxShadow: "0 0 0 0.5px rgba(255,255,255,0.04), 0 30px 80px -12px rgba(0,0,0,0.6), 0 0 100px rgba(124,92,252,0.04)",
                  animation: "borderGlow 8s ease-in-out 4.5s infinite",
                }}
              >
                {/* Shine sweep */}
                <div
                  className="pointer-events-none absolute"
                  style={{
                    top: 0, left: "-60%", width: "40%", height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.035), transparent)",
                    transform: "translateX(-100%) rotate(25deg)",
                    animation: "shine 1.8s cubic-bezier(0,0,0.2,1) 2.8s forwards",
                    zIndex: 50,
                  }}
                />
                {/* Top gloss */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    borderRadius: 20,
                    background: "linear-gradient(170deg, rgba(255,255,255,0.025) 0%, transparent 35%)",
                    zIndex: 49,
                  }}
                />

                {/* ── Card Header ── */}
                <div
                  className="flex items-center justify-between"
                  style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex items-center justify-center rounded-lg text-[0.7rem] text-white"
                      style={{ width: 28, height: 28, background: "var(--gradient-primary)" }}
                    >
                      &#9889;
                    </div>
                    <span className="text-[0.9rem] font-bold tracking-[-0.02em]">AutoApply</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="block rounded-full"
                      style={{
                        width: 7, height: 7,
                        background: "var(--color-accent-green)",
                        animation: "pulseDot 2s ease-in-out infinite",
                      }}
                    />
                    <span
                      className="text-[0.68rem] font-semibold uppercase"
                      style={{ color: "var(--color-accent-green)", letterSpacing: "0.06em" }}
                    >
                      LIVE
                    </span>
                  </div>
                </div>

                {/* ── Stats Row ── */}
                <div
                  className="grid grid-cols-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  {([
                    { key: "apps" as TabKey, label: "Applied Today", value: "47", dotColor: "var(--color-accent-blue)", barColor: "var(--color-accent-blue)" },
                    { key: "matches" as TabKey, label: "Job Matches", value: "12", dotColor: "var(--color-accent-green)", barColor: "var(--color-accent-green)" },
                    { key: "interviews" as TabKey, label: "Interviews", value: "6", dotColor: "var(--color-accent-cyan)", barColor: "var(--color-accent-cyan)" },
                  ]).map((tab, i) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className="relative cursor-pointer text-left transition-colors duration-200 hover:bg-white/[0.02]"
                      style={{
                        padding: "16px 18px",
                        borderRight: i < 2 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                      }}
                    >
                      <div className="mb-1.5 flex items-center gap-[5px]">
                        <span className="rounded-full" style={{ width: 5, height: 5, background: tab.dotColor }} />
                        <span
                          className="text-[0.6rem] font-semibold uppercase"
                          style={{ letterSpacing: "0.08em", color: "var(--color-text-muted)" }}
                        >
                          {tab.label}
                        </span>
                      </div>
                      <div className="text-[1.35rem] font-extrabold tracking-[-0.03em]">{tab.value}</div>
                      {activeTab === tab.key && (
                        <span
                          className="absolute bottom-0 left-[20%] right-[20%] h-[2px] rounded-[1px]"
                          style={{ background: tab.barColor }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* ── Progress Bar ── */}
                <div
                  className="flex items-center"
                  style={{ padding: "14px 22px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span className="text-[0.78rem] font-semibold">Daily Goal</span>
                  <div
                    className="mx-3.5 flex-1 overflow-hidden"
                    style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}
                  >
                    <div
                      style={{
                        height: "100%", borderRadius: 3,
                        background: "var(--gradient-primary)",
                        width: 0,
                        animation: "hero-progress 2s cubic-bezier(0,0,0.2,1) 3s forwards",
                      }}
                    />
                  </div>
                  <span
                    className="text-[0.78rem] font-semibold"
                    style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}
                  >
                    47 / 50
                  </span>
                </div>

                {/* ── Panel Label ── */}
                <div
                  className="text-[0.62rem] font-semibold uppercase"
                  style={{ padding: "14px 22px 0", letterSpacing: "0.1em", color: "var(--color-text-muted)" }}
                >
                  {panelLabels[activeTab]}
                </div>

                {/* ── Panels ── */}
                <div className="flex flex-col gap-1.5" style={{ padding: "8px 14px 14px", minHeight: 290 }}>
                  {/* Applied Today */}
                  {activeTab === "apps" && appItems.map((item) => (
                    <DashItem key={item.role}>
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo letter={item.letter} gradient={item.gradient} />
                        <div>
                          <div className="text-[0.82rem] font-semibold" style={{ letterSpacing: "-0.01em" }}>{item.role}</div>
                          <div className="text-[0.7rem]" style={{ color: "var(--color-text-muted)" }}>{item.company}</div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <Pill>{item.location}</Pill>
                            <Pill>{item.type}</Pill>
                            <MatchScore score={item.match} />
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[0.65rem]" style={{ color: "var(--color-text-muted)" }}>{item.time}</span>
                        <span
                          className="rounded-full px-2.5 py-[3px] text-[0.65rem] font-semibold"
                          style={{
                            background: item.status === "Applying" ? "rgba(124,92,252,0.1)" : "rgba(52,211,153,0.1)",
                            color: item.status === "Applying" ? "var(--color-accent-purple-light)" : "var(--color-accent-green)",
                          }}
                        >
                          {item.status === "Applying" ? "Applying..." : item.status}
                        </span>
                      </div>
                    </DashItem>
                  ))}

                  {/* Job Matches */}
                  {activeTab === "matches" && matchItems.map((item) => (
                    <DashItem key={item.role}>
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo letter={item.letter} gradient={item.gradient} />
                        <div>
                          <div className="text-[0.82rem] font-semibold" style={{ letterSpacing: "-0.01em" }}>{item.role}</div>
                          <div className="text-[0.7rem]" style={{ color: "var(--color-text-muted)" }}>{item.company}</div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <Pill>{item.location}</Pill>
                            <Pill>{item.type}</Pill>
                            <MatchScore score={item.score} />
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span
                          className="rounded-full px-2.5 py-[3px] text-[0.65rem] font-semibold"
                          style={{
                            background: item.score >= 90 ? "rgba(52,211,153,0.08)" : "rgba(91,141,255,0.08)",
                            color: item.score >= 90 ? "var(--color-accent-green)" : "var(--color-accent-blue)",
                          }}
                        >
                          {item.score}% fit
                        </span>
                      </div>
                    </DashItem>
                  ))}

                  {/* Interviews */}
                  {activeTab === "interviews" && interviewItems.map((item) => (
                    <DashItem key={item.role}>
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo letter={item.letter} gradient={item.gradient} />
                        <div>
                          <div className="text-[0.82rem] font-semibold" style={{ letterSpacing: "-0.01em" }}>{item.role}</div>
                          <div className="text-[0.7rem]" style={{ color: "var(--color-text-muted)" }}>{item.company}</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className="whitespace-nowrap"
                          style={{
                            fontFamily: "var(--font-mono)", fontSize: "0.62rem",
                            padding: "4px 8px", borderRadius: 6,
                            background: "rgba(91,141,255,0.06)",
                            border: "1px solid rgba(91,141,255,0.1)",
                            color: "var(--color-accent-blue)",
                          }}
                        >
                          {item.date}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-[3px] text-[0.65rem] font-semibold"
                          style={{ background: "rgba(91,141,255,0.1)", color: "var(--color-accent-blue)" }}
                        >
                          Scheduled
                        </span>
                      </div>
                    </DashItem>
                  ))}
                </div>

                {/* ── Notification Toast ── */}
                <div
                  className="flex items-center gap-2.5"
                  style={{
                    margin: "0 14px 14px", padding: "12px 14px", borderRadius: 12,
                    background: "linear-gradient(135deg, rgba(124,92,252,0.08), rgba(91,141,255,0.08))",
                    border: "1px solid rgba(124,92,252,0.12)",
                    animation: "slideNotif 0.6s cubic-bezier(0,0,0.2,1) 4.5s both",
                  }}
                >
                  <div
                    className="flex shrink-0 items-center justify-center rounded-lg text-[0.7rem] text-white"
                    style={{ width: 28, height: 28, background: "var(--gradient-primary)" }}
                  >
                    &#9889;
                  </div>
                  <div>
                    <div className="text-[0.78rem] font-semibold">New match found!</div>
                    <div className="text-[0.68rem]" style={{ color: "var(--color-text-secondary)" }}>
                      Apple &mdash; iOS Engineer &middot; 96% fit score
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
