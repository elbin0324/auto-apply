import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  Zap,
  FileText,
  User,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Shield,
  Users,
  Activity,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useLogout } from "@/hooks/use-logout";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/auto-apply", label: "Auto-Apply", icon: Zap },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const adminNavItems = [
  { to: "/admin", label: "Admin", icon: Shield },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/queues", label: "Queues", icon: Activity },
  { to: "/admin/data", label: "Data", icon: Database },
] as const;

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebar_collapsed);
  const toggleCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const email = user?.email ?? "";
  const initials = email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border-subtle bg-bg-card transition-[width] duration-300",
        collapsed ? "w-[68px]" : "w-60",
      )}
      style={{ transitionTimingFunction: "var(--ease)" }}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border-subtle px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-purple text-white text-sm font-bold">
          A
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold text-text-primary">
            AutoApply
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = currentPath === to;

          const link = (
            <Link
              to={to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-accent-purple/15 text-accent-purple"
                  : "text-text-secondary hover:bg-border-subtle hover:text-text-primary",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive
                    ? "text-accent-purple"
                    : "text-text-muted group-hover:text-text-secondary",
                )}
              />
              {!collapsed && <span>{label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={to} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={to}>{link}</div>;
        })}

        {user?.role === "admin" && (
          <>
            <div className="my-2 border-t border-border-subtle" />
            {adminNavItems.map(({ to, label, icon: Icon }) => {
              const isExactActive = currentPath === to;

              const link = (
                <Link
                  to={to}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                    isExactActive
                      ? "bg-accent-purple/15 text-accent-purple"
                      : "text-text-secondary hover:bg-border-subtle hover:text-text-primary",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isExactActive
                        ? "text-accent-purple"
                        : "text-text-muted group-hover:text-text-secondary",
                    )}
                  />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={to} delayDuration={0}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={to}>{link}</div>;
            })}
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border-subtle p-2">
        {/* Collapse toggle */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-border-subtle hover:text-text-secondary transition-colors duration-200"
        >
          {collapsed ? (
            <ChevronsRight className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-5 w-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>

        {/* User info */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2",
            collapsed ? "justify-center" : "",
          )}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-accent-purple/20 text-accent-purple text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <span className="min-w-0 flex-1 truncate text-sm text-text-secondary">
              {email}
            </span>
          )}
        </div>

        {/* Logout */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-border-subtle hover:text-red-400 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Log out
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-border-subtle hover:text-red-400 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Log out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
