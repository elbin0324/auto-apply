import { Reveal } from "./reveal";

const STATS = [
  { value: "147x", label: "Faster than manual applications" },
  { value: "89%", label: "Average match accuracy" },
  { value: "50k+", label: "Applications sent" },
  { value: "3min", label: "Average setup time" },
];

export function StatementSection() {
  return (
    <section className="relative overflow-hidden px-6 py-40 text-center">
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 800, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(46,196,182,.06), transparent 70%)",
        }}
      />

      <div className="relative z-2">
        <Reveal>
          <h2
            className="mx-auto mb-7 font-display font-extrabold leading-[1.05] tracking-[-0.05em]"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", color: "var(--tw-90)", maxWidth: 800 }}
          >
            The job search is broken.
            <br />
            <span className="gradient-text">We&apos;re fixing it.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mb-14 max-w-[560px] font-display text-[1.1rem] leading-[1.6]" style={{ color: "var(--tw-40)" }}>
            Fake listings. AI rejections. Hours wasted on applications no one reads. The system wasn&apos;t built for you — so we built something better.
          </p>
        </Reveal>

        <div className="flex flex-wrap justify-center gap-16">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <div className="text-center">
                <div className="gradient-text font-display text-[2.5rem] font-extrabold tracking-[-0.04em]">
                  {s.value}
                </div>
                <div className="mt-1 font-display text-[0.78rem]" style={{ color: "var(--tw-20)" }}>
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
