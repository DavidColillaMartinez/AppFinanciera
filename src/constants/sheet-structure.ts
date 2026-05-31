export const SHEET_NAMES = {
  CONFIG: "Config",
  MOVIMIENTOS: "Movimientos",
  CATEGORIAS: "Categorias",
  CUENTAS: "Cuentas",
  GASTOS_FIJOS: "Gastos_fijos",
  PAGOS_FUTUROS: "Pagos_futuros",
  OBJETIVOS: "Objetivos",
  RESERVAS: "Reservas",
  MOV_RESERVAS: "Mov_reservas",
  PAGOS_APLAZADOS: "Pagos_aplazados",
} as const;

export const SHEET_LEGACY = {
  LEEME: "00_LEEME",
  DASHBOARD: "Dashboard",
  VISTA_MES: "Vista_mes",
  APPS_SCRIPT: "AppsScript",
} as const;

export const CONFIG_KEYS = {
  TEMPLATE_VERSION: "templateVersion",
  APP_MIN_VERSION: "appMinVersion",
  CURRENCY: "currency",
  YEAR: "year",
  MONTH: "month",
  FIRST_DAY_OF_WEEK: "firstDayOfWeek",
  LOCALE: "locale",
} as const;

export const FIRST_DATA_ROW = 2;

export const TEMPLATE_VERSION = "1.0.0";
export const APP_MIN_VERSION = "1.0.0";

export type SheetName = (typeof SHEET_NAMES)[keyof typeof SHEET_NAMES];
