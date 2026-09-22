import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Reveal } from "./reveal";
import { Arrow } from "@/icons";
import { PricingFaq } from "./pricing-faq";

type Billing = "biweekly" | "annual";

const PRICING: Record<Billing, { proOld: string; proPrice: string; proPeriod: string; proThen: string; elitePrice: string; elitePeriod: string; eliteBilling: string }> = {
  biweekly: { proOld: "$30", proPrice: "0", proPeriod: "/ 2 weeks", proThen: "$30 biweekly", elitePrice: "50", elitePeriod: "/ 2 weeks", eliteBilling: "$50 every 2 weeks" },
  annual: { proOld: "$624", proPrice: "0", proPeriod: "/ year", proThen: "$624/year (~$24/biweekly)", elitePrice: "1,040", elitePeriod: "/ year", eliteBilling: "$1,040 per year (~$40/biweekly)" },
};

const PRO_FEATURES = [
  "50 applications per billing cycle",
  "AI-powered job matching",
  "AI-generated cover letters",
  "Multi-platform apply (LinkedIn, Indeed, etc.)",
  "Real-time application dashboard",
  "Email notifications & alerts",
];

const ELITE_FEATURES = [
  "100 applications per billing cycle",
  "1-on-1 career coaching session (monthly)",
  "Salary negotiation guide & templates",
  "Priority application processing",
  "Advanced analytics & insights",
  "Resume keyword optimization",
  "Dedicated support channel",
];

export function PricingSection() {
  const [billing, setBilling] = useState<Billing>("biweekly");
  const p = PRICING[billing];

  return (
    <section id="pricing" className="relative scroll-mt-[60px] overflow-hidden px-6 py-36 text-center">
      {/* Glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2" style={{ width: 700, height: 500, borderRadius: "50%", background: "rgba(46,196,182,.05)", filter: "blur(140px)" }} />

      <div className="relative z-2">
        <Reveal>
          <div className="mb-6 inline-flex rounded-full px-4 py-1.5 font-display text-[0.7rem] font-semibold uppercase tracking-[.1em]" style={{ background: "rgba(46,196,182,.06)", border: "1px solid rgba(46,196,182,.12)", color: "var(--accent-1-light)" }}>
            Pricing
          </div>
          <h2
            className="mb-4 font-display font-extrabold leading-[1.06] tracking-[-0.045em]"
            style={{ fontSize: "clamp(2.2rem, 4.8vw, 3.6rem)", color: "var(--tw-90)" }}
          >
            Start free. <span className="gradient-text">Scale when ready.</span>
          </h2>
          <p className="mx-auto max-w-[520px] font-display text-[1rem] leading-[1.6]" style={{ color: "var(--tw-40)" }}>
            Your first 2 weeks are completely free. No credit card required. Cancel anytime.
          </p>
        </Reveal>

        {/* Toggle */}
        <Reveal delay={0.1}>
          <div className="mb-16 mt-8 flex items-center justify-center gap-4">
            <span className={`cursor-pointer font-display text-[0.88rem] font-medium transition-colors duration-300 ${billing === "biweekly" ? "text-t-900" : ""}`} style={{ color: billing === "biweekly" ? "var(--tw-90)" : "var(--tw-20)" }} onClick={() => setBilling("biweekly")}>Biweekly</span>
            <button
              onClick={() => setBilling(billing === "biweekly" ? "annual" : "biweekly")}
              className="relative h-7 w-[52px] cursor-pointer rounded-full border transition-all duration-300"
              style={{
                background: billing === "annual" ? "rgba(46,196,182,.08)" : "rgba(255,255,255,.06)",
                borderColor: billing === "annual" ? "rgba(46,196,182,.15)" : "var(--tw-20)",
              }}
            >
              <div
                className="absolute top-[3px] left-[3px] h-5 w-5 rounded-full transition-transform duration-350"
                style={{
                  background: "var(--gradient-btn)",
                  boxShadow: "0 2px 8px rgba(46,196,182,.3)",
                  transform: billing === "annual" ? "translateX(24px)" : "translateX(0)",
                }}
              />
            </button>
            <span className={`cursor-pointer font-display text-[0.88rem] font-medium transition-colors duration-300`} style={{ color: billing === "annual" ? "var(--tw-90)" : "var(--tw-20)" }} onClick={() => setBilling("annual")}>
              Annually
              <span className="ml-1.5 inline-flex rounded-full px-2.5 py-[3px] font-display text-[0.65rem] font-semibold" style={{ background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.12)", color: "var(--accent-green)" }}>Save 20%</span>
            </span>
          </div>
        </Reveal>

        {/* Cards */}
        <div className="mx-auto grid max-w-[820px] grid-cols-1 gap-5 md:grid-cols-2">
          {/* Pro */}
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border px-10 py-11 text-left transition-all duration-500 hover:-translate-y-1.5 hover:border-[var(--tw-20)]" style={{ background: "var(--color-bg-card)", borderColor: "var(--tw-20)" }}>
              <div className="absolute top-5 right-5 rounded-full border px-3.5 py-1 font-display text-[0.62rem] font-bold uppercase tracking-[.08em]" style={{ background: "rgba(91,141,255,.08)", borderColor: "rgba(91,141,255,.12)", color: "var(--accent-2)" }}>Free Trial</div>
              <div className="mb-1.5 font-display text-[1.1rem] font-bold tracking-[-0.02em]" style={{ color: "var(--tw-90)" }}>Pro</div>
              <div className="mb-7 font-display text-[0.82rem] leading-[1.5]" style={{ color: "var(--tw-20)" }}>Everything you need to automate your job search and start landing interviews.</div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[1.3rem] font-bold line-through" style={{ color: "var(--tw-20)", textDecorationColor: "rgba(255,255,255,.2)" }}>{p.proOld}</span>
                  <span className="font-mono text-[3.2rem] font-extrabold tracking-[-0.04em] leading-none" style={{ color: "var(--tw-90)" }}>
                    <span className="text-[1.2rem] font-semibold align-super" style={{ color: "var(--tw-40)" }}>$</span>{p.proPrice}
                  </span>
                  <span className="mb-1 self-end font-display text-[0.82rem] font-medium" style={{ color: "var(--tw-20)" }}>{p.proPeriod}</span>
                </div>
                <div className="mt-2 font-display text-[0.75rem] leading-[1.5]" style={{ color: "var(--tw-20)" }}>
                  <strong style={{ color: "var(--accent-green)" }}>Free for your first 2 weeks</strong> · then {p.proThen}
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-display text-[0.72rem] font-semibold" style={{ background: "rgba(52,211,153,.06)", borderColor: "rgba(52,211,153,.12)", color: "var(--accent-green)" }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent-green)" }} />
                  14-day free trial included
                </div>
              </div>

              <Link to="/signup" className="mb-8 flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] font-display text-[0.92rem] font-semibold text-white no-underline transition-all duration-350 hover:-translate-y-0.5" style={{ background: "var(--gradient-btn)", boxShadow: "0 2px 16px rgba(46,196,182,.25), inset 0 1px 0 rgba(255,255,255,.1)" }}>
                Start Free Trial <Arrow size={16} color="#fff" />
              </Link>

              <div className="mb-7 h-px" style={{ background: "var(--tw-10)" }} />
              <div className="mb-[18px] font-display text-[0.65rem] font-semibold uppercase tracking-[.1em]" style={{ color: "var(--tw-20)" }}>What&apos;s included</div>
              <ul className="flex list-none flex-col gap-3.5">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 font-display text-[0.88rem] leading-[1.5]" style={{ color: "var(--tw-40)" }}>
                    <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[0.6rem] font-bold" style={{ background: "rgba(91,141,255,.1)", color: "var(--accent-2)" }}>✓</span>
                    <span dangerouslySetInnerHTML={{ __html: f.replace(/^(\d+ applications)/, '<strong style="color:var(--tw-90);font-weight:600">$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Elite */}
          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl border px-10 py-11 text-left transition-all duration-500 hover:-translate-y-1.5" style={{ background: "linear-gradient(170deg, #0d0d14, #0f0d18)", borderColor: "rgba(46,196,182,.18)" }}>
              {/* Gradient overlay */}
              <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(170deg, rgba(46,196,182,.04), transparent 50%)" }} />

              <div className="absolute top-5 right-5 rounded-full border px-3.5 py-1 font-display text-[0.62rem] font-bold uppercase tracking-[.08em]" style={{ background: "rgba(46,196,182,.08)", borderColor: "rgba(46,196,182,.12)", color: "var(--accent-1-light)" }}>Most Popular</div>
              <div className="relative mb-1.5 font-display text-[1.1rem] font-bold tracking-[-0.02em]" style={{ color: "var(--tw-90)" }}>Elite</div>
              <div className="relative mb-7 font-display text-[0.82rem] leading-[1.5]" style={{ color: "var(--tw-20)" }}>For serious job seekers who want every possible advantage to land their dream role.</div>

              <div className="relative mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[3.2rem] font-extrabold tracking-[-0.04em] leading-none" style={{ color: "var(--tw-90)" }}>
                    <span className="text-[1.2rem] font-semibold align-super" style={{ color: "var(--tw-40)" }}>$</span>{p.elitePrice}
                  </span>
                  <span className="mb-1 self-end font-display text-[0.82rem] font-medium" style={{ color: "var(--tw-20)" }}>{p.elitePeriod}</span>
                </div>
                <div className="mt-2 font-display text-[0.75rem]" style={{ color: "var(--tw-20)" }}>Billed {p.eliteBilling}</div>
              </div>

              <Link to="/signup" className="relative mb-8 flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] font-display text-[0.92rem] font-semibold text-white no-underline transition-all duration-350 hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #2ec4b6, #50dace)", boxShadow: "0 2px 16px rgba(46,196,182,.3), inset 0 1px 0 rgba(255,255,255,.15)" }}>
                Get Elite <Arrow size={16} color="#fff" />
              </Link>

              <div className="relative mb-7 h-px" style={{ background: "var(--tw-10)" }} />
              <div className="relative mb-[18px] font-display text-[0.65rem] font-semibold uppercase tracking-[.1em]" style={{ color: "var(--tw-20)" }}>Everything in Pro, plus</div>
              <ul className="relative flex list-none flex-col gap-3.5">
                {ELITE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 font-display text-[0.88rem] leading-[1.5]" style={{ color: "var(--tw-40)" }}>
                    <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[0.6rem] font-bold" style={{ background: "rgba(46,196,182,.1)", color: "var(--accent-1-light)" }}>✓</span>
                    <span dangerouslySetInnerHTML={{ __html: f.replace(/^(\d+ applications|1-on-1 career coaching|Salary negotiation guide)/, '<strong style="color:var(--tw-90);font-weight:600">$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <PricingFaq />
      </div>
    </section>
  );
}
