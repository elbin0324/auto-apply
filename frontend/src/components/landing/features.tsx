import { useState, useRef } from "react";
import { motion, useInView } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Feature 1: Smart Job Matching ───────── */
const matchJobs = [
  { company: "Google", role: "SWE Intern", score: 96, color: "#4285F4" },
  { company: "Stripe", role: "Product Designer", score: 92, color: "#635BFF" },
  { company: "Linear", role: "Product Manager", score: 88, color: "#5B68F6" },
  { company: "Figma", role: "UX Researcher", score: 85, color: "#F24E1E" },
];

function MatchDemo() {
  return (
    <div className="space-y-2 p-4">
      {matchJobs.map((job) => (
        <div key={job.role} className="flex items-center gap-3 rounded-lg bg-bg/30 p-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-bold text-white"
            style={{ backgroundColor: job.color }}
          >
            {job.company[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.82rem] font-semibold text-text-primary">{job.role}</p>
            <p className="text-[0.68rem] text-text-muted">{job.company}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-[60px] h-1 rounded-full bg-border-subtle overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${job.score}%`,
                  background: job.score >= 90 ? "#34d399" : job.score >= 85 ? "#5b8dff" : "#8a8a9a",
                }}
              />
            </div>
            <span className="font-mono text-[0.72rem] font-semibold text-text-primary">
              {job.score}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Feature 2: AI Cover Letters ───────── */
function CoverLetterDemo() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-purple/20 text-[0.55rem] font-bold text-accent-purple-light">
          AI
        </div>
        <div>
          <p className="text-[0.72rem] font-semibold text-text-primary">Writing for Stripe...</p>
          <p className="text-[0.6rem] text-text-muted">Product Designer · San Francisco</p>
        </div>
        <span className="ml-auto rounded-md bg-accent-purple/15 px-2 py-0.5 text-[0.58rem] font-semibold text-accent-purple-light">
          AI Draft
        </span>
      </div>
      <div className="space-y-1.5">
        {[75, 100, 60, 85, 45, 90].map((w, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full ${i === 3 ? "bg-linear-to-r from-accent-purple/15 to-accent-blue/15" : "bg-white/[0.03]"}`}
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
      <p className="mt-3 text-[0.78rem] italic text-text-secondary leading-relaxed">
        "Having led cross-functional design sprints at my previous role, I'm
        particularly drawn to Stripe's..."
        <span
          className="inline-block w-0.5 h-4 bg-accent-purple ml-0.5 align-middle"
          style={{ animation: "blink-cursor 1s step-end infinite" }}
        />
      </p>
    </div>
  );
}

/* ── Feature 3: AI Application Questions ───────── */
const appQuestions = [
  {
    q: "Why are you interested in this role at Stripe?",
    a: "My experience building payment infrastructure at scale directly aligns with Stripe's mission to increase the GDP of the internet...",
    done: true,
  },
  {
    q: "Describe a challenging project you led.",
    a: "I led the migration of our monolithic checkout system to a microservices architecture, reducing latency by 40%...",
    done: true,
  },
  {
    q: "What's your approach to cross-functional collaboration?",
    a: "",
    done: false,
  },
];

function ApplicationQuestionsDemo() {
  return (
    <div className="space-y-3 p-4">
      {appQuestions.map((item, i) => (
        <div key={i} className="rounded-lg bg-bg/30 p-3">
          <p className="text-[0.75rem] font-semibold text-text-primary">{item.q}</p>
          {item.done ? (
            <div className="mt-1.5 flex items-start gap-2">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-green/20 mt-0.5">
                <span className="text-[0.5rem] text-accent-green">&#10003;</span>
              </div>
              <p className="text-[0.7rem] italic text-text-secondary leading-relaxed">{item.a}</p>
            </div>
          ) : (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-purple/20 text-[0.45rem] font-bold text-accent-purple-light">
                AI
              </div>
              <span className="text-[0.7rem] text-text-muted">Generating answer</span>
              <span
                className="inline-block w-0.5 h-3.5 bg-accent-purple"
                style={{ animation: "blink-cursor 1s step-end infinite" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Feature 4: Analytics Dashboard ───────── */
const analyticsTabs = ["Overview", "Applications", "Analytics"] as const;

const applicationItems = [
  { role: "Software Engineer", company: "Google", status: "Sent" },
  { role: "Product Designer", company: "Stripe", status: "Interview" },
  { role: "Product Manager", company: "Linear", status: "Sent" },
  { role: "UX Researcher", company: "Figma", status: "Reviewing" },
  { role: "Frontend Engineer", company: "Notion", status: "Sent" },
];

function AnalyticsDemo() {
  const [tab, setTab] = useState<string>("Overview");

  return (
    <div className="p-4">
      <div className="flex gap-1 mb-4">
        {analyticsTabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-[0.72rem] font-medium transition-colors ${
              tab === t
                ? "bg-accent-purple/15 text-accent-purple-light"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="flex items-end gap-1" style={{ height: 100 }}>
          {[35, 55, 70, 45, 80, 65, 90, 50, 75, 60, 85, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                minWidth: 6,
                height: h,
                background: "linear-gradient(180deg, rgba(124,92,252,0.6) 0%, rgba(124,92,252,0.15) 100%)",
              }}
            />
          ))}
        </div>
      )}

      {tab === "Applications" && (
        <div className="space-y-1.5">
          {applicationItems.map((item) => (
            <div key={item.role} className="flex items-center justify-between rounded-lg bg-bg/30 p-2">
              <div>
                <p className="text-[0.78rem] font-medium text-text-primary">{item.role}</p>
                <p className="text-[0.62rem] text-text-muted">{item.company}</p>
              </div>
              <span className={`text-[0.62rem] font-semibold ${
                item.status === "Interview" ? "text-accent-green" : item.status === "Reviewing" ? "text-amber-400" : "text-accent-blue"
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "Analytics" && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total Applied", value: "147", change: "+23% this week", color: "text-accent-green" },
            { label: "Response Rate", value: "12.4%", change: "+3.1% vs avg", color: "text-accent-blue" },
            { label: "Avg Response", value: "4.2 days", change: "-1.5 days faster", color: "text-accent-cyan" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-bg/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-text-primary">{stat.value}</p>
              <p className="text-[0.6rem] text-text-muted mt-0.5">{stat.label}</p>
              <p className={`text-[0.58rem] font-medium mt-1 ${stat.color}`}>{stat.change}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Features section ───────── */
const features = [
  {
    tag: "AI Matching",
    tagColor: "#5b8dff",
    title: "Smart Job Matching.",
    desc: "Our AI analyzes thousands of listings and ranks them by fit score. You only see what matters.",
    demo: MatchDemo,
    span: false,
  },
  {
    tag: "AI Writer",
    tagColor: "#7c5cfc",
    title: "AI Cover Letters.",
    desc: "Every application gets a unique, role-specific cover letter. Written by AI, indistinguishable from human.",
    demo: CoverLetterDemo,
    span: false,
  },
  {
    tag: "AI Answers",
    tagColor: "#34d399",
    title: "AI Application Questions.",
    desc: "Our AI reads each application's questions and generates personalized answers from your resume and experience.",
    demo: ApplicationQuestionsDemo,
    span: false,
  },
  {
    tag: "Analytics",
    tagColor: "#fbbf24",
    title: "Application Tracking Dashboard.",
    desc: "Track every application from submitted to interview. Visualize your pipeline, response rates, and progress in real-time.",
    demo: AnalyticsDemo,
    span: false,
  },
];

export function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="features" ref={ref} className="py-[140px] px-6">
      <div className="mx-auto max-w-[1100px]">
        <motion.span
          className="inline-block rounded-full border border-border-card bg-bg-card px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent-purple-light"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
        >
          Features
        </motion.span>
        <motion.h2
          className="mt-5 text-[clamp(2.2rem,4.8vw,3.6rem)] font-extrabold tracking-[-0.045em] leading-[1.02]"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
        >
          Everything you need<br />
          <span className="gradient-text">to get hired faster.</span>
        </motion.h2>
        <motion.p
          className="mt-4 text-[0.92rem] text-text-secondary leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
        >
          Powered by AI. Designed for humans.
        </motion.p>

        <div className="mt-16 grid gap-4 grid-cols-1 lg:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group relative flex flex-col rounded-[20px] border border-border-card bg-bg-card text-left overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-border-hover hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5),0_0_40px_rgba(124,92,252,0.06)]"
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease, delay: 0.2 + i * 0.15 }}
            >
              {/* Hover gradient overlay */}
              <div
                className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(135deg, ${f.tagColor}0a 0%, transparent 50%)`,
                }}
              />
              <div className="relative z-[1] p-8 pb-4">
                <span
                  className="inline-block rounded-md px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wider"
                  style={{
                    color: f.tagColor,
                    backgroundColor: `${f.tagColor}15`,
                  }}
                >
                  {f.tag}
                </span>
                <h3 className="mt-3 text-[1.3rem] font-bold text-text-primary">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[0.88rem] text-text-secondary leading-relaxed max-w-[500px]">
                  {f.desc}
                </p>
              </div>
              <div className="relative z-[1] mt-auto border-t border-border-subtle bg-bg/30">
                <f.demo />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
