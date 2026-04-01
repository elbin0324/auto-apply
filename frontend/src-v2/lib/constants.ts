export const APP_NAME = "ApplyPilot";
export const APP_VERSION = "2.0.0";

export type NavSection = "MAIN" | "PROFILE";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  section: NavSection;
  hasBadge?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "jobs", label: "Jobs", path: "/", icon: "Target", section: "MAIN", hasBadge: true },
  { id: "applications", label: "Applications", path: "/applications", icon: "Radar", section: "MAIN", hasBadge: true },
  { id: "autopilot", label: "Autopilot", path: "/autopilot", icon: "Bot", section: "MAIN" },
  { id: "resume", label: "Resume", path: "/profile/resume", icon: "Doc", section: "PROFILE" },
  { id: "preferences", label: "Job Preferences", path: "/profile/preferences", icon: "Sliders", section: "PROFILE" },
  { id: "app-prefs", label: "App Preferences", path: "/profile/applications", icon: "Layers", section: "PROFILE" },
  { id: "account", label: "Account", path: "/profile/account", icon: "Gear", section: "PROFILE" },
];

export const PAGE_TITLES: Record<string, string> = {
  "/": "JOBS",
  "/applications": "APPLICATIONS",
  "/autopilot": "AUTOPILOT",
  "/profile/resume": "RESUME",
  "/profile/preferences": "JOB PREFERENCES",
  "/profile/applications": "APP PREFERENCES",
  "/profile/account": "ACCOUNT",
};

export const NAV_SECTIONS: NavSection[] = ["MAIN", "PROFILE"];

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
