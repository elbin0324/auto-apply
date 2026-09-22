import { Link } from "@tanstack/react-router";
import { ApplyPilotMark, Arrow, Play } from "@/icons";
import { HeroDashboard } from "./hero-dashboard";

const AVATARS = [
  { initial: "A", bg: "linear-gradient(135deg,#2ec4b6,#64b5cf)" },
  { initial: "S", bg: "linear-gradient(135deg,#34d399,#22d3ee)" },
  { initial: "J", bg: "linear-gradient(135deg,#f59e0b,#ef4444)" },
  { initial: "M", bg: "linear-gradient(135deg,#ec4899,#a78bfa)" },
];

/* Floating particles — small glowing dots scattered across hero */
const PARTICLES = [
  { top: "12%", left: "8%", size: 3, delay: 0, duration: 6 },
  { top: "28%", left: "85%", size: 2, delay: 2, duration: 8 },
  { top: "65%", left: "15%", size: 2.5, delay: 1.5, duration: 7 },
  { top: "78%", left: "72%", size: 2, delay: 3, duration: 9 },
  { top: "45%", left: "92%", size: 3, delay: 0.5, duration: 6.5 },
  { top: "18%", left: "55%", size: 2, delay: 4, duration: 8 },
  { top: "88%", left: "40%", size: 2.5, delay: 2.5, duration: 7.5 },
];

export function HeroSection() {
  return (
    <section id="top" className="relative flex min-h-dvh items-center overflow-hidden px-[clamp(24px,5vw,80px)] pt-[100px] pb-20">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Aurora gradient mesh — slow-shifting multi-color glow */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 25% 40%, rgba(46,196,182,.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 75% 60%, rgba(100,181,207,.05) 0%, transparent 55%), radial-gradient(ellipse 40% 40% at 50% 30%, rgba(34,211,238,.04) 0%, transparent 50%)",
            backgroundSize: "200% 200%",
            animation: "auroraShift 15s ease-in-out infinite",
          }}
        />

        {/* Primary glow orb — upper left */}
        <div
          className="absolute animate-glow-pulse"
          style={{
            width: 800, height: 800, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(46,196,182,.1) 0%, rgba(46,196,182,.03) 40%, transparent 70%)",
            filter: "blur(80px)",
            top: "-20%", left: "-15%",
          }}
        />

        {/* Secondary glow orb — lower right */}
        <div
          className="absolute"
          style={{
            width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(100,181,207,.08) 0%, rgba(100,181,207,.02) 40%, transparent 70%)",
            filter: "blur(80px)",
            bottom: "-10%", right: "5%",
            animation: "glowPulse 10s ease-in-out infinite 3s",
          }}
        />

        {/* Third glow orb — center cyan for depth */}
        <div
          className="absolute"
          style={{
            width: 400, height: 400, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,211,238,.06) 0%, transparent 60%)",
            filter: "blur(100px)",
            top: "30%", left: "45%",
            animation: "glowPulse 12s ease-in-out infinite 5s",
          }}
        />

        {/* Vertical light beam from top center */}
        <div
          className="absolute left-1/2 top-0"
          style={{
            width: 2, height: "50%",
            background: "linear-gradient(to bottom, rgba(46,196,182,.12), rgba(46,196,182,.02) 60%, transparent)",
            transform: "translateX(-50%)",
            opacity: 0,
            animation: "lightBeamIn 2s ease-out 0.3s forwards",
          }}
        />
        {/* Light beam glow (wider, softer) */}
        <div
          className="absolute left-1/2 top-0"
          style={{
            width: 120, height: "45%",
            background: "linear-gradient(to bottom, rgba(46,196,182,.04), transparent 70%)",
            transform: "translateX(-50%)",
            filter: "blur(40px)",
            opacity: 0,
            animation: "lightBeamIn 2.5s ease-out 0.5s forwards",
          }}
        />

        {/* Grid overlay — subtle texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.012) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(ellipse at 30% 50%, black 15%, transparent 60%)",
            WebkitMaskImage: "radial-gradient(ellipse at 30% 50%, black 15%, transparent 60%)",
          }}
        />

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size, height: p.size,
              top: p.top, left: p.left,
              background: "rgba(46,196,182,.35)",
              boxShadow: "0 0 6px rgba(46,196,182,.2)",
              animation: `floatY ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              opacity: 0.2,
            }}
          />
        ))}
      </div>

      {/* Two-column layout */}
      <div className="relative z-2 mx-auto grid w-full max-w-[1280px] items-center gap-[60px] lg:grid-cols-2">
        {/* Left — Text */}
        <div className="max-w-[560px] lg:max-w-none">
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-[0.78rem] font-medium opacity-0"
            style={{
              background: "rgba(46,196,182,.08)",
              border: "1px solid rgba(46,196,182,.15)",
              color: "var(--accent-1-light)",
              animation: "heroTextReveal .9s cubic-bezier(0.16,1,0.3,1) .15s forwards",
            }}
          >
            <span className="relative flex h-[22px] w-[22px] items-center justify-center rounded-md bg-pri">
              <ApplyPilotMark size={11} color="#fff" />
              {/* Pulse ring behind icon */}
              <span
                className="pointer-events-none absolute inset-0 rounded-md"
                style={{
                  border: "1px solid rgba(46,196,182,.4)",
                  animation: "pulseRing 2s ease-out 0.8s",
                  opacity: 0,
                }}
              />
            </span>
            AI-Powered Job Applications
          </div>

          <h1
            className="mb-6 font-display font-extrabold leading-[1.02] tracking-[-0.045em] opacity-0"
            style={{
              fontSize: "clamp(3rem, 5.5vw, 4.5rem)",
              color: "var(--tw-90)",
              animation: "heroTextReveal .9s cubic-bezier(0.16,1,0.3,1) .35s forwards",
            }}
          >
            Your Job Application.
            <br />
            <span className="gradient-text">Fully Automated.</span>
          </h1>

          <p
            className="mb-10 max-w-[440px] font-display text-[1.05rem] font-normal leading-[1.65] opacity-0"
            style={{
              color: "var(--tw-40)",
              animation: "heroTextReveal .9s cubic-bezier(0.16,1,0.3,1) .55s forwards",
            }}
          >
            ApplyPilot sends personalized, AI-crafted applications to hundreds of roles on your behalf — 24/7, while you sleep.
          </p>

          <div
            className="mb-10 flex flex-wrap gap-3.5 opacity-0"
            style={{ animation: "heroTextReveal .9s cubic-bezier(0.16,1,0.3,1) .75s forwards" }}
          >
            <Link
              to="/signup"
              className="group/btn relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-xl px-7 font-display text-[0.92rem] font-semibold text-white no-underline transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]"
              style={{
                background: "var(--gradient-btn)",
                boxShadow: "0 2px 12px rgba(46,196,182,.25), inset 0 1px 0 rgba(255,255,255,.1)",
              }}
            >
              {/* Shimmer sweep on hover */}
              <span
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent)",
                  animation: "shimmerSweep 1.2s ease-in-out infinite",
                }}
              />
              <span className="relative">Get Started Free</span>
              <Arrow size={16} color="#fff" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-12 items-center gap-2.5 rounded-xl px-6 font-display text-[0.88rem] font-medium no-underline transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white/6"
              style={{
                color: "var(--tw-90)",
                border: "1px solid var(--tw-20)",
                background: "rgba(255,255,255,.03)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full border"
                style={{ background: "rgba(255,255,255,.08)", borderColor: "var(--tw-20)" }}
              >
                <Play size={10} color="#fff" />
              </span>
              See How It Works
            </a>
          </div>

          <div
            className="flex items-center gap-3.5 opacity-0"
            style={{ animation: "heroTextReveal .9s cubic-bezier(0.16,1,0.3,1) .95s forwards" }}
          >
            <div className="flex">
              {AVATARS.map((a, i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 font-display text-[0.6rem] font-bold text-white"
                  style={{
                    background: a.bg,
                    borderColor: "var(--color-bg-deep)",
                    marginLeft: i > 0 ? -8 : 0,
                    opacity: 0,
                    animation: `popIn 0.5s ease forwards`,
                    animationDelay: `${0.95 + i * 0.08}s`,
                  }}
                >
                  {a.initial}
                </div>
              ))}
            </div>
            <div>
              <div className="text-[0.75rem] tracking-wide" style={{ color: "#fbbf24" }}>★★★★★</div>
              <div className="font-display text-[0.78rem]" style={{ color: "var(--tw-20)" }}>
                <strong className="font-semibold" style={{ color: "var(--tw-40)" }}>50,000+</strong> people trust ApplyPilot
              </div>
            </div>
          </div>
        </div>

        {/* Right — Dashboard */}
        <div className="hidden justify-center lg:flex">
          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}
