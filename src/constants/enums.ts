export const TransactionType = {
  INGRESO: "Ingreso",
  GASTO: "Gasto",
  AHORRO: "Ahorro",
  TRANSFERENCIA_INTERNA: "Transferencia interna",
} as const;

export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export const CategoryType = {
  INGRESO: "Ingreso",
  GASTO: "Gasto",
  AHORRO: "Ahorro",
} as const;

export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

export const AccountType = {
  BANCO: "Banco",
  EFECTIVO: "Efectivo",
  VIRTUAL: "Virtual",
  OTRO: "Otro",
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const Frequency = {
  MENSUAL: "Mensual",
  ANUAL: "Anual",
  TRIMESTRAL: "Trimestral",
  UNICO: "Unico",
} as const;

export type Frequency = (typeof Frequency)[keyof typeof Frequency];

export const GenericStatus = {
  ACTIVO: "Activo",
  PAUSADO: "Pausado",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
} as const;

export type GenericStatus = (typeof GenericStatus)[keyof typeof GenericStatus];

export const Priority = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export const GoalType = {
  SEGURIDAD: "Seguridad",
  VACACIONES: "Vacaciones",
  EMERGENCIA: "Emergencia",
  VEHICULO: "Vehiculo",
  HOGAR: "Hogar",
  OTRO: "Otro",
} as const;

export type GoalType = (typeof GoalType)[keyof typeof GoalType];

export const ReserveType = {
  IMPREVISTOS: "Imprevistos",
  EMERGENCIA: "Emergencia",
  PAGO_FUTURO: "Pago futuro",
  OBJETIVO: "Objetivo",
  OTRO: "Otro",
} as const;

export type ReserveType = (typeof ReserveType)[keyof typeof ReserveType];

export const ReserveMovementType = {
  APORTACION: "Aportacion",
  DISPOSICION: "Disposicion",
} as const;

export type ReserveMovementType =
  (typeof ReserveMovementType)[keyof typeof ReserveMovementType];

export const TipoDestinoReserva = {
  RESERVA: "reserva",
  OBJETIVO: "objetivo",
  PAGO_FUTURO: "pago_futuro",
} as const;

export type TipoDestinoReserva =
  (typeof TipoDestinoReserva)[keyof typeof TipoDestinoReserva];

export const TipoMovimientoReserva = {
  APORTE: "aporte",
  RETIRADA: "retirada",
  ELIMINADO: "Eliminado",
} as const;

export type TipoMovimientoReserva =
  (typeof TipoMovimientoReserva)[keyof typeof TipoMovimientoReserva];

export const AccountRole = {
  DIARIO: "diario",
  FIJOS: "fijos",
  AHORRO: "ahorro",
  GENERAL: "general",
} as const;

export type AccountRole = (typeof AccountRole)[keyof typeof AccountRole];
