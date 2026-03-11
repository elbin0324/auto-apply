import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/router";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { useEffect } from "react";
import { ToastContainer } from "@/components/ui/toast";
import type { User } from "@/types/user";

export function App() {
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        api.get<User>("/api/auth/me").then(setUser).catch(() => {});
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        api.get<User>("/api/auth/me").then(setUser).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser, setLoading]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}
