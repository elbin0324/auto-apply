import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";

export function useLogout() {
  const navigate = useNavigate();
  const reset = useAuthStore((s) => s.reset);

  return useCallback(async () => {
    await supabase.auth.signOut();
    reset();
    navigate({ to: "/login" });
  }, [navigate, reset]);
}
