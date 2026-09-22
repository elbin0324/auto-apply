import { Reveal } from "./reveal";

const COMPANIES = [
  { name: "Notion", initial: "N", bg: "#000" },
  { name: "Linear", initial: "Li", bg: "#5B68F6" },
  { name: "Airbnb", initial: "Ab", bg: "#FF5A5F" },
  { name: "Netflix", initial: "N", bg: "#E50914" },
  { name: "Spotify", initial: "S", bg: "#1DB954" },
  { name: "Salesforce", initial: "Sf", bg: "#00A1E0" },
  { name: "Google", initial: "G", bg: "linear-gradient(135deg,#4285F4,#34A853)" },
  { name: "Apple", initial: "A", bg: "#555" },
  { name: "Meta", initial: "M", bg: "#0668E1" },
  { name: "Amazon", initial: "A", bg: "#FF9900" },
  { name: "Stripe", initial: "S", bg: "#635BFF" },
  { name: "Figma", initial: "F", bg: "#F24E1E" },
];

// Double for seamless loop
const items = [...COMPANIES, ...COMPANIES];

export function MarqueeSection() {
  return (
    <Reveal>
      <section
        className="overflow-hidden py-[52px]"
        style={{ borderTop: "1px solid var(--tw-10)", borderBottom: "1px solid var(--tw-10)" }}
      >
        <div className="mb-7 text-center font-display text-[0.65rem] font-semibold uppercase tracking-[.14em]" style={{ color: "var(--tw-20)" }}>
          People Have Landed Roles At
        </div>
        <div className="overflow-hidden">
          <div className="flex w-max animate-marquee">
            {items.map((co, i) => (
              <div key={i} className="group flex cursor-default items-center gap-2.5 px-9 transition-opacity duration-300">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] font-mono text-[0.6rem] font-extrabold text-white opacity-45 transition-all duration-300 group-hover:scale-[1.08] group-hover:opacity-100"
                  style={{ background: co.bg }}
                >
                  {co.initial}
                </div>
                <span className="font-display text-[0.95rem] font-semibold tracking-[-0.01em] opacity-55 transition-all duration-300 group-hover:opacity-100" style={{ color: "var(--tw-20)" }}>
                  {co.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
