import { cn } from "@/theme/utils";

type TabKey = "pending_review" | "in_progress" | "queued" | "applied" | "failed";
type TabColor = "warn" | "pri" | "ok" | "fail";

interface TabDef {
  key: TabKey;
  label: string;
  color: TabColor;
}

const TABS: TabDef[] = [
  { key: "pending_review", label: "REVIEW", color: "warn" },
  { key: "in_progress", label: "IN-FLIGHT", color: "pri" },
  { key: "queued", label: "QUEUED", color: "pri" },
  { key: "applied", label: "LANDED", color: "ok" },
  { key: "failed", label: "FAILED", color: "fail" },
];

const COLOR_VARS: Record<TabColor, { bg: string; border: string; text: string }> = {
  pri: {
    bg: "var(--pri-bg)",
    border: "var(--color-pri)",
    text: "var(--color-pri)",
  },
  ok: {
    bg: "var(--ok-bg)",
    border: "var(--color-ok)",
    text: "var(--color-ok)",
  },
  warn: {
    bg: "var(--warn-bg)",
    border: "var(--color-warn)",
    text: "var(--color-warn)",
  },
  fail: {
    bg: "var(--fail-bg)",
    border: "var(--color-fail)",
    text: "var(--color-fail)",
  },
};

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: Record<string, number>;
}

export function TabBar({ activeTab, onTabChange, counts }: TabBarProps) {
  return (
    <div className="flex gap-1 border-b border-border-main">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const colors = COLOR_VARS[tab.color];
        const count = counts[tab.key] ?? 0;

        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "relative flex cursor-pointer items-center gap-2 border-none px-4 py-2.5 transition-colors",
              isActive ? "rounded-t-md" : "bg-transparent",
            )}
            style={isActive ? { background: colors.bg } : undefined}
          >
            <span
              className="font-mono text-[9px] font-bold uppercase tracking-[0.06em]"
              style={{ color: isActive ? colors.text : "var(--color-t-500)" }}
            >
              {tab.label}
            </span>

            <span
              className={cn(
                "inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[9px] font-bold",
              )}
              style={
                isActive
                  ? {
                      background: colors.text,
                      color: "var(--color-bg-deep)",
                    }
                  : {
                      background: "var(--muted-bg)",
                      color: "var(--color-t-500)",
                    }
              }
            >
              {count}
            </span>

            {/* Active bottom border */}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: colors.border }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
