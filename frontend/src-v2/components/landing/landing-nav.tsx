import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ApplyPilotMark } from "@/icons";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
] as const;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-100 flex h-[60px] items-center justify-between px-[clamp(24px,4vw,56px)] transition-all duration-350"
      style={{
        background: scrolled ? "rgba(6,6,8,.92)" : "rgba(6,6,8,.6)",
        borderBottom: `1px solid ${scrolled ? "var(--tw-20)" : "var(--tw-10)"}`,
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
      }}
    >
      {/* Brand */}
      <a
        href="#top"
        className="flex items-center gap-2.5 font-display text-[1.05rem] font-bold tracking-[-0.03em] no-underline"
        style={{ color: "var(--tw-90)" }}
      >
        <div
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-pri"
        >
          <ApplyPilotMark size={15} color="#fff" />
        </div>
        <span>APPLY<span style={{ color: "var(--color-pri)" }}>PILOT</span></span>
      </a>

      {/* Center links */}
      <div className="absolute left-1/2 hidden -translate-x-1/2 gap-7 lg:flex">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="whitespace-nowrap font-display text-[0.8rem] no-underline transition-colors duration-200 hover:text-t-900"
            style={{ color: "var(--tw-40)" }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-5">
        <Link
          to="/login"
          className="font-display text-[0.82rem] no-underline transition-colors duration-200 hover:text-t-900"
          style={{ color: "var(--tw-40)" }}
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="inline-flex h-9 items-center rounded-[10px] px-[18px] font-display text-[0.8rem] font-semibold text-white no-underline transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: "var(--gradient-btn)",
            boxShadow:
              "0 2px 12px rgba(46,196,182,.25), inset 0 1px 0 rgba(255,255,255,.1)",
          }}
        >
          Get Started Free
        </Link>
      </div>
    </nav>
  );
}
