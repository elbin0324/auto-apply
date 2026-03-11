import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const testimonials = [
  {
    stars: 5,
    quote:
      "I applied to 200+ jobs in my first week. AutoApply completely transformed my job search. I landed 3 interviews within days.",
    name: "Sarah K.",
    subtitle: "UC Berkeley '25",
    initials: "SK",
    gradient: "from-accent-purple to-accent-blue",
  },
  {
    stars: 5,
    quote:
      "The AI cover letters are insanely good. Each one felt personal and specific to the role. Recruiters actually complimented them.",
    name: "James M.",
    subtitle: "Georgia Tech '24",
    initials: "JM",
    gradient: "from-pink-500 to-accent-purple",
  },
  {
    stars: 5,
    quote:
      "I was spending 4 hours a day on applications. Now AutoApply handles everything and I just review and approve. Total game changer.",
    name: "Aisha P.",
    subtitle: "NYU '25",
    initials: "AP",
    gradient: "from-accent-green to-accent-cyan",
  },
];

export function Testimonials() {
  const ref = useScrollReveal();

  return (
    <section id="testimonials" ref={ref} className="py-[140px] px-6">
      <div className="mx-auto max-w-[1100px] text-center">
        <span data-r className="inline-block rounded-full border border-border-card bg-bg-card px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent-purple-light">
          Testimonials
        </span>
        <h2 data-r className="d1 mt-5 text-[clamp(2.2rem,4.8vw,3.6rem)] font-extrabold tracking-[-0.045em] leading-[1.02]">
          Loved by job seekers.
        </h2>

        <div className="mt-16 grid gap-4 grid-cols-1 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              data-r
              className="rounded-[20px] border border-border-card bg-bg-card p-9 text-left hover:-translate-y-0.5 hover:border-border-hover transition-all duration-300"
            >
              <div className="flex gap-0.5 text-[#fbbf24]">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i}>&#9733;</span>
                ))}
              </div>
              <p className="mt-4 text-[0.92rem] text-text-secondary leading-relaxed">
                "{t.quote}"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br ${t.gradient} text-[0.7rem] font-bold text-white`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {t.name}
                  </p>
                  <p className="text-[0.72rem] text-text-muted">
                    {t.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
