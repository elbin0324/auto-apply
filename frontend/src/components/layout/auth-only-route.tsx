import { Navigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2 } from "lucide-react";

/**
 * Like ProtectedRoute but only checks authentication — does NOT check
 * onboarding_completed. Used for the onboarding page itself to avoid
 * a redirect loop.
 */
export function AuthOnlyRoute({ children }: { children: React.ReactNode }) {
  const { is_loading, is_authenticated } = useAuthStore();

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

  return <>{children}</>;
}
