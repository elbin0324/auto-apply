export const APP_NAME = "ApplyPilot";
export const APP_VERSION = "2.0.0";

export type NavSection = "MAIN" | "ACCOUNT";

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
  { id: "profile", label: "Profile", path: "/profile", icon: "Doc", section: "ACCOUNT" },
];

export const PAGE_TITLES: Record<string, string> = {
  "/": "JOBS",
  "/applications": "APPLICATIONS",
  "/autopilot": "AUTOPILOT",
  "/profile": "PROFILE",
  "/profile/resume": "PROFILE",
  "/profile/preferences": "PROFILE",
  "/profile/applications": "PROFILE",
  "/profile/account": "PROFILE",
};

export const NAV_SECTIONS: NavSection[] = ["MAIN", "ACCOUNT"];

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
