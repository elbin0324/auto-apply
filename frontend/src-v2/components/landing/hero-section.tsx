import { Link } from "@tanstack/react-router";
import { Reveal } from "./reveal";
import { RadarCanvas } from "./radar-canvas";
import { Plane } from "@/icons";

const STATS = [
  { value: "12,400+", label: "APPS SENT" },
  { value: "94%", label: "ACCURACY" },
  { value: "3.2\u00d7", label: "MORE INTERVIEWS" },
  { value: "<45s", label: "PER APPLICATION" },
];

export function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-bg-deep px-4 pt-[140px] pb-20 md:px-8 lg:px-12">
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          background:
            "linear-gradient(rgba(46,196,182,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(46,196,182,.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: "40%",
          right: "10%",
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(46,196,182,.06) 0%, transparent 60%)",
          transform: "translate(0,-50%)",
        }}
      />

      {/* Radar — hidden below lg */}
      <div className="pointer-events-none absolute top-1/2 right-[4%] hidden -translate-y-1/2 lg:block">
        <RadarCanvas />
      </div>

      {/* Content */}
      <div className="relative z-1 max-w-[640px]">
        <Reveal>
          <div
            className="mb-7 inline-flex items-center gap-2 rounded px-4 py-1.5"
            style={{
              background: "var(--tw-10)",
              border: "1px solid var(--tw-20)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-pri"
              style={{ boxShadow: "0 0 8px rgba(46,196,182,.4)" }}
            />
            <span className="font-mono text-[10px] font-semibold tracking-[.1em] text-pri">
              NOW IN BETA — JOIN THE WAITLIST
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h1
            className="mb-5 font-mono font-bold leading-[1.1] tracking-[-0.03em]"
            style={{
              fontSize: "clamp(36px, 5.5vw, 60px)",
              color: "var(--tw-90)",
            }}
          >
            Your job applications.
            <br />
            <span
              className="text-pri"
              style={{ textShadow: "0 0 40px var(--pri-glow)" }}
            >
              Fully automated.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p
            className="mb-9 max-w-[500px] font-mono text-[13px] leading-[1.9]"
            style={{ color: "var(--tw-40)" }}
          >
            ApplyPilot sends personalized, AI-crafted applications to hundreds
            of roles on your behalf — 24/7, while you sleep. Tailored resumes.
            Custom cover letters. Every ATS handled.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mb-14 flex items-center gap-3.5">
            <Link
              to="/signup"
              className="flex items-center gap-2.5 rounded-lg bg-pri px-[30px] py-[15px] font-mono text-xs font-bold uppercase tracking-[.04em] transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_4px_30px_var(--pri-glow)]"
              style={{ color: "#060d14" }}
            >
              <Plane size={14} color="#060d14" />
              Get Started Free
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-lg px-[26px] py-[15px] font-mono text-xs font-semibold tracking-[.04em] transition-all duration-200"
              style={{
                color: "var(--tw-60)",
                border: "1px solid var(--tw-20)",
              }}
            >
              See How It Works
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="grid grid-cols-2 gap-x-10 gap-y-4 sm:flex sm:gap-10">
            {STATS.map((s) => (
              <div key={s.label}>
                <div
                  className="font-mono text-[22px] font-bold tracking-[-0.02em]"
                  style={{ color: "var(--tw-90)" }}
                >
                  {s.value}
                </div>
                <div
                  className="mt-0.5 font-mono text-[8px] font-bold tracking-[.14em]"
                  style={{ color: "var(--tw-40)" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
