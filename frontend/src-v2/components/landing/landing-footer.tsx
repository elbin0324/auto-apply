import { Plane } from "@/icons";

const LINKS = ["Privacy", "Terms", "Status", "Docs", "Twitter"];

export function LandingFooter() {
  return (
    <footer
      className="px-4 py-8 md:px-8 lg:px-12"
      style={{
        background: "#060d14",
        borderTop: "1px solid var(--tw-10)",
      }}
    >
      <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Logo + info */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded bg-pri">
            <Plane size={10} color="#060d14" />
          </div>
          <span
            className="font-mono text-[11px] font-bold"
            style={{ color: "var(--tw-40)" }}
          >
            APPLYPILOT
          </span>
          <span
            className="font-mono text-[10px]"
            style={{ color: "var(--tw-20)" }}
          >
            / Toronto, Canada / &copy; 2026
          </span>
        </div>

        {/* Footer links */}
        <div className="flex gap-7">
          {LINKS.map((l) => (
            <a
              key={l}
              href="#"
              className="font-mono text-[10px] tracking-[.06em] no-underline transition-colors duration-200 hover:text-pri"
              style={{ color: "var(--tw-20)" }}
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
