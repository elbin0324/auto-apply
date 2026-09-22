import { Reveal } from "./reveal";

const ITEMS = [
  {
    tag: "🎯 Premium",
    title: "AI Resume Tailoring",
    desc: "Our AI automatically adjusts your resume for each job — optimizing keywords, reordering sections, and highlighting relevant experience.",
  },
  {
    tag: "🎤 Premium",
    title: "AI Interview Prep",
    desc: "Practice with AI mock interviews tailored to the exact role. Get real-time feedback on your answers, delivery, and confidence.",
  },
];

export function ComingSoonSection() {
  return (
    <section className="px-6 py-36">
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <div className="mb-6 inline-flex rounded-full px-4 py-1.5 font-display text-[0.7rem] font-semibold uppercase tracking-[.1em]" style={{ background: "rgba(46,196,182,.06)", border: "1px solid rgba(46,196,182,.12)", color: "var(--accent-1-light)" }}>
            Coming Soon
          </div>
          <h2
            className="mb-4 font-display font-extrabold tracking-[-0.045em]"
            style={{ fontSize: "clamp(2.2rem, 4.8vw, 3.6rem)", color: "var(--tw-90)" }}
          >
            We&apos;re just getting started.
          </h2>
          <p className="max-w-[520px] font-display text-[1rem] leading-[1.6]" style={{ color: "var(--tw-40)" }}>
            Premium features launching soon.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2">
          {ITEMS.map((item, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div
                className="relative overflow-hidden rounded-[20px] border px-10 py-11 transition-all duration-400 hover:border-[var(--tw-20)]"
                style={{ background: "var(--color-bg-card)", borderColor: "var(--tw-10)" }}
              >
                {/* Decorative orb */}
                <div className="pointer-events-none absolute -top-20 -right-20 h-[200px] w-[200px] rounded-full" style={{ background: "rgba(46,196,182,.03)" }} />

                <div className="mb-6 inline-flex gap-1.5 rounded-full border px-3 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-[.06em]" style={{ background: "rgba(46,196,182,.06)", borderColor: "rgba(46,196,182,.12)", color: "var(--accent-1-light)" }}>
                  {item.tag}
                </div>
                <h3 className="mb-3.5 font-display text-[1.3rem] font-bold tracking-[-0.02em]" style={{ color: "var(--tw-90)" }}>{item.title}</h3>
                <p className="font-display text-[0.92rem] leading-[1.65]" style={{ color: "var(--tw-40)" }}>{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
