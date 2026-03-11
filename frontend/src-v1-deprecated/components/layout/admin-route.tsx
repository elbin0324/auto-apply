import { Navigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2 } from "lucide-react";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { is_loading, is_authenticated, user } = useAuthStore();

  if (is_loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="h-8 w-8 animate-spin text-accent-purple" />
      </div>
    );
  }

  if (!is_authenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}
