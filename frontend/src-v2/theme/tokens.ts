export interface SemanticColor {
  base: string;
  dim: string;
  bg: string;
  border: string;
}

export interface Theme {
  name: "dark" | "light";
  bg: {
    deep: string;
    sidebar: string;
    body: string;
    card: string;
    inset: string;
    muted: string;
  };
  semantic: {
    pri: SemanticColor & { light: string; glow: string };
    ok: SemanticColor;
    warn: SemanticColor;
    fail: SemanticColor;
    muted: SemanticColor;
  };
  text: {
    t900: string;
    t700: string;
    t500: string;
    t400: string;
    t300: string;
  };
  sidebar: {
    tw90: string;
    tw60: string;
    tw40: string;
    tw20: string;
    tw10: string;
  };
  border: {
    main: string;
    subtle: string;
  };
  shadow: {
    card: string;
    elevated: string;
    panel: string;
  };
}

export const DARK_THEME: Theme = {
  name: "dark",
  bg: {
    deep: "#060d14",
    sidebar: "#081018",
    body: "#0c1520",
    card: "#111c2a",
    inset: "#0e1824",
    muted: "#182838",
  },
  semantic: {
    pri: {
      base: "#2ec4b6",
      dim: "#1a9a8e",
      light: "#50dace",
      bg: "rgba(46,196,182,.07)",
      border: "rgba(46,196,182,.2)",
      glow: "rgba(46,196,182,.1)",
    },
    ok: {
      base: "#64b5cf",
      dim: "#3a8eaa",
      bg: "rgba(100,181,207,.07)",
      border: "rgba(100,181,207,.18)",
    },
    warn: {
      base: "#e0a850",
      dim: "#b88030",
      bg: "rgba(224,168,80,.07)",
      border: "rgba(224,168,80,.18)",
    },
    fail: {
      base: "#d06060",
      dim: "#a84040",
      bg: "rgba(208,96,96,.07)",
      border: "rgba(208,96,96,.18)",
    },
    muted: {
      base: "#4a6070",
      dim: "#384858",
      bg: "rgba(74,96,112,.12)",
      border: "rgba(74,96,112,.2)",
    },
  },
  text: {
    t900: "#e0e8f0",
    t700: "#b0c0d0",
    t500: "#708090",
    t400: "#506070",
    t300: "#384858",
  },
  sidebar: {
    tw90: "rgba(255,255,255,.88)",
    tw60: "rgba(255,255,255,.55)",
    tw40: "rgba(255,255,255,.35)",
    tw20: "rgba(255,255,255,.15)",
    tw10: "rgba(255,255,255,.08)",
  },
  border: {
    main: "#1e2e3e",
    subtle: "#182838",
  },
  shadow: {
    card: "0 1px 3px rgba(0,0,0,.06)",
    elevated: "0 2px 8px rgba(0,0,0,.1)",
    panel: "-8px 0 30px rgba(0,0,0,.15)",
  },
};

export const LIGHT_THEME: Theme = {
  name: "light",
  bg: {
    deep: "#0a1520",
    sidebar: "#0c1720",
    body: "#f0f4f7",
    card: "#ffffff",
    inset: "#e8eef4",
    muted: "#dce4ec",
  },
  semantic: {
    pri: {
      base: "#2ec4b6",
      dim: "#1a9a8e",
      light: "#50dace",
      bg: "rgba(46,196,182,.06)",
      border: "rgba(46,196,182,.18)",
      glow: "rgba(46,196,182,.1)",
    },
    ok: {
      base: "#64b5cf",
      dim: "#3a8eaa",
      bg: "#edf5f8",
      border: "rgba(100,181,207,.2)",
    },
    warn: {
      base: "#e0a850",
      dim: "#b88030",
      bg: "#fdf8ee",
      border: "rgba(224,168,80,.2)",
    },
    fail: {
      base: "#d06060",
      dim: "#a84040",
      bg: "#faf0f0",
      border: "rgba(208,96,96,.18)",
    },
    muted: {
      base: "#8a9aaa",
      dim: "#708898",
      bg: "#edf1f5",
      border: "rgba(138,154,170,.15)",
    },
  },
  text: {
    t900: "#0c1520",
    t700: "#283848",
    t500: "#506878",
    t400: "#8094a6",
    t300: "#b0c0cc",
  },
  sidebar: {
    tw90: "rgba(255,255,255,.88)",
    tw60: "rgba(255,255,255,.55)",
    tw40: "rgba(255,255,255,.35)",
    tw20: "rgba(255,255,255,.15)",
    tw10: "rgba(255,255,255,.08)",
  },
  border: {
    main: "#d0dae4",
    subtle: "#e4ecf2",
  },
  shadow: {
    card: "0 1px 3px rgba(0,0,0,.06)",
    elevated: "0 2px 8px rgba(0,0,0,.1)",
    panel: "-8px 0 30px rgba(0,0,0,.15)",
  },
};

type StatusKey = "pri" | "ok" | "warn" | "fail" | "muted";

const STATUS_MAP: Record<string, { color: StatusKey; label: string }> = {
  queued: { color: "pri", label: "QUEUED" },
  in_progress: { color: "pri", label: "IN-FLIGHT" },
  pending_review: { color: "warn", label: "REVIEW" },
  applied: { color: "ok", label: "LANDED" },
  failed: { color: "fail", label: "FAILED" },
  skipped: { color: "muted", label: "SKIPPED" },
};

export function statusColor(status: string): StatusKey {
  return STATUS_MAP[status]?.color ?? "muted";
}

export function statusLabel(status: string): string {
  return STATUS_MAP[status]?.label ?? "NEW";
}

export function matchScoreColor(score: number): string {
  if (score >= 90) return "#2ec4b6";
  if (score >= 75) return "#64b5cf";
  if (score >= 60) return "#e0a850";
  return "#4a6070";
}

export function matchScoreLabel(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 45) return "Moderate";
  if (score >= 30) return "Weak";
  return "Poor";
}
