import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatCurrency(
  amount: number,
  currency = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatDate(date);
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}

/**
 * Format a salary range for display.
 * Checks top-level salary fields first, falls back to ai_enrichment.salary.
 */
export function formatSalaryRange(
  salaryMin?: number | null,
  salaryMax?: number | null,
  currency?: string | null,
  aiSalary?: { min_value?: number | null; max_value?: number | null; currency?: string | null; unit_text?: string | null } | null,
): string {
  const min = salaryMin ?? aiSalary?.min_value;
  const max = salaryMax ?? aiSalary?.max_value;
  if (!min && !max) return "";

  const cur = currency ?? aiSalary?.currency ?? "USD";
  const symbol = cur === "USD" || cur === "CAD" ? "$" : cur + " ";
  const fmt = (n: number) => (n >= 1000 ? `${symbol}${Math.round(n / 1000)}k` : `${symbol}${n}`);

  let range = "";
  if (min && max) {
    range = `${fmt(min)}–${fmt(max)}`;
  } else if (min) {
    range = `${fmt(min)}+`;
  } else {
    range = `Up to ${fmt(max!)}`;
  }

  const unit = aiSalary?.unit_text;
  if (unit === "YEAR") range += "/yr";
  else if (unit === "MONTH") range += "/mo";
  else if (unit === "HOUR") range += "/hr";

  return range;
}

/** Format salary with full numbers (for side panel detail). */
export function formatSalaryFull(
  min?: number | null,
  max?: number | null,
  currency?: string | null,
  unitText?: string | null,
): string {
  if (!min && !max) return "";

  const cur = currency ?? "USD";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);

  let range = "";
  if (min && max) {
    range = `${fmt(min)} – ${fmt(max)}`;
  } else if (min) {
    range = `${fmt(min)}+`;
  } else {
    range = `Up to ${fmt(max!)}`;
  }

  if (unitText === "YEAR") range += " / year";
  else if (unitText === "MONTH") range += " / month";
  else if (unitText === "HOUR") range += " / hour";

  return range;
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead",
  executive: "Executive",
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export function formatLocationType(locationType?: string | null): string {
  if (!locationType) return "";
  return LOCATION_TYPE_LABELS[locationType] ?? locationType;
}

export function formatExperienceLevel(level?: string | null): string {
  if (!level) return "";
  return EXPERIENCE_LABELS[level] ?? level;
}

export function formatEmploymentType(type?: string | null): string {
  if (!type) return "";
  return EMPLOYMENT_LABELS[type] ?? type;
}
