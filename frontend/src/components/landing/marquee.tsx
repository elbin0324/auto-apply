const companies = [
  { name: "Notion", abbr: "N", color: "#000" },
  { name: "Linear", abbr: "Li", color: "#5B68F6" },
  { name: "Airbnb", abbr: "Ab", color: "#FF5A5F" },
  { name: "Netflix", abbr: "N", color: "#E50914" },
  { name: "Spotify", abbr: "Sp", color: "#1DB954" },
  { name: "Salesforce", abbr: "Sf", color: "#00A1E0" },
  { name: "Google", abbr: "G", color: "#4285F4" },
  { name: "Apple", abbr: "A", color: "#555" },
  { name: "Meta", abbr: "M", color: "#0668E1" },
  { name: "Amazon", abbr: "Am", color: "#FF9900" },
  { name: "Stripe", abbr: "S", color: "#635BFF" },
  { name: "Figma", abbr: "F", color: "#F24E1E" },
];

// Duplicate for seamless loop
const items = [...companies, ...companies];

export function Marquee() {
  return (
    <section className="border-t border-b border-border-subtle py-[52px] overflow-hidden">
      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-muted mb-7">
        People Have Landed Roles At
      </p>
      <div className="relative">
        <div
          className="flex items-center gap-9 w-max"
          style={{ animation: "marquee-scroll 35s linear infinite" }}
        >
          {items.map((company, i) => (
            <div
              key={`${company.name}-${i}`}
              className="flex items-center gap-2.5 shrink-0 group cursor-default"
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-[7px] text-[0.65rem] font-bold text-white opacity-45 group-hover:opacity-100 group-hover:scale-[1.08] transition-all"
                style={{ backgroundColor: company.color }}
              >
                {company.abbr}
              </div>
              <span className="text-[0.95rem] font-semibold text-text-muted opacity-55 group-hover:opacity-100 transition-opacity">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
