import { ApplyPilotMark } from "@/icons";

const PRODUCT_LINKS = ["Features", "Pricing", "Dashboard", "Integrations"];
const COMPANY_LINKS = ["About", "Blog", "Careers", "Press"];
const LEGAL_LINKS = ["Privacy", "Terms", "Cookies", "Contact"];

export function LandingFooter() {
  return (
    <footer className="px-6 pt-16 pb-8" style={{ background: "var(--color-bg-deep)", borderTop: "1px solid var(--tw-10)" }}>
      <div className="mx-auto max-w-[1100px]">
        {/* Grid */}
        <div className="mb-12 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-pri">
                <ApplyPilotMark size={13} color="#fff" />
              </div>
              <span className="font-display text-[1rem] font-bold" style={{ color: "var(--tw-90)" }}>APPLY<span style={{ color: "var(--color-pri)" }}>PILOT</span></span>
            </div>
            <p className="mt-3 max-w-[250px] font-display text-[0.82rem] leading-[1.6]" style={{ color: "var(--tw-20)" }}>
              AI-powered job application automation. Find, match, and apply — on autopilot.
            </p>
            <div className="mt-[18px] flex gap-2.5">
              {["𝕏", "in", "ig"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border font-display text-[0.7rem] no-underline transition-all duration-200 hover:bg-white/6"
                  style={{ background: "rgba(255,255,255,.03)", borderColor: "var(--tw-10)", color: "var(--tw-20)" }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="mb-4 font-display text-[0.68rem] font-semibold uppercase tracking-[.1em]" style={{ color: "var(--tw-40)" }}>Product</div>
            <ul className="flex list-none flex-col gap-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l}><a href="#" className="font-display text-[0.82rem] no-underline transition-colors duration-200 hover:text-t-700" style={{ color: "var(--tw-20)" }}>{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="mb-4 font-display text-[0.68rem] font-semibold uppercase tracking-[.1em]" style={{ color: "var(--tw-40)" }}>Company</div>
            <ul className="flex list-none flex-col gap-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l}><a href="#" className="font-display text-[0.82rem] no-underline transition-colors duration-200 hover:text-t-700" style={{ color: "var(--tw-20)" }}>{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="mb-4 font-display text-[0.68rem] font-semibold uppercase tracking-[.1em]" style={{ color: "var(--tw-40)" }}>Legal</div>
            <ul className="flex list-none flex-col gap-2.5">
              {LEGAL_LINKS.map((l) => (
                <li key={l}><a href="#" className="font-display text-[0.82rem] no-underline transition-colors duration-200 hover:text-t-700" style={{ color: "var(--tw-20)" }}>{l}</a></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t pt-6 font-display text-[0.72rem] sm:flex-row" style={{ borderColor: "var(--tw-10)", color: "var(--tw-20)" }}>
          <span>&copy; 2026 ApplyPilot. All rights reserved.</span>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Cookies"].map((l) => (
              <a key={l} href="#" className="no-underline" style={{ color: "var(--tw-20)" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
