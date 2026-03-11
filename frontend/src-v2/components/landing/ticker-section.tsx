const ITEMS = [
  "12,400+ APPLICATIONS SENT",
  "94% FORM ACCURACY",
  "3.2\u00d7 MORE INTERVIEWS",
  "UNDER 45 SECONDS PER APPLICATION",
  "50+ ATS PLATFORMS SUPPORTED",
  "AI-TAILORED RESUMES FOR EVERY ROLE",
];

// Duplicate for seamless loop
const doubled = [...ITEMS, ...ITEMS];

export function TickerSection() {
  return (
    <div
      className="overflow-hidden bg-bg-deep py-3"
      style={{
        borderTop: "1px solid var(--tw-10)",
        borderBottom: "1px solid var(--tw-10)",
      }}
    >
      <div className="flex w-max gap-14 animate-ticker">
        {doubled.map((text, i) => (
          <span
            key={i}
            className="flex items-center gap-3.5 whitespace-nowrap font-mono text-[10px] font-semibold tracking-[.12em]"
            style={{ color: "var(--tw-40)" }}
          >
            <span className="h-1 w-1 rounded-full bg-pri opacity-50" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
