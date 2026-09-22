import { Reveal } from "./reveal";

const TESTIMONIALS = [
  {
    quote: "I applied to 200+ jobs in my first week. ApplyPilot completely transformed my job search. I landed 3 interviews within days.",
    name: "Sarah K.",
    role: "UC Berkeley '25",
    initials: "SK",
    bg: "linear-gradient(135deg,#2ec4b6,#64b5cf)",
  },
  {
    quote: "The AI cover letters are insanely good. Each one felt personal and specific to the role. Recruiters actually complimented them.",
    name: "James M.",
    role: "Georgia Tech '24",
    initials: "JM",
    bg: "linear-gradient(135deg,#50dace,#22d3ee)",
  },
  {
    quote: "I was spending 4 hours a day on applications. Now ApplyPilot handles everything and I just review and approve. Total game changer.",
    name: "Aisha P.",
    role: "NYU '25",
    initials: "AP",
    bg: "linear-gradient(135deg,#34d399,#22d3ee)",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="scroll-mt-[60px] px-6 py-36">
      <div className="mx-auto max-w-[1100px] text-center">
        <Reveal>
          <div className="mb-6 inline-flex rounded-full px-4 py-1.5 font-display text-[0.7rem] font-semibold uppercase tracking-[.1em]" style={{ background: "rgba(46,196,182,.06)", border: "1px solid rgba(46,196,182,.12)", color: "var(--accent-1-light)" }}>
            Testimonials
          </div>
          <h2
            className="mb-4 font-display font-extrabold tracking-[-0.045em]"
            style={{ fontSize: "clamp(2.2rem, 4.8vw, 3.6rem)", color: "var(--tw-90)" }}
          >
            Loved by job seekers.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div
                className="rounded-[20px] border px-9 py-9 text-left transition-all duration-400 hover:-translate-y-0.5 hover:border-[var(--tw-20)]"
                style={{ background: "var(--color-bg-card)", borderColor: "var(--tw-10)" }}
              >
                <div className="mb-5 text-[0.8rem] tracking-[1.5px]" style={{ color: "#fbbf24" }}>★★★★★</div>
                <p className="mb-7 font-display text-[0.92rem] leading-[1.7]" style={{ color: "var(--tw-40)" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full font-display text-[0.7rem] font-bold text-white" style={{ background: t.bg }}>{t.initials}</div>
                  <div>
                    <div className="font-display text-[0.85rem] font-semibold" style={{ color: "var(--tw-90)" }}>{t.name}</div>
                    <div className="font-display text-[0.72rem]" style={{ color: "var(--tw-20)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
