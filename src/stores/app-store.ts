import { create } from "zustand";

export interface AppState {
  sheetId: string | null;
  sheetUrl: string | null;
  isConnected: boolean;
  templateVersion: string | null;
  appMinVersion: string | null;
  currency: string;
  activeMonth: number;
  activeYear: number;
  connectionErrors: string[];
}

export interface AppActions {
  setSheetConnection: (sheetId: string, sheetUrl: string) => void;
  disconnect: () => void;
  setConfig: (config: Partial<AppState>) => void;
  setConnectionErrors: (errors: string[]) => void;
  clearErrors: () => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  sheetId: null,
  sheetUrl: null,
  isConnected: false,
  templateVersion: null,
  appMinVersion: null,
  currency: "EUR",
  activeMonth: new Date().getMonth() + 1,
  activeYear: new Date().getFullYear(),
  connectionErrors: [],

  setSheetConnection: (sheetId, sheetUrl) =>
    set({
      sheetId,
      sheetUrl,
      isConnected: true,
      connectionErrors: [],
    }),

  disconnect: () =>
    set({
      sheetId: null,
      sheetUrl: null,
      isConnected: false,
      templateVersion: null,
      appMinVersion: null,
      connectionErrors: [],
    }),

  setConfig: (config) => set((state) => ({ ...state, ...config })),

  setConnectionErrors: (errors) => set({ connectionErrors: errors }),

  clearErrors: () => set({ connectionErrors: [] }),
}));
