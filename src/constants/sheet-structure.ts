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

export const MOVIMIENTOS_HEADERS = [
  "id",
  "fecha",
  "mesClave",
  "concepto",
  "tipo",
  "categoria",
  "importe",
  "metodo",
  "cuentaOrigen",
  "cuentaDestino",
  "notas",
  "reservaId",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const;

export const CATEGORIAS_HEADERS = [
  "categoriaId",
  "nombre",
  "presupuestoMensual",
  "tipoHabitual",
  "activo",
  "grupo",
  "color",
  "icono",
  "orden",
  "notas",
  "createdAt",
  "updatedAt",
] as const;

export const CUENTAS_HEADERS = [
  "cuentaId",
  "nombre",
  "tipo",
  "rol",
  "moneda",
  "saldoInicial",
  "saldoActualManual",
  "incluirDashboard",
  "activo",
  "color",
  "notas",
  "createdAt",
  "updatedAt",
] as const;

export const GASTOS_FIJOS_HEADERS = [
  "fijoId",
  "concepto",
  "categoria",
  "importe",
  "frecuencia",
  "diaCargo",
  "cuentaOrigen",
  "activo",
  "fechaInicio",
  "fechaFin",
  "notas",
  "createdAt",
  "updatedAt",
] as const;

export const PAGOS_FUTUROS_HEADERS = [
  "pagoId",
  "concepto",
  "categoria",
  "importeObjetivo",
  "fechaVencimiento",
  "frecuencia",
  "cuentaReserva",
  "activo",
  "saldoReservado",
  "mesesRestantes",
  "aporteMensual",
  "notas",
  "createdAt",
  "updatedAt",
] as const;

export const PAGOS_APLAZADOS_HEADERS = [
  "aplazadoId",
  "concepto",
  "importeTotal",
  "importePagado",
  "fechaInicio",
  "fechaFin",
  "cuotaMensual",
  "categoria",
  "cuentaOrigen",
  "estado",
  "notas",
  "createdAt",
  "updatedAt",
] as const;

export const MOV_RESERVAS_HEADERS = [
  "id",
  "fecha",
  "mesClave",
  "tipoDestino",
  "destinoId",
  "reservaId",
  "tipoMovimiento",
  "importe",
  "cuentaOrigen",
  "cuentaDestino",
  "notas",
  "createdAt",
  "updatedAt",
] as const;

export const SHEET_LEGACY = {
  LEEME: "00_LEEME",
  DASHBOARD: "Dashboard",
  VISTA_MES: "Vista_mes",
  APPS_SCRIPT: "AppsScript",
} as const;

export const CONFIG_HEADERS = ["Clave", "Valor", "Descripcion"] as const;

export const CONFIG_KEYS = {
  TEMPLATE_VERSION: "templateVersion",
  APP_MIN_VERSION: "appMinVersion",
  CURRENCY: "currency",
  YEAR: "year",
  MONTH: "month",
  FIRST_DAY_OF_WEEK: "firstDayOfWeek",
  LOCALE: "locale",
} as const;

export const SALARY_CONFIG_KEYS = {
  ENABLED: "salary.enabled",
  TYPE: "salary.type",
  FIXED_AMOUNT: "salary.fixedAmount",
  DAY: "salary.day",
  DESTINATION_ACCOUNT: "salary.destinationAccount",
  DESCRIPTION: "salary.description",
  UPDATED_AT: "salary.updatedAt",
} as const;

export const FIXED_CONFIG_KEYS = {
  CONFIRMED_PREFIX: "fixed.confirmed.",
} as const;

export const FIRST_DATA_ROW = 2;

export const TEMPLATE_VERSION = "1.0.0";
export const APP_MIN_VERSION = "1.0.0";

export type SheetName = (typeof SHEET_NAMES)[keyof typeof SHEET_NAMES];
