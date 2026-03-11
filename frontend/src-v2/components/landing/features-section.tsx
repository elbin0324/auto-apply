import { Reveal } from "./reveal";
import { Target, Layers, Doc, Radar, Shield, Zap } from "@/icons";

const FEATURES = [
  {
    icon: Target,
    title: "SMART MATCHING",
    desc: "AI scores every job against your profile, skills, and experience. Only high-quality matches make the cut — no spray and pray.",
    accent: "#2ec4b6",
  },
  {
    icon: Layers,
    title: "EVERY ATS, HANDLED",
    desc: "Greenhouse, Lever, Ashby, Workday — we navigate 50+ applicant tracking systems so you never have to fight another form.",
    accent: "#64b5cf",
  },
  {
    icon: Doc,
    title: "TAILORED MATERIALS",
    desc: "Every application gets a custom resume variant and cover letter, calibrated to the specific role's requirements and keywords.",
    accent: "#50dace",
  },
  {
    icon: Radar,
    title: "REAL-TIME TRACKING",
    desc: "See exactly where every application stands — from submitted to interview. A live dashboard for your entire job search.",
    accent: "#e0a850",
  },
  {
    icon: Shield,
    title: "UNDETECTABLE",
    desc: "Cloud browsers with human-like behavior, anti-fingerprinting, and CAPTCHA handling. Applications that look like you sent them yourself.",
    accent: "#d06060",
  },
  {
    icon: Zap,
    title: "APPLY AT SCALE",
    desc: "Queue dozens of applications and let ApplyPilot work through them while you focus on prep, networking, or literally anything else.",
    accent: "#2ec4b6",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-[60px] px-4 py-20 md:px-8 lg:px-12"
      style={{ background: "#0c1520" }}
    >
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <div className="mb-14 text-center">
            <span className="mb-2.5 block font-mono text-[10px] font-bold uppercase tracking-[.16em] text-pri-dim">
              {"// FEATURES"}
            </span>
            <h2
              className="font-mono text-[26px] font-bold tracking-[-0.02em]"
              style={{ color: "var(--tw-90)" }}
            >
              Everything you need to get hired faster
            </h2>
            <p className="mx-auto mt-2.5 max-w-[480px] font-mono text-[11px] leading-[1.7] text-t-400">
              Powered by AI. Designed for humans.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div
                className="group relative h-full cursor-default overflow-hidden rounded-xl px-6 py-7 transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,.2)]"
                style={{
                  background: "#111c2a",
                  border: "1px solid #1e2e3e",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = f.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1e2e3e";
                }}
              >
                {/* Top accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 opacity-50"
                  style={{ background: f.accent }}
                />

                {/* Icon */}
                <div
                  className="mb-4.5 flex h-9 w-9 items-center justify-center rounded-lg bg-bg-deep"
                  style={{ border: "1px solid var(--tw-20)" }}
                >
                  <f.icon size={16} color={f.accent} />
                </div>

                <h3
                  className="mb-2 font-mono text-[11px] font-bold tracking-[.08em]"
                  style={{ color: "var(--tw-90)" }}
                >
                  {f.title}
                </h3>
                <p className="font-mono text-[11px] leading-[1.7] text-t-500">
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
