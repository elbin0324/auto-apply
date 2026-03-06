import { Upload, Search, CheckCircle } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Animated Illustrations ──────────────────────── */

function UploadAnimation() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const tags = ["React", "Python", "Design", "SQL", "AWS"];

  return (
    <div ref={ref} className="relative flex items-center justify-center h-[140px] overflow-hidden">
      {/* Document icon */}
      <motion.div
        className="relative flex h-16 w-12 items-center justify-center rounded-lg border border-border-card bg-bg-card-hover"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <div className="space-y-1">
          {[70, 85, 55].map((w, i) => (
            <div key={i} className="h-1 rounded-full bg-white/[0.06]" style={{ width: `${w}%`, marginLeft: 6, marginRight: 6, minWidth: 16 }} />
          ))}
        </div>
        {/* Upload arrow */}
        <motion.div
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-blue text-white"
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }}
        >
          <Upload className="h-2.5 w-2.5" />
        </motion.div>
      </motion.div>

      {/* Floating skill tags */}
      {tags.map((tag, i) => {
        const positions = [
          { x: -60, y: -30 },
          { x: 55, y: -35 },
          { x: -50, y: 30 },
          { x: 60, y: 25 },
          { x: 0, y: -50 },
        ];
        const pos = positions[i];
        return (
          <motion.span
            key={tag}
            className="absolute rounded-full bg-accent-purple/10 border border-accent-purple/20 px-2 py-0.5 text-[0.58rem] font-medium text-accent-purple-light"
            style={{ left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)` }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.5 + i * 0.1 }}
          >
            {tag}
          </motion.span>
        );
      })}
    </div>
  );
}

function MatchAnimation() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const rows = [
    { score: 96, w: "92%" },
    { score: 91, w: "85%" },
    { score: 87, w: "78%" },
    { score: 82, w: "70%" },
  ];

  return (
    <div ref={ref} className="relative h-[140px] overflow-hidden px-4 flex flex-col justify-center gap-2">
      {rows.map((row, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, ease, delay: 0.2 + i * 0.1 }}
        >
          <div className="h-1.5 flex-1 rounded-full bg-border-subtle overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: row.score >= 90 ? "#34d399" : row.score >= 85 ? "#5b8dff" : "#8a8a9a" }}
              initial={{ width: 0 }}
              animate={inView ? { width: row.w } : {}}
              transition={{ duration: 0.8, ease, delay: 0.4 + i * 0.1 }}
            />
          </div>
          <motion.span
            className="font-mono text-[0.68rem] font-semibold text-text-primary w-8 text-right"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
          >
            {row.score}%
          </motion.span>
        </motion.div>
      ))}

      {/* Scanning beam */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(124,92,252,0.4), transparent)" }}
        animate={{ top: ["10%", "90%", "10%"] }}
        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  );
}

function InterviewAnimation() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const cells = Array.from({ length: 10 }, (_, i) => i);
  const highlighted = [2, 5, 8];

  return (
    <div ref={ref} className="h-[140px] flex items-center justify-center px-4">
      <div className="grid grid-cols-5 gap-1.5">
        {cells.map((i) => {
          const isHighlighted = highlighted.includes(i);
          return (
            <motion.div
              key={i}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-[0.65rem] font-medium ${
                isHighlighted
                  ? "border-2 border-accent-green/40 bg-accent-green/10 text-accent-green"
                  : "border border-border-subtle bg-bg-card-hover text-text-muted"
              }`}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            >
              {isHighlighted ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={inView ? { scale: 1 } : {}}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.6 + highlighted.indexOf(i) * 0.15 }}
                >
                  &#10003;
                </motion.span>
              ) : (
                <span>{i + 3}</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Steps Data ──────────────────────── */

const steps = [
  {
    num: "01",
    icon: Upload,
    color: "#5b8dff",
    title: "Upload Your Resume.",
    desc: "Drop your resume and tell us your preferences. Our AI analyzes your skills, experience, and goals in seconds.",
    Illustration: UploadAnimation,
  },
  {
    num: "02",
    icon: Search,
    color: "#7c5cfc",
    title: "AI Matches & Applies.",
    desc: "AutoApply scans thousands of listings, finds the best matches, and submits personalized applications with tailored cover letters.",
    Illustration: MatchAnimation,
  },
  {
    num: "03",
    icon: CheckCircle,
    color: "#22d3ee",
    title: "Land Interviews.",
    desc: "Track every application in real-time. Get notified when employers respond. Focus on prepping while we handle the rest.",
    Illustration: InterviewAnimation,
  },
];

/* ── Section Component ──────────────────────── */

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="how-it-works" ref={ref} className="py-[140px] px-6">
      <div className="mx-auto max-w-[1100px] text-center">
        <motion.span
          className="inline-block rounded-full border border-border-card bg-bg-card px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent-purple-light"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
        >
          How It Works
        </motion.span>
        <motion.h2
          className="mt-5 text-[clamp(2.2rem,4.8vw,3.6rem)] font-extrabold tracking-[-0.045em] leading-[1.02]"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
        >
          From resume to interviews{" "}
          <span className="gradient-text">in under 3 minutes.</span>
        </motion.h2>
        <motion.p
          className="mx-auto mt-4 max-w-[520px] text-[0.92rem] text-text-secondary leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
        >
          The average job seeker spends 11 hours a week on applications.
          AutoApply does it in seconds.
        </motion.p>

        <div className="mt-16 grid gap-[18px] grid-cols-1 lg:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="group rounded-[20px] border border-border-card bg-bg-card text-left hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-all duration-500 overflow-hidden"
              style={{ ["--step-color" as string]: step.color }}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease, delay: 0.3 + i * 0.15 }}
            >
              {/* Illustration */}
              <div className="border-b border-border-subtle bg-bg/30">
                <step.Illustration />
              </div>

              <div className="p-10 pt-6">
                <p
                  className="text-[5rem] font-extrabold leading-none"
                  style={{
                    background: `linear-gradient(180deg, ${step.color}33 0%, ${step.color}08 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {step.num}
                </p>
                <div
                  className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${step.color}15` }}
                >
                  <step.icon className="h-5 w-5" style={{ color: step.color }} />
                </div>
                <h3 className="mt-4 text-[1.15rem] font-bold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 text-[0.88rem] text-text-secondary leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
