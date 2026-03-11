import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { User } from "@/types/user";

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setSession: (session) =>
    set({
      session,
      isAuthenticated: !!session,
    }),

  setUser: (user) => set({ user }),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () =>
    set({
      session: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }),
}));
