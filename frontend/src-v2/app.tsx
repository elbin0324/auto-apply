import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/router";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { ToastContainer } from "@/components/ui/toast";

export function App() {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}
