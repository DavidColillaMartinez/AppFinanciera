import type {
  TransactionType,
  CategoryType,
  AccountType,
  AccountRole,
  GenericStatus,
  Priority,
  GoalType,
  ReserveType,
  ReserveMovementType,
  TipoDestinoReserva,
  TipoMovimientoReserva,
  Frequency,
} from "@/constants/enums";

export interface ConfigRow {
  Clave: string;
  Valor: string;
  Descripcion: string;
}

export interface TransactionRow {
  id: string;
  fecha: string;
  mesClave: string;
  concepto: string;
  tipo: TransactionType;
  categoria: string;
  importe: number;
  metodo: string;
  cuentaOrigen: string;
  cuentaDestino: string;
  notas: string;
  reservaId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
}

export interface CategoryRow {
  categoriaId: string;
  nombre: string;
  presupuestoMensual: number;
  tipoHabitual: CategoryType;
  activo: "S" | "N";
  grupo: string;
  color: string;
  icono: string;
  orden: number;
  notas: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountRow {
  cuentaId: string;
  nombre: string;
  tipo: AccountType;
  rol: AccountRole;
  moneda: string;
  saldoInicial: number;
  saldoActualManual: number;
  incluirDashboard: "S" | "N";
  activo: "S" | "N";
  color: string;
  notas: string;
  createdAt: string;
  updatedAt: string;
}

export interface FixedExpenseRow {
  fijoId: string;
  concepto: string;
  categoria: string;
  importe: number;
  frecuencia: Frequency;
  diaCargo: number;
  cuentaOrigen: string;
  activo: "S" | "N";
  fechaInicio: string;
  fechaFin: string;
  notas: string;
  createdAt: string;
  updatedAt: string;
}

export interface FuturePaymentRow {
  pagoId: string;
  concepto: string;
  categoria: string;
  importeObjetivo: number;
  fechaVencimiento: string;
  frecuencia: Frequency;
  cuentaReserva: string;
  activo: "S" | "N";
  estado: GenericStatus;
  prioridad: Priority;
  fechaInicio: string;
  saldoReservado: number;
  mesesRestantes: number;
  aporteMensual: number;
  notas: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalRow {
  objetivoId: string;
  nombre: string;
  tipo: GoalType;
  cuentaAhorro: string;
  importeObjetivo: number;
  fechaInicio: string;
  fechaObjetivo: string;
  prioridad: Priority;
  saldoActual: number;
  mesesRestantes: number;
  aporteMensual: number;
  estado: GenericStatus;
  notas: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReserveRow {
  reservaId: string;
  nombre: string;
  tipo: ReserveType;
  importeObjetivo: number;
  saldoActual: number;
  aporteMensualSugerido: number;
  cuentaFisica: string;
  activo: "S" | "N";
  estado: GenericStatus;
  prioridad: Priority;
  fechaInicio: string;
  fechaObjetivo: string;
  notas: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReserveMovementRow {
  id: string;
  fecha: string;
  mesClave: string;
  tipoDestino: TipoDestinoReserva;
  destinoId: string;
  reservaId: string;
  tipoMovimiento: TipoMovimientoReserva;
  importe: number;
  cuentaOrigen: string;
  cuentaDestino: string;
  notas: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPaymentRow {
  aplazadoId: string;
  concepto: string;
  importeTotal: number;
  importePagado: number;
  fechaInicio: string;
  fechaFin: string;
  cuotaMensual: number;
  categoria: string;
  cuentaOrigen: string;
  estado: GenericStatus;
  notas: string;
  createdAt: string;
  updatedAt: string;
}
