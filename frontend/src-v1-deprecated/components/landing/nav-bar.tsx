import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-6 border-b transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(6,6,8,0.92)] border-border-card"
          : "bg-[rgba(6,6,8,0.6)] border-border-subtle"
      }`}
      style={{ backdropFilter: "blur(40px) saturate(180%)" }}
    >
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-linear-to-br from-accent-purple to-accent-blue">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-[1.05rem] font-bold text-text-primary">
          AutoApply
        </span>
      </Link>

      {/* Center links */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-6">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-[0.8rem] text-text-secondary hover:text-text-primary transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="text-[0.82rem] text-text-secondary hover:text-text-primary transition-colors"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="h-9 px-[18px] rounded-[10px] text-[0.8rem] font-semibold text-white flex items-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          Get Started Free
        </Link>
      </div>
    </nav>
  );
}
