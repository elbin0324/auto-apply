import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Dashboard", "Integrations"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Press"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Cookies", "Contact"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto max-w-[1100px] px-6 pt-16 pb-8">
        <div className="grid gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-linear-to-br from-accent-purple to-accent-blue">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-[1.05rem] font-bold text-text-primary">
                AutoApply
              </span>
            </Link>
            <p className="mt-4 text-[0.82rem] text-text-muted max-w-[280px] leading-relaxed">
              AI-powered job application automation. Find, match, and apply — on
              autopilot.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-text-secondary mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <span className="text-[0.82rem] text-text-muted hover:text-text-secondary cursor-pointer transition-colors">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-subtle pt-6">
          <p className="text-[0.72rem] text-text-muted">
            &copy; {new Date().getFullYear()} AutoApply. All rights reserved.
          </p>
          <div className="flex gap-4">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <span
                key={item}
                className="text-[0.72rem] text-text-muted hover:text-text-secondary cursor-pointer transition-colors"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
