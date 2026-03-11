import { useRouterState } from "@tanstack/react-router";
import { useTheme } from "@/theme/context";
import { useUiStore } from "@/stores/ui-store";
import { PAGE_TITLES } from "@/lib/constants";
import { Sun, Moon, Search, Bell, Target, Menu } from "@/icons";

export function PageHeader() {
  const { isDark, toggleTheme } = useTheme();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const title = PAGE_TITLES[currentPath] ?? "APPLYPILOT";

  const now = new Date();
  const dateStr = now
    .toLocaleDateString("en-US", { month: "short", year: "numeric" })
    .toUpperCase();

  return (
    <div className="flex items-center justify-between border-b border-border-main bg-bg-card px-4 py-[18px] lg:px-7">
      {/* Left: hamburger + title + date */}
      <div className="flex items-baseline gap-2.5">
        <button
          onClick={toggleSidebar}
          className="mr-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] border border-border-main bg-bg-card transition-colors hover:bg-bg-muted lg:hidden"
        >
          <Menu size={16} className="text-t-500" />
        </button>
        <h1 className="font-mono text-base font-bold tracking-wide text-t-900">
          {title}
        </h1>
        <span className="font-mono text-[11px] text-t-400">/ {dateStr}</span>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] border border-border-main bg-bg-card transition-colors hover:bg-bg-muted"
        >
          {isDark ? <Sun size={14} className="text-t-500" /> : <Moon size={14} className="text-t-500" />}
        </button>
        <button className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] border border-border-main bg-bg-card transition-colors hover:bg-bg-muted">
          <Search size={14} className="text-t-500" />
        </button>
        <button className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] border border-border-main bg-bg-card transition-colors hover:bg-bg-muted">
          <Bell size={14} className="text-t-500" />
          <span className="absolute -top-0.5 -right-0.5 h-[7px] w-[7px] rounded-full border-2 border-bg-card bg-fail" />
        </button>
        <button className="hidden cursor-pointer items-center gap-[7px] rounded-[6px] border-none bg-pri px-[18px] py-[9px] font-mono text-[11px] font-semibold uppercase tracking-wide text-bg-deep transition-opacity hover:opacity-90 sm:inline-flex">
          <Target size={12} color="var(--color-bg-deep)" />
          Quick Apply
        </button>
      </div>
    </div>
  );
}
