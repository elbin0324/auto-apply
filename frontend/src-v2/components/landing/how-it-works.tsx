import { useRef } from "react";
import { useInView } from "motion/react";
import { Reveal } from "./reveal";

const STEPS = [
  {
    n: "01",
    title: "Connect your profile",
    desc: "Sync your LinkedIn or upload your resume in under 60 seconds. ApplyPilot learns your skills, experience, and goals to build a personalized candidate profile.",
    accent: "#64b5cf",
    iconPath: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0",
  },
  {
    n: "02",
    title: "Set your preferences",
    desc: "Choose your target roles, industries, salary range, and dream companies. ApplyPilot matches you to the opportunities most likely to convert into interviews.",
    accent: "#2ec4b6",
    iconPath: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75",
  },
  {
    n: "03",
    title: "Sit back & get hired",
    desc: "ApplyPilot sends perfectly tailored applications — including custom cover letters — 24/7. You get a dashboard of every application, every response, every opportunity.",
    accent: "#22d3ee",
    iconPath: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.932-3.532l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757",
  },
];

/* ── Step 1: Mini resume card ── */
function VisualResume({ accent, inView }: { accent: string; inView: boolean }) {
  return (
    <div className="relative flex items-center justify-center" style={{ minHeight: 150 }}>
      {/* Floating resume card */}
      <div
        className="relative w-[160px] rounded-xl border p-4"
        style={{
          background: "rgba(255,255,255,.03)",
          borderColor: `${accent}22`,
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
          animation: inView ? "floatY 6s ease-in-out infinite" : "none",
          animationDelay: "0.5s",
        }}
      >
        {/* Avatar */}
        <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
          </svg>
        </div>
        {/* Skeleton lines */}
        <div className="mb-2 mx-auto h-[5px] w-[70%] rounded-full" style={{ background: `${accent}25` }} />
        <div className="mb-2 mx-auto h-[4px] w-[90%] rounded-full" style={{ background: "rgba(255,255,255,.06)" }} />
        <div className="mb-2 mx-auto h-[4px] w-[75%] rounded-full" style={{ background: "rgba(255,255,255,.06)" }} />
        <div className="mx-auto h-[4px] w-[60%] rounded-full" style={{ background: "rgba(255,255,255,.04)" }} />
        {/* Skills row */}
        <div className="mt-3 flex justify-center gap-1">
          {["React", "TS"].map((s, i) => (
            <span
              key={s}
              className="rounded-full px-2 py-[2px] font-mono text-[0.5rem]"
              style={{
                background: `${accent}10`,
                color: accent,
                opacity: inView ? 1 : 0,
                animation: inView ? "popIn 0.5s ease forwards" : "none",
                animationDelay: `${0.6 + i * 0.15}s`,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* LinkedIn badge */}
      <div
        className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5"
        style={{
          background: "rgba(10,102,194,.08)",
          borderColor: "rgba(10,102,194,.18)",
          opacity: inView ? 1 : 0,
          transform: inView ? "scale(1)" : "scale(0.7)",
          transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s",
        }}
      >
        <svg width={12} height={12} viewBox="0 0 24 24" fill="#0a66c2">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        <span className="font-mono text-[0.55rem] font-semibold" style={{ color: "#0a66c2" }}>Synced</span>
      </div>
    </div>
  );
}

/* ── Step 2: Preference tags + slider ── */
function VisualPreferences({ accent, inView }: { accent: string; inView: boolean }) {
  const tags = ["Remote", "Full-Time", "$120k+", "SWE"];
  return (
    <div className="relative flex flex-col items-center gap-3 px-4" style={{ minHeight: 150 }}>
      {/* Tags row */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {tags.map((tag, i) => (
          <span
            key={tag}
            className="rounded-full border px-3 py-[4px] font-mono text-[0.6rem] font-semibold"
            style={{
              background: `${accent}0c`,
              borderColor: `${accent}20`,
              color: accent,
              opacity: inView ? 1 : 0,
              animation: inView ? "slideInLeft 0.5s ease forwards" : "none",
              animationDelay: `${0.2 + i * 0.12}s`,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Salary slider */}
      <div className="w-full max-w-[180px]">
        <div className="mb-1 flex justify-between font-mono text-[0.5rem]" style={{ color: "var(--tw-40)" }}>
          <span>$80k</span>
          <span>$200k</span>
        </div>
        <div className="h-[4px] w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.06)" }}>
          <div
            className="h-full rounded-full"
            style={{
              background: accent,
              width: inView ? "62%" : "0%",
              transition: "width 1.2s cubic-bezier(0.16,1,0.3,1) 0.6s",
            }}
          />
        </div>
      </div>

      {/* Company circles */}
      <div className="flex items-center gap-2 mt-1">
        {[
          { l: "G", bg: "linear-gradient(135deg,#4285F4,#34A853)" },
          { l: "S", bg: "linear-gradient(135deg,#635BFF,#A259FF)" },
          { l: "M", bg: "linear-gradient(135deg,#00A4EF,#7FBA00)" },
        ].map((c, i) => (
          <div
            key={c.l}
            className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-[0.55rem] font-bold text-white"
            style={{
              background: c.bg,
              opacity: inView ? 1 : 0,
              animation: inView ? "popIn 0.5s ease forwards" : "none",
              animationDelay: `${0.8 + i * 0.15}s`,
            }}
          >
            {c.l}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Step 3: Paper plane + notification toasts ── */
function VisualApplications({ accent, inView }: { accent: string; inView: boolean }) {
  const toasts = [
    { text: "Application sent!", icon: "✓", color: "var(--accent-green)" },
    { text: "Interview invite", icon: "📅", color: "var(--accent-2)" },
    { text: "Offer received!", icon: "🎉", color: "var(--accent-amber)" },
  ];
  return (
    <div className="relative overflow-hidden" style={{ minHeight: 150 }}>
      {/* Paper plane */}
      <div
        className="absolute top-2 left-4"
        style={{
          opacity: 0,
          animation: inView ? "flyPlane 2.5s ease-in-out 0.3s infinite" : "none",
        }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
      </div>

      {/* Notification toasts */}
      <div className="flex flex-col items-center gap-2 pt-6 px-3">
        {toasts.map((t, i) => (
          <div
            key={t.text}
            className="flex w-full max-w-[200px] items-center gap-2 rounded-lg border px-3 py-2"
            style={{
              background: "rgba(255,255,255,.025)",
              borderColor: "var(--tw-10)",
              opacity: inView ? 1 : 0,
              animation: inView ? "slideNotif 0.6s ease forwards" : "none",
              animationDelay: `${0.4 + i * 0.3}s`,
            }}
          >
            <span className="text-[0.7rem]">{t.icon}</span>
            <span className="font-mono text-[0.6rem] font-medium" style={{ color: t.color }}>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const VISUALS = [VisualResume, VisualPreferences, VisualApplications];

export function HowItWorksSection() {
  return (
    <section id="how" className="scroll-mt-[60px] px-6 py-36">
      <div className="mx-auto max-w-[1100px] text-center">
        <Reveal>
          <div className="mb-6 inline-flex rounded-full px-4 py-1.5 font-display text-[0.7rem] font-semibold uppercase tracking-[.1em]" style={{ background: "rgba(46,196,182,.06)", border: "1px solid rgba(46,196,182,.12)", color: "var(--accent-1-light)" }}>
            How It Works
          </div>
          <h2
            className="mb-4 font-display font-extrabold leading-[1.06] tracking-[-0.045em]"
            style={{ fontSize: "clamp(2.2rem, 4.8vw, 3.6rem)", color: "var(--tw-90)" }}
          >
            From resume to interviews
            <br />
            <span className="gradient-text">in under 3 minutes.</span>
          </h2>
          <p className="mx-auto max-w-[520px] font-display text-[1rem] leading-[1.6]" style={{ color: "var(--tw-40)" }}>
            The average job seeker spends 11 hours a week on applications. ApplyPilot does it in seconds.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-[18px] lg:grid-cols-3">
          {STEPS.map((s, i) => {
            const Visual = VISUALS[i];
            return (
              <StepCard key={s.n} step={s} index={i} Visual={Visual} />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step: s,
  index: i,
  Visual,
}: {
  step: (typeof STEPS)[number];
  index: number;
  Visual: React.ComponentType<{ accent: string; inView: boolean }>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <Reveal delay={i * 0.1} className="h-full">
      <div
        ref={ref}
        className="group relative flex h-full flex-col cursor-default overflow-hidden rounded-[20px] px-8 pb-6 pt-10 text-left transition-all duration-[450ms]"
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--tw-20)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${s.accent}26`;
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--tw-20)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Hover gradient glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-[450ms] group-hover:opacity-100"
          style={{ background: `linear-gradient(160deg, ${s.accent}1a 0%, transparent 60%)` }}
        />

        {/* Top row: number + line + icon */}
        <div className="relative mb-8 flex items-start justify-between">
          <div
            className="font-display text-[5rem] font-extrabold leading-none tracking-[-0.04em]"
            style={{ background: `linear-gradient(180deg, ${s.accent}33, ${s.accent}08)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          >
            {s.n}
          </div>
          <div className="absolute top-[38px] left-[85px] right-14 h-px" style={{ background: "var(--tw-20)" }} />
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-400"
            style={{ background: `${s.accent}0f`, border: `1px solid ${s.accent}1f` }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d={s.iconPath} />
            </svg>
          </div>
        </div>

        <h3 className="relative mb-3.5 font-display text-[1.15rem] font-bold tracking-[-0.02em]" style={{ color: "var(--tw-90)" }}>
          {s.title}
        </h3>
        <p className="relative mb-6 font-display text-[0.9rem] leading-[1.65]" style={{ color: "var(--tw-40)" }}>
          {s.desc}
        </p>

        {/* Visual illustration */}
        <div
          className="relative mt-auto overflow-hidden rounded-xl border border-b-0 rounded-b-none"
          style={{ background: "rgba(255,255,255,.015)", borderColor: "var(--tw-10)" }}
        >
          <Visual accent={s.accent} inView={inView} />
        </div>
      </div>
    </Reveal>
  );
}
