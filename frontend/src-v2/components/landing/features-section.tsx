import { Reveal } from "./reveal";
import { FeatJobMatching } from "./feat-job-matching";
import { FeatCoverLetters } from "./feat-cover-letters";
import { FeatMultiPlatform } from "./feat-multi-platform";
import { FeatTracking } from "./feat-tracking";

interface FeatureCard {
  tag: string;
  tagBg: string;
  tagBorder: string;
  tagColor: string;
  title: string;
  desc: string;
  ui: React.ReactNode;
}

const FEATURES: FeatureCard[] = [
  {
    tag: "🎯 Matching Engine",
    tagBg: "rgba(100,181,207,.08)",
    tagBorder: "rgba(100,181,207,.12)",
    tagColor: "var(--accent-2)",
    title: "Smart Job Matching",
    desc: "Our AI scores every listing against your profile in real-time. Focus only on roles that actually match your skills, experience, and salary expectations.",
    ui: <FeatJobMatching />,
  },
  {
    tag: "✏️ AI Writer",
    tagBg: "rgba(46,196,182,.08)",
    tagBorder: "rgba(46,196,182,.12)",
    tagColor: "var(--accent-1-light)",
    title: "AI Cover Letters",
    desc: "Unique, personalized cover letters for every application. Written by AI, indistinguishable from human-crafted.",
    ui: <FeatCoverLetters />,
  },
  {
    tag: "🔗 Integrations",
    tagBg: "rgba(52,211,153,.08)",
    tagBorder: "rgba(52,211,153,.12)",
    tagColor: "var(--accent-green)",
    title: "Multi-Platform Apply",
    desc: "Submit across all major platforms simultaneously. One click, every job board.",
    ui: <FeatMultiPlatform />,
  },
  {
    tag: "📊 Analytics",
    tagBg: "rgba(251,191,36,.08)",
    tagBorder: "rgba(251,191,36,.12)",
    tagColor: "var(--accent-amber)",
    title: "Application Tracking Dashboard",
    desc: "Track every application from submitted to interview. Visualize your pipeline, response rates, and progress in real-time.",
    ui: <FeatTracking />,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-[60px] px-6 py-36">
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <div className="mb-6 inline-flex rounded-full px-4 py-1.5 font-display text-[0.7rem] font-semibold uppercase tracking-[.1em]" style={{ background: "rgba(46,196,182,.06)", border: "1px solid rgba(46,196,182,.12)", color: "var(--accent-1-light)" }}>
            Features
          </div>
          <h2
            className="mb-4 font-display font-extrabold leading-[1.06] tracking-[-0.045em]"
            style={{ fontSize: "clamp(2.2rem, 4.8vw, 3.6rem)", color: "var(--tw-90)" }}
          >
            Everything you need
            <br />
            <span className="gradient-text">to get hired faster.</span>
          </h2>
          <p className="max-w-[520px] font-display text-[1rem] leading-[1.6]" style={{ color: "var(--tw-40)" }}>
            Powered by AI. Designed for humans.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 0.08} className="h-full">
              <div
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border transition-all duration-400 hover:-translate-y-1 hover:border-[var(--tw-20)]"
                style={{
                  background: "var(--color-bg-card)",
                  borderColor: "var(--tw-10)",
                }}
              >
                {/* Text content */}
                <div className="px-10 pt-10">
                  <span
                    className="mb-[18px] inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-[0.62rem] font-semibold uppercase tracking-[.08em]"
                    style={{ background: f.tagBg, border: `1px solid ${f.tagBorder}`, color: f.tagColor }}
                  >
                    {f.tag}
                  </span>
                  <h3 className="mb-2.5 font-display text-[1.3rem] font-bold tracking-[-0.02em]" style={{ color: "var(--tw-90)" }}>{f.title}</h3>
                  <p className="max-w-[440px] font-display text-[0.9rem] leading-[1.6]" style={{ color: "var(--tw-40)" }}>{f.desc}</p>
                </div>

                {/* Mockup UI area */}
                <div
                  className="relative mx-10 mt-auto overflow-hidden rounded-t-2xl border border-b-0 pt-7"
                  style={{ background: "rgba(255,255,255,.01)", borderColor: "var(--tw-10)", minHeight: 220 }}
                >
                  {f.ui}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
