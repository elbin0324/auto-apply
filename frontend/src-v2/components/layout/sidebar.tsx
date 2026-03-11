import { useNavigate, useRouterState } from "@tanstack/react-router";
import { NAV_ITEMS, NAV_SECTIONS } from "@/lib/constants";
import { ICONS } from "@/icons";
import { Plane } from "@/icons";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

interface SidebarProps {
  badges?: Record<string, number>;
}

function NavIcon({ name, size = 14, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICONS[name as keyof typeof ICONS];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}

export function Sidebar({ badges = {} }: SidebarProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  const sections = NAV_SECTIONS.map((sec) => ({
    label: sec,
    items: NAV_ITEMS.filter((item) => item.section === sec),
  }));

  const handleNavClick = (path: string) => {
    navigate({ to: path });
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 flex w-[240px] flex-col overflow-y-auto bg-bg-sidebar transition-transform duration-200",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ borderRight: "1px solid var(--tw-10)" }}
      >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--tw-10)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[6px] bg-pri">
            <Plane size={14} color="var(--color-bg-deep)" />
          </div>
          <span className="font-mono text-[15px] font-bold" style={{ color: "var(--tw-90)" }}>
            APPLY<span className="text-pri">PILOT</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2.5">
        {sections.map((sec) => (
          <div key={sec.label}>
            <div
              className="mt-1.5 px-2.5 pt-2.5 pb-1.5 font-mono text-[9px] font-bold uppercase"
              style={{ letterSpacing: ".14em", color: "var(--tw-40)" }}
            >
              {sec.label}
            </div>
            {sec.items.map((item) => {
              const isActive = currentPath === item.path;
              const badge = item.hasBadge ? badges[item.id] : undefined;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    "mb-px flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 font-mono text-[11px] font-medium",
                    "cursor-pointer border transition-colors",
                    isActive
                      ? "border-[var(--pri-border)] text-pri"
                      : "border-transparent hover:bg-[var(--tw-10)]",
                  )}
                  style={{
                    background: isActive ? "var(--pri-bg)" : undefined,
                    color: isActive ? undefined : "var(--tw-60)",
                  }}
                >
                  <span className={cn("flex w-4 shrink-0", isActive ? "opacity-100" : "opacity-50")}>
                    <NavIcon name={item.icon} size={14} />
                  </span>
                  {item.label}
                  {badge != null && badge > 0 && (
                    <span
                      className="ml-auto rounded-[3px] px-[7px] py-px font-mono text-[9px] font-bold"
                      style={{
                        background: isActive ? "var(--color-pri)" : "var(--tw-10)",
                        color: isActive ? "var(--color-bg-deep)" : "var(--tw-60)",
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Subscription Footer */}
      <div className="px-4 py-3.5" style={{ borderTop: "1px solid var(--tw-10)" }}>
        <div
          className="mb-1.5 font-mono text-[9px] font-bold uppercase text-pri"
          style={{ letterSpacing: ".1em" }}
        >
          BUSINESS CLASS
        </div>
        <div className="mb-2 font-mono text-[10px]" style={{ color: "var(--tw-40)" }}>
          68/100
        </div>
        <div
          className="mb-2.5 h-[3px] overflow-hidden rounded-full"
          style={{ background: "var(--tw-10)" }}
        >
          <div
            className="h-full w-[68%] rounded-full"
            style={{ background: "linear-gradient(90deg, var(--color-pri), var(--color-pri-light))" }}
          />
        </div>
      </div>
      </aside>
    </>
  );
}
