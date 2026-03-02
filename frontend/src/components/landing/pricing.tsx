import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const proFeatures = [
  "50 applications per billing cycle",
  "AI-powered job matching",
  "AI-generated cover letters",
  "Multi-platform apply (LinkedIn, Indeed, etc.)",
  "Real-time application dashboard",
  "Email notifications and alerts",
];

const eliteFeatures = [
  "100 applications per billing cycle",
  "1-on-1 career coaching session (monthly)",
  "Salary negotiation guide and templates",
  "Priority application processing",
  "Advanced analytics and insights",
  "Resume keyword optimization",
  "Dedicated support channel",
];

const faqs = [
  {
    q: "How does the free trial work?",
    a: "Sign up and get full access to AutoApply Pro for 14 days, completely free. No credit card required. After the trial, choose to continue with Pro or upgrade to Elite.",
  },
  {
    q: "What counts as one application?",
    a: "Each unique job application that AutoApply submits on your behalf counts as one application. Re-submitting to the same job does not count again.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "How does 1-on-1 career coaching work?",
    a: "Elite members get a monthly 30-minute session with a career coach. Sessions cover resume review, interview prep, and career strategy.",
  },
  {
    q: "What happens if I run out of applications?",
    a: "You'll be notified when you're running low. You can wait for your next billing cycle or upgrade to Elite for more applications.",
  },
];

export function Pricing() {
  const ref = useScrollReveal();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const proPrice = annual ? "$624" : "$30";
  const proPer = annual ? "/ year" : "/ 2 weeks";
  const proAfter = annual
    ? "$624/year (~$24/biweekly)"
    : "$30 biweekly";
  const elitePrice = annual ? "$1,040" : "$50";
  const elitePer = annual ? "/ year" : "/ 2 weeks";
  const eliteNote = annual ? "billed annually (~$40/biweekly)" : "";

  return (
    <section id="pricing" ref={ref} className="relative py-[140px] px-6 overflow-hidden">
      {/* Decorative glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(124,92,252,0.06) 0%, transparent 70%)",
          filter: "blur(140px)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1100px] text-center">
        <span data-r className="inline-block rounded-full border border-border-card bg-bg-card px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent-purple-light">
          Pricing
        </span>
        <h2 data-r className="d1 mt-5 text-[clamp(2.2rem,4.8vw,3.6rem)] font-extrabold tracking-[-0.045em] leading-[1.02]">
          Start free.{" "}
          <span className="gradient-text">Scale when ready.</span>
        </h2>
        <p data-r className="d2 mx-auto mt-4 text-[0.92rem] text-text-secondary">
          Your first 2 weeks are completely free. No credit card required.
          Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div data-r className="d3 mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm ${!annual ? "text-text-primary" : "text-text-muted"}`}>
            Biweekly
          </span>
          <button
            type="button"
            onClick={() => setAnnual(!annual)}
            className={`relative h-7 w-[52px] rounded-full transition-colors ${
              annual ? "bg-accent-purple/30" : "bg-border-card"
            }`}
          >
            <span
              className="absolute top-[3.5px] left-[3.5px] h-5 w-5 rounded-full transition-transform"
              style={{
                background: "var(--gradient-primary)",
                transform: annual ? "translateX(24px)" : "translateX(0)",
              }}
            />
          </button>
          <span className={`text-sm ${annual ? "text-text-primary" : "text-text-muted"}`}>
            Annually
          </span>
          {annual && (
            <span className="rounded-full bg-accent-green/15 px-2.5 py-0.5 text-[0.68rem] font-semibold text-accent-green">
              Save 20%
            </span>
          )}
        </div>

        {/* Pricing cards */}
        <div className="mx-auto mt-10 grid max-w-[820px] gap-5 grid-cols-1 md:grid-cols-2">
          {/* Pro */}
          <div data-r className="relative rounded-[20px] border border-border-card bg-bg-card p-8 text-left">
            <span className="absolute top-5 right-5 rounded-full bg-accent-blue/15 px-3 py-0.5 text-[0.62rem] font-semibold text-accent-blue">
              Free Trial
            </span>
            <h3 className="text-lg font-bold text-text-primary">Pro</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[3.2rem] font-extrabold text-text-primary leading-none">
                $0
              </span>
              <span className="text-text-muted line-through">{proPrice}</span>
              <span className="text-sm text-text-muted">{proPer}</span>
            </div>
            <p className="mt-2 text-[0.82rem] text-text-secondary">
              <span className="font-semibold text-accent-green">Free for your first 2 weeks</span>
              {" "}· then {proAfter}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-green/10 px-3 py-1 text-[0.68rem] font-semibold text-accent-green">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
              14-day free trial included
            </div>
            <Link
              to="/signup"
              className="mt-6 flex h-11 w-full items-center justify-center rounded-xl text-[0.88rem] font-bold text-white"
              style={{ background: "var(--gradient-primary)" }}
            >
              Start Free Trial
            </Link>
            <ul className="mt-6 space-y-2.5">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[0.82rem] text-text-secondary">
                  <Check className="h-4 w-4 mt-0.5 shrink-0 text-accent-blue" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Elite */}
          <div data-r className="d1 relative rounded-[20px] border border-border-card bg-linear-to-b from-[#0d0d14] to-[#0f0d18] p-8 text-left">
            <span className="absolute top-5 right-5 rounded-full bg-accent-purple/15 px-3 py-0.5 text-[0.62rem] font-semibold text-accent-purple-light">
              Most Popular
            </span>
            <h3 className="text-lg font-bold text-text-primary">Elite</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[3.2rem] font-extrabold text-text-primary leading-none">
                {elitePrice}
              </span>
              <span className="text-sm text-text-muted">{elitePer}</span>
            </div>
            {eliteNote && (
              <p className="mt-1 text-[0.72rem] text-text-muted">{eliteNote}</p>
            )}
            <Link
              to="/signup"
              className="mt-6 flex h-11 w-full items-center justify-center rounded-xl text-[0.88rem] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7c5cfc, #a78bfa)" }}
            >
              Get Elite
            </Link>
            <ul className="mt-6 space-y-2.5">
              {eliteFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[0.82rem] text-text-secondary">
                  <Check className="h-4 w-4 mt-0.5 shrink-0 text-accent-purple-light" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-20 max-w-[680px] text-left">
          <h3 data-r className="text-lg font-bold text-text-primary text-center mb-6">
            Frequently asked questions
          </h3>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                data-r
                className="rounded-xl border border-border-card bg-bg-card overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-[0.88rem] font-medium text-text-primary">
                    {faq.q}
                  </span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm transition-all ${
                      openFaq === i
                        ? "rotate-45 bg-accent-purple/15 text-accent-purple-light"
                        : "bg-border-card text-text-muted"
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: openFaq === i ? 200 : 0 }}
                >
                  <p className="px-5 pb-4 text-[0.82rem] text-text-secondary leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
