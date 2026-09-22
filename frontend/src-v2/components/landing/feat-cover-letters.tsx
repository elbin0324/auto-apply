export function FeatCoverLetters() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-[0.6rem] font-bold text-white" style={{ background: "var(--gradient-btn)" }}>AI</div>
          <div className="font-display text-[0.72rem]" style={{ color: "var(--tw-40)" }}>
            <strong style={{ color: "var(--tw-90)" }}>Cover Letter</strong> · Spotify
          </div>
        </div>
        <span className="rounded-md border px-2 py-[3px] font-mono text-[0.6rem] font-semibold" style={{ background: "rgba(46,196,182,.08)", borderColor: "rgba(46,196,182,.12)", color: "var(--accent-1-light)" }}>
          ✦ AI Generated
        </span>
      </div>

      {/* Typed text */}
      <p className="font-display text-[0.78rem] italic leading-[1.5]" style={{ color: "var(--tw-40)" }}>
        &ldquo;Dear Hiring Team, I&apos;m thrilled to apply for the Product Designer role at Spotify. With 3 years of experience designing consumer-facing products...&rdquo;
        <span className="ml-1 inline-block h-3.5 w-0.5 align-middle" style={{ background: "var(--accent-1-light)", animation: "blinkCursor 1s step-end infinite" }} />
      </p>

      {/* Placeholder lines */}
      <div className="mt-4 flex flex-col gap-2">
        {[95, 82, 88, 65, 72].map((w, i) => (
          <div
            key={i}
            className="h-1.5 rounded-sm"
            style={{
              width: `${w}%`,
              background: i < 3
                ? "linear-gradient(90deg, rgba(46,196,182,.15), rgba(100,181,207,.1))"
                : "rgba(255,255,255,.03)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
