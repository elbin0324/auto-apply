import { Reveal } from "./reveal";
import { ApplyPilotMark, Doc, Gauge, Target } from "@/icons";

const STEPS = [
  {
    n: "01",
    title: "UPLOAD YOUR RESUME",
    desc: "Drop your PDF. Our AI reads it and builds your profile automatically — experience, skills, everything.",
    icon: Doc,
  },
  {
    n: "02",
    title: "SET YOUR CRITERIA",
    desc: "Tell us what you want: job titles, locations, salary range, companies to avoid. Pick your comfort level — review each app or go fully automatic.",
    icon: Gauge,
  },
  {
    n: "03",
    title: "HIT LAUNCH",
    desc: "ApplyPilot finds matching roles, tailors your resume for each one, fills out the application, and submits. All while you do something better with your time.",
    icon: ApplyPilotMark,
  },
  {
    n: "04",
    title: "LAND INTERVIEWS",
    desc: "Track every application in real-time. Review AI-generated answers before they send. Watch your response rate climb.",
    icon: Target,
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-[60px] bg-bg-deep px-4 py-20 md:px-8 lg:px-12"
    >
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-12"
        style={{
          background:
            "linear-gradient(rgba(46,196,182,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(46,196,182,.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-1 mx-auto max-w-[900px]">
        <Reveal>
          <div className="mb-14 text-center">
            <span className="mb-2.5 block font-mono text-[10px] font-bold uppercase tracking-[.16em] text-pri">
              {"// HOW IT WORKS"}
            </span>
            <h2
              className="font-mono text-[26px] font-bold tracking-[-0.02em]"
              style={{ color: "var(--tw-90)" }}
            >
              From resume to interview in four steps
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div
                className="h-full rounded-xl p-4 text-center lg:px-4 lg:py-7"
                style={{
                  background: "var(--tw-10)",
                  border: "1px solid var(--tw-10)",
                }}
              >
                <div
                  className="mb-3.5 font-mono text-[28px] font-bold"
                  style={{ color: "var(--tw-20)" }}
                >
                  {s.n}
                </div>
                <div
                  className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-[10px]"
                  style={{
                    background: "var(--pri-bg)",
                    border: "1px solid var(--pri-border)",
                  }}
                >
                  <s.icon size={18} color="#2ec4b6" />
                </div>
                <h3
                  className="mb-2 font-mono text-[10px] font-bold tracking-[.08em]"
                  style={{ color: "var(--tw-90)" }}
                >
                  {s.title}
                </h3>
                <p
                  className="font-mono text-[10px] leading-[1.8]"
                  style={{ color: "var(--tw-40)" }}
                >
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
