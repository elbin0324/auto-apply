const COMPANIES = ["STRIPE", "VERCEL", "LINEAR", "ANTHROPIC", "FIGMA", "RAMP"];

export function SocialSection() {
  return (
    <section className="px-4 py-11 text-center md:px-8 lg:px-12" style={{ background: "#0c1520" }}>
      <p className="mb-5 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-t-400">
        USED BY JOB SEEKERS WHO&apos;VE LANDED ROLES AT
      </p>
      <div className="flex flex-wrap justify-center gap-8 opacity-25 sm:gap-12">
        {COMPANIES.map((co) => (
          <span
            key={co}
            className="font-mono text-[13px] font-bold tracking-[.08em]"
            style={{ color: "var(--tw-90)" }}
          >
            {co}
          </span>
        ))}
      </div>
    </section>
  );
}
