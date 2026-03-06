import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Zap, MapPin, Briefcase } from "lucide-react";
import { motion } from "motion/react";
import { useMouseTilt } from "@/hooks/use-mouse-tilt";

const jobItems = [
  { company: "Google", domain: "google.com", role: "Software Engineer Intern", status: "Applied" as const, location: "Mountain View, CA", type: "Hybrid", match: 96 },
  { company: "Stripe", domain: "stripe.com", role: "Product Designer", status: "Applied" as const, location: "San Francisco, CA", type: "Remote", match: 92 },
  { company: "Linear", domain: "linear.app", role: "Product Manager", status: "Applying" as const, location: "San Francisco, CA", type: "Remote", match: 88 },
  { company: "Figma", domain: "figma.com", role: "UX Researcher", status: "Applied" as const, location: "New York, NY", type: "Hybrid", match: 85 },
];

const matchItems = [
  { company: "Apple", domain: "apple.com", role: "iOS Engineer", score: 96, location: "Cupertino, CA", type: "On-site" },
  { company: "Netflix", domain: "netflix.com", role: "Senior Frontend Engineer", score: 94, location: "Los Gatos, CA", type: "Remote" },
  { company: "Airbnb", domain: "airbnb.com", role: "Design Engineer", score: 91, location: "San Francisco, CA", type: "Hybrid" },
  { company: "Notion", domain: "notion.so", role: "Full Stack Engineer", score: 89, location: "New York, NY", type: "Remote" },
];

const interviewItems = [
  { company: "Google", domain: "google.com", role: "Software Engineer", date: "Mar 4", round: "Technical" },
  { company: "Stripe", domain: "stripe.com", role: "Product Designer", date: "Mar 6", round: "Portfolio" },
  { company: "Notion", domain: "notion.so", role: "Frontend Engineer", date: "Mar 8", round: "On-site" },
  { company: "Linear", domain: "linear.app", role: "Product Manager", date: "Mar 11", round: "Final" },
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

function LogoImg({ domain, company }: { domain: string; company: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-border-card text-[0.6rem] font-bold text-text-primary">
        {company[0]}
      </div>
    );
  }
  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={company}
      className="h-8 w-8 shrink-0 rounded-lg bg-border-card object-contain"
      onError={() => setErr(true)}
    />
  );
}

export function Hero() {
  const [activeTab, setActiveTab] = useState<Tab>("applications");
  const [entranceDone, setEntranceDone] = useState(false);
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

      <div className="relative z-10 mx-auto max-w-[1280px] flex flex-col items-center gap-[60px]">
        {/* Centered copy block */}
        <div className="text-center max-w-[640px]">
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
            className="mt-5 max-w-[440px] text-[1.05rem] text-text-secondary leading-relaxed mx-auto"
            {...entrance}
            transition={{ duration: 0.8, ease, delay: 0.35 }}
          >
            AutoApply finds roles that match your qualifications and sends{" "}
            <span className="font-semibold text-text-primary">personalized</span>,
            AI-crafted applications — 24/7, while you sleep.
          </motion.p>

          <motion.div
            className="mt-8 flex justify-center"
            {...entrance}
            transition={{ duration: 0.8, ease, delay: 0.5 }}
          >
            <Link
              to="/signup"
              className="relative inline-flex items-center gap-2 h-14 px-10 rounded-2xl text-[1.05rem] font-bold text-white hover:-translate-y-0.5 transition-all overflow-hidden"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "0 2px 20px rgba(124,92,252,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
              <span
                className="shimmer-sweep absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                  animation: "btn-shimmer 2.5s ease-in-out infinite",
                }}
              />
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            className="mt-8 flex items-center gap-3 justify-center"
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

        {/* Dashboard preview — wide, centered, 3D entrance */}
        <motion.div
          className="w-[900px] max-w-full"
          initial={{ rotateX: 12, rotateY: -6, rotateZ: 1.5, scale: 0.92, y: 80, opacity: 0 }}
          animate={{ rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
          onAnimationComplete={() => setEntranceDone(true)}
          style={{ perspective: 1200 }}
        >
          <div className="relative">
            {/* Glow behind card */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)",
                filter: "blur(80px)",
              }}
            />

            {/* Gradient border wrapper */}
            <div
              className="relative rounded-[21px] p-px"
              style={{
                background: "linear-gradient(180deg, rgba(124,92,252,0.15), rgba(91,141,255,0.08), rgba(255,255,255,0.03))",
              }}
            >
              <motion.div
                ref={tiltRef}
                onMouseMove={entranceDone ? handleMouseMove : undefined}
                onMouseLeave={entranceDone ? handleMouseLeave : undefined}
                style={{
                  rotateX: springX,
                  rotateY: springY,
                  perspective: 1200,
                  transformStyle: "preserve-3d" as const,
                  boxShadow: "0 24px 80px -12px rgba(0,0,0,0.6), 0 0 60px rgba(124,92,252,0.06)",
                }}
                className="relative rounded-[20px] bg-bg-card overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
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
                <div className="px-6 py-3 border-b border-border-subtle">
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
                <div className="px-6 py-4 space-y-2 min-h-[240px]">
                  {activeTab === "applications" &&
                    jobItems.map((item) => (
                      <div
                        key={item.role}
                        className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-bg-card-hover/60 transition-colors"
                      >
                        <LogoImg domain={item.domain} company={item.company} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.82rem] font-semibold text-text-primary">
                            {item.role}
                          </p>
                          <div className="flex items-center gap-2 text-[0.65rem] text-text-muted">
                            <span className="font-medium">{item.company}</span>
                            <span className="text-border-hover">|</span>
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
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.62rem] font-semibold ${
                              item.status === "Applying"
                                ? "bg-amber-400/10 text-amber-400"
                                : "bg-accent-green/10 text-accent-green"
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="font-mono text-[0.68rem] text-text-muted">
                            {item.match}%
                          </span>
                        </div>
                      </div>
                    ))}

                  {activeTab === "matches" &&
                    matchItems.map((item) => (
                      <div
                        key={item.role}
                        className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-bg-card-hover/60 transition-colors"
                      >
                        <LogoImg domain={item.domain} company={item.company} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.82rem] font-semibold text-text-primary">
                            {item.role}
                          </p>
                          <div className="flex items-center gap-2 text-[0.65rem] text-text-muted">
                            <span className="font-medium">{item.company}</span>
                            <span className="text-border-hover">|</span>
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
                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="w-[60px] h-1.5 rounded-full bg-border-subtle overflow-hidden">
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
                        className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-bg-card-hover/60 transition-colors"
                      >
                        <LogoImg domain={item.domain} company={item.company} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.82rem] font-semibold text-text-primary">
                            {item.role}
                          </p>
                          <p className="text-[0.65rem] text-text-muted">
                            {item.company} · {item.round}
                          </p>
                        </div>
                        <span className="inline-flex items-center justify-center rounded-lg bg-accent-blue/10 px-2.5 py-1 font-mono text-[0.62rem] font-medium text-accent-blue shrink-0">
                          {item.date}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Notification toast */}
                <motion.div
                  className="mx-6 mb-4 flex items-center gap-3 rounded-xl bg-bg-card-hover border border-border-hover p-3"
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease, delay: 2.5 }}
                >
                  <LogoImg domain="apple.com" company="Apple" />
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
          </div>
        </motion.div>
      </div>
    </section>
  );
}
