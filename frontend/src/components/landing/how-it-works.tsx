import { Upload, Search, CheckCircle } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const steps = [
  {
    num: "01",
    icon: Upload,
    color: "#5b8dff",
    title: "Upload Your Resume.",
    desc: "Drop your resume and tell us your preferences. Our AI analyzes your skills, experience, and goals in seconds.",
  },
  {
    num: "02",
    icon: Search,
    color: "#7c5cfc",
    title: "AI Matches & Applies.",
    desc: "AutoApply scans thousands of listings, finds the best matches, and submits personalized applications with tailored cover letters.",
  },
  {
    num: "03",
    icon: CheckCircle,
    color: "#22d3ee",
    title: "Land Interviews.",
    desc: "Track every application in real-time. Get notified when employers respond. Focus on prepping while we handle the rest.",
  },
];

export function HowItWorks() {
  const ref = useScrollReveal();

  return (
    <section id="how-it-works" ref={ref} className="py-[140px] px-6">
      <div className="mx-auto max-w-[1100px] text-center">
        <span data-r className="inline-block rounded-full border border-border-card bg-bg-card px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent-purple-light">
          How It Works
        </span>
        <h2 data-r className="d1 mt-5 text-[clamp(2.2rem,4.8vw,3.6rem)] font-extrabold tracking-[-0.045em] leading-[1.02]">
          From resume to interviews{" "}
          <span className="gradient-text">in under 3 minutes.</span>
        </h2>
        <p data-r className="d2 mx-auto mt-4 max-w-[520px] text-[0.92rem] text-text-secondary leading-relaxed">
          The average job seeker spends 11 hours a week on applications.
          AutoApply does it in seconds.
        </p>

        <div className="mt-16 grid gap-[18px] grid-cols-1 lg:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.num}
              data-r
              className="group rounded-[20px] border border-border-card bg-bg-card p-10 text-left hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-all duration-500"
              style={{
                ["--step-color" as string]: step.color,
              }}
            >
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
          ))}
        </div>
      </div>
    </section>
  );
}
