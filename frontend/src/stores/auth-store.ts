import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { UserResponse } from "@/types/user";

interface AuthState {
  session: Session | null;
  user: UserResponse | null;
  is_loading: boolean;
  is_authenticated: boolean;

  setSession: (session: Session | null) => void;
  setUser: (user: UserResponse | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  is_loading: true,
  is_authenticated: false,

  setSession: (session) =>
    set({
      session,
      is_authenticated: !!session,
    }),

  setUser: (user) => set({ user }),

  setLoading: (loading) => set({ is_loading: loading }),

  reset: () =>
    set({
      session: null,
      user: null,
      is_loading: false,
      is_authenticated: false,
    }),
}));
