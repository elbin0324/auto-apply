import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export function FinalCta() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="relative py-[180px] px-6 text-center overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10" data-r>
        <h2 className="text-[clamp(2.2rem,4.8vw,3.6rem)] font-extrabold tracking-[-0.045em] leading-[1.02]">
          Ready to land your{" "}
          <span className="gradient-text">dream job?</span>
        </h2>
        <p className="mx-auto mt-5 max-w-[420px] text-[0.92rem] text-text-secondary leading-relaxed">
          Join 50,000+ job seekers who automated their way to interviews.
        </p>
        <Link
          to="/signup"
          className="mt-8 inline-flex items-center gap-2 h-14 px-9 rounded-2xl text-[1rem] font-bold text-white hover:-translate-y-[3px] hover:scale-[1.02] transition-all"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "0 2px 12px rgba(124,92,252,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          Get Started Free
          <ArrowRight className="h-5 w-5" />
        </Link>
        <p className="mt-4 text-[0.72rem] text-text-muted">
          Free for 2 weeks. No credit card required.
        </p>
      </div>
    </section>
  );
}
