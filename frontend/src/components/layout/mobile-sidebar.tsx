import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  Zap,
  FileText,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useLogout } from "@/hooks/use-logout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/auto-apply", label: "Auto-Apply", icon: Zap },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function MobileSidebar() {
  const open = useUiStore((s) => s.sidebar_open);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
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
    <Sheet open={open} onOpenChange={setSidebarOpen}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-60 bg-bg-card p-0"
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-border-subtle px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-purple text-white text-sm font-bold">
            A
          </div>
          <SheetTitle className="text-lg font-semibold text-text-primary">
            AutoApply
          </SheetTitle>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = currentPath === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
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
                      : "text-text-muted",
                  )}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="mt-auto border-t border-border-subtle p-2">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-accent-purple/20 text-accent-purple text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-sm text-text-secondary">
              {email}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-border-subtle hover:text-red-400 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
