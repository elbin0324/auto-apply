import { Link } from "@tanstack/react-router";
import { Reveal } from "./reveal";
import { Arrow } from "@/icons";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden px-6 py-[180px] text-center">
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(46,196,182,.1), transparent 70%)",
        }}
      />

      <Reveal>
        <div className="relative z-2">
          <h2
            className="mb-5 font-display font-extrabold leading-[1.05] tracking-[-0.045em]"
            style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)", color: "var(--tw-90)" }}
          >
            Stop Applying.
            <br />
            <span className="gradient-text">Start AutoApplying.</span>
          </h2>
          <p className="mx-auto mb-11 max-w-[420px] font-display text-[1.05rem] leading-[1.6]" style={{ color: "var(--tw-40)" }}>
            Join thousands who automated their job search. Free to start.
          </p>
          <Link
            to="/signup"
            className="inline-flex h-14 items-center gap-2.5 rounded-[14px] px-9 font-display text-[1rem] font-semibold text-white no-underline transition-all duration-350 hover:-translate-y-0.5"
            style={{
              background: "var(--gradient-btn)",
              boxShadow: "0 4px 20px rgba(46,196,182,.3), inset 0 1px 0 rgba(255,255,255,.1)",
            }}
          >
            Get Started Free
            <Arrow size={18} color="#fff" />
          </Link>
          <div className="mt-[18px] font-display text-[0.72rem]" style={{ color: "var(--tw-20)" }}>
            Free trial · 25 applications/month · No credit card
          </div>
        </div>
      </Reveal>
    </section>
  );
}
