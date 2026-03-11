import { create } from "zustand";

interface SidePanelData {
  type: string;
  id?: string;
  [key: string]: unknown;
}

interface UiState {
  sidebarOpen: boolean;
  sidePanel: {
    isOpen: boolean;
    data: SidePanelData | null;
  };

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openPanel: (data: SidePanelData) => void;
  closePanel: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  sidePanel: {
    isOpen: false,
    data: null,
  },

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  openPanel: (data) =>
    set({ sidePanel: { isOpen: true, data } }),

  closePanel: () =>
    set({ sidePanel: { isOpen: false, data: null } }),
}));
