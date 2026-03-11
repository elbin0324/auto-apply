import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import type { User, TokenResponse } from "@/types/user";

export function useAuth() {
  const { session, user, isLoading, isAuthenticated, setUser, reset } =
    useAuthStore();

  const fetchUser = useCallback(async (): Promise<User> => {
    const data = await api.get<User>("/api/auth/me");
    setUser(data);
    return data;
  }, [setUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const tokens = await api.post<TokenResponse>("/api/auth/login", {
        email,
        password,
      });

      const { error } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });

      if (error) throw error;

      return fetchUser();
    },
    [fetchUser],
  );

  const signup = useCallback(
    async (email: string, password: string): Promise<User> => {
      const user = await api.post<User>("/api/auth/signup", {
        email,
        password,
      });

      const tokens = await api.post<TokenResponse>("/api/auth/login", {
        email,
        password,
      });

      const { error } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });

      if (error) throw error;

      setUser(user);
      return user;
    },
    [setUser],
  );

  const loginWithGoogle = useCallback(async () => {
    const data = await api.post<{ url: string }>("/api/auth/oauth/google");
    window.location.href = data.url;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Proceed with local logout even if API call fails
    }
    await supabase.auth.signOut();
    reset();
  }, [reset]);

  return {
    session,
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    loginWithGoogle,
    logout,
    fetchUser,
  };
}
