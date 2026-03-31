import { Link } from "@tanstack/react-router";
import { Reveal } from "./reveal";
import { Check } from "@/icons";

const PLANS = [
  {
    name: "STARTER",
    price: "$19",
    desc: "For getting started.",
    features: [
      "25 applications / month",
      "AI resume tailoring",
      "All ATS platforms",
      "Application tracking",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "PRO",
    price: "$49",
    desc: "For active job seekers.",
    features: [
      "100 applications / month",
      "AI resume + cover letters",
      "All ATS platforms",
      "Priority processing",
      "Analytics dashboard",
    ],
    cta: "Get Started",
    featured: true,
  },
  {
    name: "PREMIUM",
    price: "$99",
    desc: "Maximum firepower.",
    features: [
      "500 applications / month",
      "Everything in Pro",
      "Dedicated infrastructure",
      "Priority support",
      "Early access to features",
    ],
    cta: "Go Premium",
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-[60px] px-4 py-20 md:px-8 lg:px-12"
      style={{ background: "#0c1520" }}
    >
      <div className="mx-auto max-w-[960px]">
        <Reveal>
          <div className="mb-14 text-center">
            <span className="mb-2.5 block font-mono text-[10px] font-bold uppercase tracking-[.16em] text-pri-dim">
              {"// PRICING"}
            </span>
            <h2
              className="font-mono text-[26px] font-bold tracking-[-0.02em]"
              style={{ color: "var(--tw-90)" }}
            >
              Simple pricing. Cancel anytime.
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div
                className="relative flex h-full flex-col rounded-xl px-6 py-8"
                style={{
                  background: "#111c2a",
                  border: p.featured
                    ? "2px solid #2ec4b6"
                    : "1px solid #1e2e3e",
                  boxShadow: p.featured
                    ? "0 0 40px var(--pri-glow)"
                    : "none",
                }}
              >
                {p.featured && (
                  <div
                    className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded bg-pri px-3.5 py-0.5 font-mono text-[9px] font-bold tracking-[.12em]"
                    style={{ color: "#060d14" }}
                  >
                    RECOMMENDED
                  </div>
                )}

                <div className="mb-2 font-mono text-[10px] font-bold tracking-[.12em] text-pri-dim">
                  {p.name}
                </div>

                <div className="mb-1 font-mono text-[34px] font-bold" style={{ color: "var(--tw-90)" }}>
                  {p.price}
                  {p.price !== "Free" && (
                    <span className="text-[13px] font-normal text-t-400">
                      /mo
                    </span>
                  )}
                </div>

                <div className="mb-6 font-mono text-[11px] text-t-400">
                  {p.desc}
                </div>

                <div className="mb-6 flex-1">
                  {p.features.map((feat, j) => (
                    <div
                      key={j}
                      className="flex items-center gap-2 py-1.5"
                      style={{ borderBottom: "1px solid #1e2e3e" }}
                    >
                      <Check size={11} color="#1a9a8e" />
                      <span className="font-mono text-[11px] text-t-700">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/signup"
                  className="block w-full rounded-[6px] py-3.5 text-center font-mono text-[11px] font-bold uppercase tracking-[.06em] transition-all duration-200"
                  style={{
                    background: p.featured ? "#2ec4b6" : "transparent",
                    color: p.featured ? "#060d14" : "var(--tw-60)",
                    border: p.featured ? "none" : "1px solid #1e2e3e",
                  }}
                >
                  {p.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
