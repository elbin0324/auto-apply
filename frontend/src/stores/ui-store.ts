import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  sidebar_open: boolean;
  sidebar_collapsed: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebarOpen: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebar_open: false, // mobile drawer state
      sidebar_collapsed: false, // desktop collapsed state

      setSidebarOpen: (open) => set({ sidebar_open: open }),
      toggleSidebarOpen: () =>
        set((s) => ({ sidebar_open: !s.sidebar_open })),
      setSidebarCollapsed: (collapsed) =>
        set({ sidebar_collapsed: collapsed }),
      toggleSidebarCollapsed: () =>
        set((s) => ({ sidebar_collapsed: !s.sidebar_collapsed })),
    }),
    {
      name: "ui-store",
      partialize: (state) => ({
        sidebar_collapsed: state.sidebar_collapsed,
      }),
    },
  ),
);
