import { Sidebar } from "./sidebar";
import { StatusBar } from "./status-bar";
import { PageHeader } from "./page-header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  badges?: Record<string, number>;
}

export function DashboardLayout({ children, badges }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar badges={badges} />
      <div className="flex flex-1 flex-col min-h-screen lg:ml-[240px]">
        <StatusBar />
        <PageHeader />
        <main className="flex-1 px-4 py-5 lg:px-7 animate-page-in">{children}</main>
      </div>
    </div>
  );
}
