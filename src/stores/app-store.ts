import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "app_finanzas_state";

export type ChartType = "bar" | "pie" | "area" | "line";

export type ChartDataSource =
  | "categories"
  | "expenses"
  | "savings"
  | "income"
  | "total"
  | "fixed"
  | "deferred"
  | "future";

export interface DashboardChart {
  id: string;
  name: string;
  type: ChartType;
  dataSource: ChartDataSource;
  accentColor: string;
  animations: boolean;
  showLabels: boolean;
}

export interface DashboardWidgetItem {
  id: string;
  kind: "builtin" | "chart";
  enabled: boolean;
  order: number;
  size?: "compact" | "full";
  chartId?: string;
}

export interface DashboardConfig {
  layoutMode: "single" | "two-column";
  widgets: DashboardWidgetItem[];
  charts: DashboardChart[];
}

export type LayoutMode = "single" | "two-column";

const BUILTIN_WIDGET_IDS = [
  "balance",
  "income",
  "expenses",
  "savings",
  "monthlySavings",
  "savingsPlan",
  "obligations",
  "detail",
] as const;

const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  layoutMode: "single",
  widgets: [
    { id: "balance", kind: "builtin", enabled: true, order: 0 },
    { id: "income", kind: "builtin", enabled: true, order: 1 },
    { id: "expenses", kind: "builtin", enabled: true, order: 2 },
    { id: "savings", kind: "builtin", enabled: true, order: 3 },
    { id: "monthlySavings", kind: "builtin", enabled: true, order: 4 },
    { id: "savingsPlan", kind: "builtin", enabled: true, order: 5 },
    { id: "obligations", kind: "builtin", enabled: true, order: 6 },
    { id: "detail", kind: "builtin", enabled: true, order: 7 },
  ],
  charts: [
    {
      id: "default-categories",
      name: "Gastos por categoria",
      type: "pie",
      dataSource: "categories",
      accentColor: "#3B82F6",
      animations: true,
      showLabels: false,
    },
  ],
};

export type AuthStatus = "unknown" | "authenticated" | "expired" | "missing";

export interface AppState {
  sheetId: string | null;
  sheetUrl: string | null;
  isConnected: boolean;
  templateVersion: string | null;
  appMinVersion: string | null;
  lastConnectedAt: string | null;
  currency: string;
  activeMonth: number;
  activeYear: number;
  connectionErrors: string[];
  hasSeenOnboarding: boolean;
  authStatus: AuthStatus;
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
  logoutGoogle: () => void;
  setConfig: (config: Partial<AppState>) => void;
  setConnectionErrors: (errors: string[]) => void;
  clearErrors: () => void;
  setOnboardingSeen: () => void;
  setAuthStatus: (status: AuthStatus) => void;
  setDashboardConfig: (config: Partial<DashboardConfig>) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  toggleWidgetEnabled: (widgetId: string) => void;
  moveWidget: (widgetId: string, direction: "up" | "down") => void;
  reorderWidgets: (fromIndex: number, toIndex: number) => void;
  resetDashboardConfig: () => void;
  setMonthlyIncome: (amount: number, type: "fixed" | "variable") => void;
  clearMonthlyIncome: () => void;
  addSalaryMonth: (monthKey: string) => void;
  addMonthlySavingsMonth: (monthKey: string) => void;
  removeMonthlySavingsMonth: (monthKey: string) => void;
  addChart: (chart: Omit<DashboardChart, "id">) => void;
  updateChart: (chartId: string, updates: Partial<DashboardChart>) => void;
  removeChart: (chartId: string) => void;
  setTemplateVersion: (templateVersion: string | null, appMinVersion: string | null) => void;
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      sheetId: null,
      sheetUrl: null,
      isConnected: false,
      templateVersion: null,
      appMinVersion: null,
      lastConnectedAt: null,
      currency: "EUR",
      activeMonth: new Date().getMonth() + 1,
      activeYear: new Date().getFullYear(),
      connectionErrors: [],
      hasSeenOnboarding: false,
      authStatus: "unknown",
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
          lastConnectedAt: new Date().toISOString(),
          connectionErrors: [],
          authStatus: "authenticated",
        }),

      disconnect: () =>
        set({
          sheetId: null,
          sheetUrl: null,
          isConnected: false,
          templateVersion: null,
          appMinVersion: null,
          lastConnectedAt: null,
          connectionErrors: [],
        }),

      logoutGoogle: () =>
        set({
          sheetId: null,
          sheetUrl: null,
          isConnected: false,
          templateVersion: null,
          appMinVersion: null,
          lastConnectedAt: null,
          connectionErrors: [],
          authStatus: "missing",
          hasSeenOnboarding: false,
        }),

      setConfig: (config) => set((state) => ({ ...state, ...config })),

      setConnectionErrors: (errors) => set({ connectionErrors: errors }),

      clearErrors: () => set({ connectionErrors: [] }),

      setOnboardingSeen: () => set({ hasSeenOnboarding: true }),

      setAuthStatus: (status) => set({ authStatus: status }),

      setDashboardConfig: (config) =>
        set((state) => ({
          dashboardConfig: { ...state.dashboardConfig, ...config },
        })),

      setLayoutMode: (mode) =>
        set((state) => ({
          dashboardConfig: { ...state.dashboardConfig, layoutMode: mode },
        })),

      toggleWidgetEnabled: (widgetId) =>
        set((state) => ({
          dashboardConfig: {
            ...state.dashboardConfig,
            widgets: state.dashboardConfig.widgets.map((w) =>
              w.id === widgetId ? { ...w, enabled: !w.enabled } : w,
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
            dashboardConfig: {
              ...state.dashboardConfig,
              widgets: widgets.map((w, i) => ({ ...w, order: i })),
            },
          };
        }),

      reorderWidgets: (fromIndex, toIndex) =>
        set((state) => {
          const widgets = [...state.dashboardConfig.widgets];
          const [removed] = widgets.splice(fromIndex, 1);
          widgets.splice(toIndex, 0, removed);
          return {
            dashboardConfig: {
              ...state.dashboardConfig,
              widgets: widgets.map((w, i) => ({ ...w, order: i })),
            },
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

      addChart: (chart) =>
        set((state) => {
          const chartId = `chart-${Date.now()}`;
          const widgetId = `widget-${chartId}`;
          const maxOrder = state.dashboardConfig.widgets.length;
          return {
            dashboardConfig: {
              ...state.dashboardConfig,
              charts: [
                ...state.dashboardConfig.charts,
                { ...chart, id: chartId },
              ],
              widgets: [
                ...state.dashboardConfig.widgets,
                { id: widgetId, kind: "chart" as const, enabled: true, order: maxOrder, chartId },
              ],
            },
          };
        }),

      updateChart: (chartId, updates) =>
        set((state) => ({
          dashboardConfig: {
            ...state.dashboardConfig,
            charts: state.dashboardConfig.charts.map((c) =>
              c.id === chartId ? { ...c, ...updates } : c
            ),
          },
        })),

      removeChart: (chartId) =>
        set((state) => ({
          dashboardConfig: {
            ...state.dashboardConfig,
            charts: state.dashboardConfig.charts.filter((c) => c.id !== chartId),
            widgets: state.dashboardConfig.widgets.filter((w) => w.chartId !== chartId),
          },
        })),

      setTemplateVersion: (templateVersion, appMinVersion) =>
        set({ templateVersion, appMinVersion }),
    }),
    {
      name: STORAGE_KEY,
      version: 4,
      partialize: (state) => ({
        sheetId: state.sheetId,
        sheetUrl: state.sheetUrl,
        isConnected: state.isConnected,
        templateVersion: state.templateVersion,
        appMinVersion: state.appMinVersion,
        lastConnectedAt: state.lastConnectedAt,
        currency: state.currency,
        activeMonth: state.activeMonth,
        activeYear: state.activeYear,
        hasSeenOnboarding: state.hasSeenOnboarding,
        authStatus: state.authStatus,
        dashboardConfig: state.dashboardConfig,
        monthlyIncome: state.monthlyIncome,
        incomeType: state.incomeType,
        lastIncomeSetMonth: state.lastIncomeSetMonth,
        salaryAddedMonths: state.salaryAddedMonths,
        monthlySavingsAddedMonths: state.monthlySavingsAddedMonths,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const cfg = state.dashboardConfig as any;
        if (!cfg || !cfg.widgets) {
          state.dashboardConfig = DEFAULT_DASHBOARD_CONFIG;
          return;
        }
        const firstWidget = cfg.widgets[0];
          if (firstWidget && "visible" in firstWidget) {
            const oldWidgets: Array<{ id: string; visible: boolean }> = cfg.widgets;
            const oldCharts: any[] = Array.isArray(cfg.charts) ? cfg.charts : [];
            const newWidgets: DashboardWidgetItem[] = oldWidgets.map((w: any, i: number) => ({
            id: w.id,
            kind: "builtin" as const,
            enabled: w.visible,
            order: i,
          }));
          for (const c of oldCharts) {
            const wid = `widget-chart-${c.id}`;
            if (!newWidgets.some((w: any) => w.id === wid)) {
              newWidgets.push({
                id: wid,
                kind: "chart" as "builtin" | "chart",
                enabled: true,
                order: newWidgets.length,
                chartId: c.id,
              });
            }
          }
          state.dashboardConfig = {
            layoutMode: "single",
            widgets: newWidgets,
            charts: oldCharts,
          } as any;
        }
        if (!("layoutMode" in cfg)) {
          (state.dashboardConfig as any).layoutMode = "single";
        }
      },
    },
  ),
);
