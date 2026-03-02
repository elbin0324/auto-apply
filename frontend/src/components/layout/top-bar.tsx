import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/use-logout";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/jobs": "Jobs",
  "/auto-apply": "Auto-Apply",
  "/applications": "Applications",
  "/profile": "Profile",
};

export function TopBar() {
  const toggleSidebarOpen = useUiStore((s) => s.toggleSidebarOpen);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const title =
    pageTitles[currentPath] ??
    (currentPath.startsWith("/jobs/")
      ? "Job Detail"
      : currentPath.startsWith("/applications/")
        ? "Application Detail"
        : "AutoApply");
  const email = user?.email ?? "";
  const initials = email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle px-4 backdrop-blur-xl backdrop-saturate-150 bg-bg/80 lg:px-6">
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebarOpen}
          className="rounded-lg p-2 text-text-muted hover:bg-border-subtle hover:text-text-secondary transition-colors duration-200 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      </div>

      {/* Right: user menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-border-subtle transition-colors duration-200"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-accent-purple/20 text-accent-purple text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm text-text-secondary sm:block">
              {email}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link to="/profile" className="cursor-pointer">
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="text-red-400 focus:text-red-400"
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
