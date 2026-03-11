import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ApplyPilotMark } from "@/icons";

const NAV_LINKS = ["Features", "How It Works", "Pricing"] as const;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-100 flex h-[60px] items-center justify-between px-4 md:px-8 lg:px-12 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(6,13,20,.92)" : "transparent",
        borderBottom: scrolled
          ? "1px solid var(--tw-10)"
          : "1px solid transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-pri">
          <ApplyPilotMark size={13} color="#060d14" />
        </div>
        <span className="font-mono text-sm font-bold" style={{ color: "var(--tw-90)" }}>
          APPLY<span className="text-pri">PILOT</span>
        </span>
      </div>

      {/* Center links — hidden below lg */}
      <div className="hidden lg:flex gap-8">
        {NAV_LINKS.map((label) => (
          <a
            key={label}
            href={`#${label.toLowerCase().replace(/ /g, "-")}`}
            className="font-mono text-[10px] font-semibold uppercase tracking-[.1em] transition-colors duration-200 hover:text-pri"
            style={{ color: "var(--tw-40)" }}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3.5">
        <Link
          to="/login"
          className="font-mono text-[10px] font-semibold tracking-[.06em] no-underline"
          style={{ color: "var(--tw-40)" }}
        >
          LOG IN
        </Link>
        <Link
          to="/signup"
          className="font-mono text-[10px] font-bold uppercase tracking-[.06em] rounded-[6px] bg-pri px-5 py-2.5 transition-all duration-200 hover:shadow-[0_0_24px_var(--pri-glow)]"
          style={{ color: "#060d14" }}
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}
