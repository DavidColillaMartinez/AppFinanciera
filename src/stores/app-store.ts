import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "app_finanzas_state";

export interface DashboardWidget {
  id: string;
  visible: boolean;
}

export interface DashboardConfig {
  widgets: DashboardWidget[];
  monthSelectorVisible: boolean;
  chartType: "categories" | "expenses" | "savings";
}

const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  widgets: [
    { id: "balance", visible: true },
    { id: "savings", visible: true },
    { id: "income", visible: true },
    { id: "expenses", visible: true },
    { id: "chart", visible: true },
    { id: "detail", visible: true },
    { id: "savingsPlan", visible: true },
  ],
  monthSelectorVisible: true,
  chartType: "categories",
};

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
  hasSeenOnboarding: boolean;
  dashboardConfig: DashboardConfig;
  monthlyIncome: number;
  incomeType: "fixed" | "variable";
  lastIncomeSetMonth: string | null;
  salaryAddedMonths: string[];
  monthlySavingsAddedMonths: string[];
}

export interface AppActions {
  setSheetConnection: (sheetId: string, sheetUrl: string) => void;
  disconnect: () => void;
  setConfig: (config: Partial<AppState>) => void;
  setConnectionErrors: (errors: string[]) => void;
  clearErrors: () => void;
  setOnboardingSeen: () => void;
  setDashboardConfig: (config: Partial<DashboardConfig>) => void;
  toggleWidget: (widgetId: string) => void;
  moveWidget: (widgetId: string, direction: "up" | "down") => void;
  reorderWidgets: (fromIndex: number, toIndex: number) => void;
  resetDashboardConfig: () => void;
  setMonthlyIncome: (amount: number, type: "fixed" | "variable") => void;
  clearMonthlyIncome: () => void;
  addSalaryMonth: (monthKey: string) => void;
  addMonthlySavingsMonth: (monthKey: string) => void;
  removeMonthlySavingsMonth: (monthKey: string) => void;
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      sheetId: null,
      sheetUrl: null,
      isConnected: false,
      templateVersion: null,
      appMinVersion: null,
      currency: "EUR",
      activeMonth: new Date().getMonth() + 1,
      activeYear: new Date().getFullYear(),
      connectionErrors: [],
      hasSeenOnboarding: false,
      dashboardConfig: DEFAULT_DASHBOARD_CONFIG,
      monthlyIncome: 0,
      incomeType: "fixed",
      lastIncomeSetMonth: null,
      salaryAddedMonths: [],
      monthlySavingsAddedMonths: [],

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

      setOnboardingSeen: () => set({ hasSeenOnboarding: true }),

      setDashboardConfig: (config) =>
        set((state) => ({
          dashboardConfig: { ...state.dashboardConfig, ...config },
        })),

      toggleWidget: (widgetId) =>
        set((state) => ({
          dashboardConfig: {
            ...state.dashboardConfig,
            widgets: state.dashboardConfig.widgets.map((w) =>
              w.id === widgetId ? { ...w, visible: !w.visible } : w,
            ),
          },
        })),

      moveWidget: (widgetId, direction) =>
        set((state) => {
          const widgets = [...state.dashboardConfig.widgets];
          const idx = widgets.findIndex((w) => w.id === widgetId);
          if (idx === -1) return state;
          const newIdx = direction === "up" ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= widgets.length) return state;
          [widgets[idx], widgets[newIdx]] = [widgets[newIdx], widgets[idx]];
          return {
            dashboardConfig: { ...state.dashboardConfig, widgets },
          };
        }),

      reorderWidgets: (fromIndex, toIndex) =>
        set((state) => {
          const widgets = [...state.dashboardConfig.widgets];
          const [removed] = widgets.splice(fromIndex, 1);
          widgets.splice(toIndex, 0, removed);
          return {
            dashboardConfig: { ...state.dashboardConfig, widgets },
          };
        }),

      resetDashboardConfig: () =>
        set({ dashboardConfig: DEFAULT_DASHBOARD_CONFIG }),

      setMonthlyIncome: (amount, type) =>
        set({
          monthlyIncome: amount,
          incomeType: type,
          lastIncomeSetMonth: new Date().toISOString().slice(0, 7),
        }),

      clearMonthlyIncome: () =>
        set({
          monthlyIncome: 0,
          incomeType: "fixed",
          lastIncomeSetMonth: null,
          salaryAddedMonths: [],
        }),

      addSalaryMonth: (monthKey) =>
        set((state) => ({
          salaryAddedMonths: [...new Set([...state.salaryAddedMonths, monthKey])],
        })),

      addMonthlySavingsMonth: (monthKey) =>
        set((state) => ({
          monthlySavingsAddedMonths: [...new Set([...state.monthlySavingsAddedMonths, monthKey])],
        })),

      removeMonthlySavingsMonth: (monthKey) =>
        set((state) => ({
          monthlySavingsAddedMonths: state.monthlySavingsAddedMonths.filter((m) => m !== monthKey),
        })),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        sheetId: state.sheetId,
        sheetUrl: state.sheetUrl,
        isConnected: state.isConnected,
        currency: state.currency,
        activeMonth: state.activeMonth,
        activeYear: state.activeYear,
        hasSeenOnboarding: state.hasSeenOnboarding,
        dashboardConfig: state.dashboardConfig,
        monthlyIncome: state.monthlyIncome,
        incomeType: state.incomeType,
        lastIncomeSetMonth: state.lastIncomeSetMonth,
        salaryAddedMonths: state.salaryAddedMonths,
        monthlySavingsAddedMonths: state.monthlySavingsAddedMonths,
      }),
    },
  ),
);
