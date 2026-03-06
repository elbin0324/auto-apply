import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Zap, MapPin, Briefcase } from "lucide-react";
import { motion } from "motion/react";
import { useMouseTilt } from "@/hooks/use-mouse-tilt";

const jobItems = [
  { company: "Google", role: "Software Engineer Intern", status: "Applied", time: "2s ago", logo: "#4285F4", location: "Mountain View, CA", type: "Hybrid", match: 96 },
  { company: "Stripe", role: "Product Designer", status: "Applied", time: "14s ago", logo: "#635BFF", location: "San Francisco, CA", type: "Remote", match: 92 },
  { company: "Linear", role: "Product Manager", status: "Applying", time: "just now", logo: "#5B68F6", location: "San Francisco, CA", type: "Remote", match: 88 },
  { company: "Figma", role: "UX Researcher", status: "Applied", time: "1m ago", logo: "#F24E1E", location: "New York, NY", type: "Hybrid", match: 85 },
];

const matchItems = [
  { company: "Apple", role: "iOS Engineer", score: 96, logo: "#A2AAAD" },
  { company: "Netflix", role: "Senior Frontend Engineer", score: 94, logo: "#E50914" },
  { company: "Airbnb", role: "Design Engineer", score: 91, logo: "#FF5A5F" },
  { company: "Notion", role: "Full Stack Engineer", score: 89, logo: "#000000" },
];

const interviewItems = [
  { company: "Google", role: "Software Engineer", date: "Mar 4" },
  { company: "Stripe", role: "Product Designer", date: "Mar 6" },
  { company: "Notion", role: "Frontend Engineer", date: "Mar 8" },
  { company: "Linear", role: "Product Manager", date: "Mar 11" },
];

const avatarGradients = [
  "from-accent-purple to-accent-blue",
  "from-pink-500 to-accent-purple",
  "from-accent-green to-accent-cyan",
  "from-amber-400 to-orange-500",
];

type Tab = "applications" | "matches" | "interviews";

const entrance = { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 } };
const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const [activeTab, setActiveTab] = useState<Tab>("applications");
  const { ref: tiltRef, springX, springY, handleMouseMove, handleMouseLeave } = useMouseTilt(6);

  return (
    <section className="relative min-h-[100dvh] px-6 pt-[100px] pb-[80px] overflow-hidden">
      {/* Background glow orbs */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "-15%",
          left: "-10%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "rgba(124,92,252,0.08)",
          filter: "blur(120px)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          bottom: "5%",
          right: "-5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(91,141,255,0.06)",
          filter: "blur(100px)",
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 10, ease: "easeInOut", repeat: Infinity, delay: 3 }}
      />

      <div className="relative z-10 mx-auto max-w-[1280px] grid gap-[60px] grid-cols-1 lg:grid-cols-2 items-center">
        {/* Left column — copy */}
        <div className="text-center lg:text-left">
          <motion.span
            className="inline-flex items-center gap-1.5 rounded-full border border-accent-purple/30 bg-accent-purple/10 px-4 py-1.5 text-[0.72rem] font-semibold text-accent-purple-light"
            {...entrance}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
          >
            <Zap className="h-3.5 w-3.5" />
            AI-Powered Job Applications
          </motion.span>

          <motion.h1
            className="mt-6 text-[clamp(3rem,5.5vw,4.5rem)] font-extrabold tracking-[-0.045em] leading-[1.02]"
            {...entrance}
            transition={{ duration: 0.8, ease, delay: 0.2 }}
          >
            Your Job Application.
            <br />
            <span className="gradient-text">Fully Automated.</span>
          </motion.h1>

          <motion.p
            className="mt-5 max-w-[440px] text-[1.05rem] text-text-secondary leading-relaxed mx-auto lg:mx-0"
            {...entrance}
            transition={{ duration: 0.8, ease, delay: 0.35 }}
          >
            AutoApply finds roles that match your qualifications and sends{" "}
            <span className="font-semibold text-text-primary">personalized</span>,
            AI-crafted applications — 24/7, while you sleep.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start"
            {...entrance}
            transition={{ duration: 0.8, ease, delay: 0.5 }}
          >
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-[0.92rem] font-bold text-white hover:-translate-y-0.5 transition-all"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "0 2px 12px rgba(124,92,252,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-[0.92rem] font-semibold text-text-secondary border border-border-card hover:bg-bg-card-hover hover:border-border-hover hover:-translate-y-0.5 transition-all"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-border-card text-[0.6rem]">
                &#9654;
              </span>
              See How It Works
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            className="mt-8 flex items-center gap-3 justify-center lg:justify-start"
            {...entrance}
            transition={{ duration: 0.8, ease, delay: 0.65 }}
          >
            <div className="flex -space-x-2">
              {avatarGradients.map((g, i) => (
                <div
                  key={i}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg bg-linear-to-br ${g} text-[0.55rem] font-bold text-white`}
                >
                  {["S", "J", "A", "M"][i]}
                </div>
              ))}
            </div>
            <div>
              <span className="text-[#fbbf24] text-[0.72rem]">
                &#9733;&#9733;&#9733;&#9733;&#9733;
              </span>
              <span className="ml-1.5 text-[0.72rem] text-text-muted">
                50,000+ people trust AutoApply
              </span>
            </div>
          </motion.div>
        </div>

        {/* Right column — dashboard preview */}
        <motion.div
          className="flex justify-center lg:justify-end"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.6 }}
        >
          <div className="relative">
            {/* Glow behind card */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)",
                filter: "blur(80px)",
              }}
            />

            <motion.div
              ref={tiltRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                rotateX: springX,
                rotateY: springY,
                perspective: 1200,
                transformStyle: "preserve-3d" as const,
                boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 80px -12px rgba(0,0,0,0.6), 0 0 60px rgba(124,92,252,0.06)",
              }}
              className="relative w-full max-w-[520px] rounded-[20px] border border-border-card bg-bg-card overflow-hidden"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-linear-to-br from-accent-purple to-accent-blue">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[0.78rem] font-semibold text-text-primary">
                    AutoApply
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
                  </span>
                  <span className="text-[0.62rem] font-semibold text-accent-green uppercase tracking-wider">
                    Live
                  </span>
                </div>
              </div>

              {/* Stat tabs */}
              <div className="grid grid-cols-3 border-b border-border-subtle">
                {([
                  { key: "applications" as Tab, label: "Applied Today", value: "47", color: "#5b8dff" },
                  { key: "matches" as Tab, label: "Job Matches", value: "128", color: "#7c5cfc" },
                  { key: "interviews" as Tab, label: "Interviews", value: "6", color: "#34d399" },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-3 px-3 text-center transition-colors ${
                      activeTab === tab.key
                        ? "border-b-2"
                        : "border-b-2 border-transparent"
                    }`}
                    style={{
                      borderColor: activeTab === tab.key ? tab.color : undefined,
                    }}
                  >
                    <p className="text-[0.62rem] text-text-muted uppercase tracking-wider">
                      {tab.label}
                    </p>
                    <p className="mt-0.5 font-mono text-lg font-bold text-text-primary">
                      {tab.value}
                    </p>
                  </button>
                ))}
              </div>

              {/* Progress bar */}
              <div className="px-5 py-3 border-b border-border-subtle">
                <div className="flex items-center justify-between text-[0.68rem]">
                  <span className="text-text-muted">Daily Goal</span>
                  <span className="font-mono text-text-secondary">47 / 50</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-border-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "94%",
                      background: "var(--gradient-primary)",
                      animation: "fill-bar 1.5s var(--ease) 1.4s both",
                    }}
                  />
                </div>
              </div>

              {/* Content area */}
              <div className="px-5 py-3 space-y-2 min-h-[200px]">
                {activeTab === "applications" &&
                  jobItems.map((item) => (
                    <div
                      key={item.role}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-bg-card-hover transition-colors"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-bold text-white"
                        style={{ backgroundColor: item.logo }}
                      >
                        {item.company[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.82rem] font-semibold text-text-primary">
                          {item.role}
                        </p>
                        <div className="flex items-center gap-2 text-[0.65rem] text-text-muted">
                          <span>{item.company}</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {item.location}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Briefcase className="h-2.5 w-2.5" />
                            {item.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-[0.62rem] font-semibold ${
                            item.status === "Applying"
                              ? "text-amber-400"
                              : "text-accent-green"
                          }`}
                        >
                          {item.status}
                        </span>
                        <p className="text-[0.6rem] text-text-muted font-mono">
                          {item.match}% match
                        </p>
                      </div>
                    </div>
                  ))}

                {activeTab === "matches" &&
                  matchItems.map((item) => (
                    <div
                      key={item.role}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-bg-card-hover transition-colors"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-bold text-white"
                        style={{ backgroundColor: item.logo }}
                      >
                        {item.company[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.82rem] font-semibold text-text-primary">
                          {item.role}
                        </p>
                        <p className="text-[0.65rem] text-text-muted">{item.company}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-[50px] h-1 rounded-full bg-border-subtle overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.score}%`,
                              background: item.score >= 90 ? "#34d399" : "#5b8dff",
                            }}
                          />
                        </div>
                        <span className="font-mono text-[0.68rem] font-semibold text-text-primary">
                          {item.score}%
                        </span>
                      </div>
                    </div>
                  ))}

                {activeTab === "interviews" &&
                  interviewItems.map((item) => (
                    <div
                      key={item.role}
                      className="flex items-center gap-3 rounded-lg p-2"
                    >
                      <span className="inline-flex items-center justify-center rounded-md bg-accent-blue/10 px-2 py-1 font-mono text-[0.62rem] font-medium text-accent-blue">
                        {item.date}
                      </span>
                      <div>
                        <p className="text-[0.82rem] font-semibold text-text-primary">
                          {item.role}
                        </p>
                        <p className="text-[0.7rem] text-text-muted">
                          {item.company}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Notification toast */}
              <motion.div
                className="mx-5 mb-4 flex items-center gap-2.5 rounded-xl bg-bg-card-hover border border-border-hover p-3"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease, delay: 2 }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-accent-purple to-accent-blue text-[0.6rem] font-bold text-white">
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.72rem] font-semibold text-text-primary">
                    New match found!
                  </p>
                  <p className="text-[0.62rem] text-text-muted">
                    Apple — iOS Engineer · 96% fit score
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
