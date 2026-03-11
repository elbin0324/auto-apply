import { Navigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { DashboardLayout } from "./dashboard-layout";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-body">
        <span className="font-mono text-sm text-t-500">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
