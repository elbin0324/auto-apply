import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { UserResponse } from "@/types/user";

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

/**
 * Fetch the local user record directly (no auth wrapper to avoid
 * getSession() re-entrancy issues during auth state transitions).
 */
async function fetchMe(accessToken: string): Promise<UserResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) return (await res.json()) as UserResponse;
    return null;
  } catch {
    return null;
  }
}

/**
 * Subscribes to Supabase onAuthStateChange, syncs session to auth store,
 * and fetches the local user record from GET /api/auth/me.
 *
 * Call this once at the app root (e.g. in App or main layout).
 */
export function useAuth() {
  const { setSession, setUser, setLoading, reset } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);

        if (session) {
          const user = await fetchMe(session.access_token);
          if (mounted) setUser(user);
        }
      } catch (err) {
        console.warn("[useAuth] loadSession error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setSession(session);

      if (session) {
        const user = await fetchMe(session.access_token);
        if (mounted) setUser(user);
      } else {
        reset();
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setLoading, reset]);
}
