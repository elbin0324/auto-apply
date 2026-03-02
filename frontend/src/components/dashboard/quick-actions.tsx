import { Link } from "@tanstack/react-router";
import { Search, Upload, Zap, FileText } from "lucide-react";

const actions = [
  {
    to: "/jobs",
    label: "Browse Jobs",
    description: "Find new opportunities",
    icon: Search,
    color: "text-accent-blue",
    bg: "bg-accent-blue/10",
  },
  {
    to: "/profile",
    label: "Upload Resume",
    description: "Update your profile",
    icon: Upload,
    color: "text-accent-green",
    bg: "bg-accent-green/10",
  },
  {
    to: "/auto-apply",
    label: "Start Auto-Apply",
    description: "Configure & launch",
    icon: Zap,
    color: "text-accent-purple",
    bg: "bg-accent-purple/10",
  },
  {
    to: "/applications",
    label: "View Applications",
    description: "Track your progress",
    icon: FileText,
    color: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
  },
] as const;

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card">
      <div className="border-b border-border-subtle px-5 py-4">
        <h2 className="text-sm font-semibold text-text-primary">
          Quick Actions
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        {actions.map(({ to, label, description, icon: Icon, color, bg }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-lg border border-border-subtle p-3 hover:border-border-hover hover:bg-bg-card-hover transition-colors duration-200"
          >
            <div className={`rounded-lg p-2 ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{label}</p>
              <p className="text-xs text-text-muted">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
