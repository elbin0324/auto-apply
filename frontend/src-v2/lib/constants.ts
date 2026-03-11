export const APP_NAME = "ApplyPilot";
export const APP_VERSION = "2.0.0";

export type NavSection = "MISSION CTRL" | "OPS" | "SYS";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  section: NavSection;
  hasBadge?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: "Chart", section: "MISSION CTRL" },
  { id: "jobs", label: "Job Radar", path: "/jobs", icon: "Target", section: "MISSION CTRL", hasBadge: true },
  { id: "queue", label: "Flight Queue", path: "/queue", icon: "Queue", section: "MISSION CTRL", hasBadge: true },
  { id: "profile", label: "Resume Hangar", path: "/profile", icon: "Doc", section: "MISSION CTRL" },
  { id: "autopilot", label: "Autopilot", path: "/autopilot", icon: "Bot", section: "OPS" },
  { id: "tracker", label: "Tracker", path: "/tracker", icon: "Radar", section: "OPS" },
  { id: "analytics", label: "Analytics", path: "/analytics", icon: "Chart", section: "OPS" },
  { id: "settings", label: "Settings", path: "/settings", icon: "Gear", section: "SYS" },
];

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "DASHBOARD",
  "/jobs": "JOB RADAR",
  "/queue": "FLIGHT QUEUE",
  "/profile": "RESUME HANGAR",
  "/autopilot": "AUTOPILOT",
  "/tracker": "TRACKER",
  "/analytics": "ANALYTICS",
  "/settings": "SETTINGS",
};

export const NAV_SECTIONS: NavSection[] = ["MISSION CTRL", "OPS", "SYS"];

export const STATUS_LABELS: Record<string, string> = {
  queued: "QUEUED",
  in_progress: "IN-FLIGHT",
  pending_review: "REVIEW",
  applied: "LANDED",
  failed: "FAILED",
  skipped: "SKIPPED",
};

export const STATUS_COLORS: Record<string, string> = {
  queued: "pri",
  in_progress: "pri",
  pending_review: "warn",
  applied: "ok",
  failed: "fail",
  skipped: "muted",
};
