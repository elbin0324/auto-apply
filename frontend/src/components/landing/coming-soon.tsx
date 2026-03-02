import { Lock } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const cards = [
  {
    title: "AI Resume Tailoring.",
    desc: "Our AI automatically adjusts your resume for each job — optimizing keywords, reordering sections, and highlighting relevant experience.",
  },
  {
    title: "AI Interview Prep.",
    desc: "Practice with AI mock interviews tailored to the exact role. Get real-time feedback on your answers, delivery, and confidence.",
  },
];

export function ComingSoon() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="py-[140px] px-6">
      <div className="mx-auto max-w-[1100px] text-center">
        <span data-r className="inline-block rounded-full border border-border-card bg-bg-card px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent-purple-light">
          Coming Soon
        </span>
        <h2 data-r className="d1 mt-5 text-[clamp(2.2rem,4.8vw,3.6rem)] font-extrabold tracking-[-0.045em] leading-[1.02]">
          We're just getting started.
        </h2>
        <p data-r className="d2 mx-auto mt-4 text-[0.92rem] text-text-secondary">
          Premium features launching soon.
        </p>

        <div className="mt-16 grid gap-4 grid-cols-1 md:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.title}
              data-r
              className="relative overflow-hidden rounded-[20px] border border-border-card bg-bg-card p-9 text-left"
            >
              {/* Decorative glow */}
              <div
                className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(124,92,252,0.03) 0%, transparent 70%)",
                  filter: "blur(40px)",
                }}
              />

              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-purple/20 bg-accent-purple/10 px-3 py-1 text-[0.68rem] font-semibold text-accent-purple-light">
                  <Lock className="h-3 w-3" />
                  Premium
                </span>
                <h3 className="mt-4 text-[1.3rem] font-bold text-text-primary">
                  {card.title}
                </h3>
                <p className="mt-2 text-[0.88rem] text-text-secondary leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
