import { useState } from "react";

const FAQS = [
  {
    q: "How does the free trial work?",
    a: "When you sign up for Pro, your first 2 weeks are completely free. No credit card required upfront. After the trial, your subscription begins at $30 biweekly. You can cancel anytime before the trial ends.",
  },
  {
    q: "What counts as one application?",
    a: "Each unique job listing that ApplyPilot submits on your behalf counts as one application. This includes the tailored cover letter and all required form fields. Saved drafts don't count toward your limit.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Yes. You can upgrade from Pro to Elite at any time, and the price difference will be prorated. You can also downgrade at the end of your current billing cycle.",
  },
  {
    q: "How does 1-on-1 career coaching work?",
    a: "Elite members get a monthly 30-minute session with a professional career coach. They'll review your profile, refine your strategy, and help with interview preparation and salary negotiation.",
  },
  {
    q: "What happens if I run out of applications?",
    a: "Your application count resets at the start of each billing cycle. If you need more, upgrade to Elite for a higher limit, or wait for the next cycle. We'll notify you when you're close to your limit.",
  },
];

export function PricingFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="mx-auto mt-20 max-w-[680px] text-left">
      <h3 className="mb-12 text-center font-display text-[1.5rem] font-bold tracking-[-0.03em]" style={{ color: "var(--tw-90)" }}>
        Frequently asked questions
      </h3>
      {FAQS.map((faq, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} style={{ borderBottom: "1px solid var(--tw-10)" }}>
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent py-[22px] font-display text-[0.92rem] font-semibold transition-colors duration-200 hover:text-[var(--accent-1-light)]"
              style={{ color: "var(--tw-90)" }}
            >
              <span>{faq.q}</span>
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-display text-[0.7rem] transition-all duration-300"
                style={{
                  background: isOpen ? "rgba(46,196,182,.06)" : "rgba(255,255,255,.03)",
                  borderColor: isOpen ? "rgba(46,196,182,.12)" : "var(--tw-10)",
                  color: isOpen ? "var(--accent-1-light)" : "var(--tw-20)",
                  transform: isOpen ? "rotate(45deg)" : "rotate(0)",
                }}
              >
                +
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-400"
              style={{
                maxHeight: isOpen ? 200 : 0,
                paddingBottom: isOpen ? 22 : 0,
              }}
            >
              <p className="font-display text-[0.88rem] leading-[1.65]" style={{ color: "var(--tw-40)" }}>{faq.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
