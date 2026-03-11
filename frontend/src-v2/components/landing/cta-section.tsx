import { Link } from "@tanstack/react-router";
import { Reveal } from "./reveal";
import { Arrow } from "@/icons";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-bg-deep px-4 py-20 text-center md:px-8 lg:px-12">
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(46,196,182,.06) 0%, transparent 70%)",
        }}
      />

      <Reveal>
        <div className="relative z-1">
          <h2
            className="mb-3 font-mono text-[30px] font-bold tracking-[-0.02em]"
            style={{ color: "var(--tw-90)" }}
          >
            The job search is broken.
            <br />
            We&apos;re fixing it.
          </h2>
          <p
            className="mx-auto mb-9 max-w-[460px] font-mono text-xs leading-[1.8]"
            style={{ color: "var(--tw-40)" }}
          >
            Stop spending hours filling out the same forms. Let AI handle the
            busywork while you focus on what actually matters — preparing for
            interviews.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2.5 rounded-lg bg-pri px-9 py-4 font-mono text-[13px] font-bold uppercase tracking-[.04em] transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_4px_40px_var(--pri-glow)]"
            style={{ color: "#060d14" }}
          >
            Get Started Free
            <Arrow size={14} color="#060d14" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
