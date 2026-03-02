import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const stats = [
  { value: "147x", label: "Faster than manual applications" },
  { value: "89%", label: "Average match accuracy" },
  { value: "50k+", label: "Applications sent" },
  { value: "3min", label: "Average setup time" },
];

export function Statement() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="relative py-[160px] px-6 text-center overflow-hidden">
      {/* Decorative glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(124,92,252,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10">
        <h2
          data-r
          className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold tracking-[-0.05em] leading-[1.02]"
        >
          The job search is broken.
          <br />
          <span className="gradient-text">We're fixing it.</span>
        </h2>
        <p data-r className="d1 mx-auto mt-6 max-w-[560px] text-[1.1rem] text-text-secondary leading-relaxed">
          Fake listings. AI rejections. Hours wasted on applications no one
          reads. The system wasn't built for you — so we built something better.
        </p>

        <div data-r className="d2 mt-14 flex flex-wrap justify-center gap-x-16 gap-y-8">
          {stats.map((stat) => (
            <div key={stat.value} className="text-center">
              <p className="gradient-text text-[2.5rem] font-extrabold tracking-[-0.04em]">
                {stat.value}
              </p>
              <p className="mt-1 text-[0.78rem] text-text-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
