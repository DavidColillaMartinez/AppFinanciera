import { SHEET_NAMES, MOV_RESERVAS_HEADERS } from "@/constants/sheet-structure";
import {
  TipoDestinoReserva,
  TipoMovimientoReserva,
  type TipoDestinoReserva as TipoDestinoReservaType,
  type TipoMovimientoReserva as TipoMovimientoReservaType,
} from "@/constants/enums";
import {
  appendModelRow,
  findRowIndexByColumnValue,
  getToken,
  updateRowByColumn,
} from "@/lib/sheets/writer";
import { readSheetData } from "@/lib/sheets/reader";
import { generateMonthKey, nowISO } from "@/lib/sheets/adapters";
import type { ReserveMovementRow } from "@/types/models";
import type { MonthKey } from "./finance-engine";

export const LEDGER_ID_PREFIX = "LEDGER-";
export const MONTHLY_PLANNED_SAVING_ID_PREFIX = "LEDGER-MONTHLY-";
export const CONTRIBUTION_ID_PREFIX = "LEDGER-CONTRIB-";
export const WITHDRAWAL_ID_PREFIX = "LEDGER-WITHDRAW-";
export const DELETED_SENTINEL = "Eliminado";

export interface SavingsTarget {
  tipoDestino: TipoDestinoReservaType;
  destinoId: string;
}

export interface SavingsContributionInput {
  tipoDestino: TipoDestinoReservaType;
  destinoId: string;
  reservaId: string;
  importe: number;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  notas?: string;
  fecha?: string;
}

export interface SavingsWithdrawalInput {
  tipoDestino: TipoDestinoReservaType;
  destinoId: string;
  reservaId: string;
  importe: number;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  notas?: string;
  fecha?: string;
}

export interface ConfirmMonthlyPlannedSavingInput {
  monthKey: MonthKey;
  tipoDestino: TipoDestinoReservaType;
  destinoId: string;
  reservaId: string;
  importe: number;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  notas?: string;
}

export interface ConfirmMonthlyPlannedSavingResult {
  created: boolean;
  updated: boolean;
  movementId: string;
  monthKey: MonthKey;
  tipoDestino: TipoDestinoReservaType;
  destinoId: string;
}

export interface UnconfirmMonthlyPlannedSavingResult {
  removed: boolean;
  movementId: string;
}

export function normalizeTipoMovimiento(
  raw: string,
): ReserveMovementRow["tipoMovimiento"] {
  const value = String(raw ?? "").trim();
  if (
    value === DELETED_SENTINEL ||
    value.toLowerCase() === DELETED_SENTINEL.toLowerCase()
  ) {
    return DELETED_SENTINEL as ReserveMovementRow["tipoMovimiento"];
  }
  const lower = value.toLowerCase();
  if (lower === "retirada" || lower === "disposicion") {
    return TipoMovimientoReserva.RETIRADA;
  }
  return TipoMovimientoReserva.APORTE;
}

export function normalizeTipoDestino(
  raw: string,
): ReserveMovementRow["tipoDestino"] {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === TipoDestinoReserva.OBJETIVO) {
    return TipoDestinoReserva.OBJETIVO;
  }
  if (value === TipoDestinoReserva.PAGO_FUTURO) {
    return TipoDestinoReserva.PAGO_FUTURO;
  }
  return TipoDestinoReserva.RESERVA;
}

export function rowToReserveMovement(
  row: Record<string, string>,
): ReserveMovementRow {
  const reservaId = row.reservaId ?? "";
  const destinoId = row.destinoId ?? reservaId;
  const tipoDestino = normalizeTipoDestino(row.tipoDestino);
  return {
    id: row.id ?? "",
    fecha: row.fecha ?? "",
    mesClave: row.mesClave ?? "",
    tipoDestino,
    destinoId,
    reservaId,
    tipoMovimiento: normalizeTipoMovimiento(row.tipoMovimiento),
    importe: Number(row.importe) || 0,
    cuentaOrigen: row.cuentaOrigen ?? "",
    cuentaDestino: row.cuentaDestino ?? "",
    notas: row.notas ?? "",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

export function isDeletedMovement(m: ReserveMovementRow): boolean {
  if (m.tipoMovimiento === (DELETED_SENTINEL as ReserveMovementRow["tipoMovimiento"])) {
    return true;
  }
  return (m.notas ?? "").includes(`[${DELETED_SENTINEL}]`);
}

export function buildContributionId(args: {
  tipoDestino: TipoDestinoReservaType;
  destinoId: string;
  fecha: string;
  timestamp: number;
}): string {
  const monthKey = generateMonthKey(args.fecha);
  const safeId = args.destinoId.replace(/[^A-Za-z0-9_-]/g, "_");
  return `${CONTRIBUTION_ID_PREFIX}${args.tipoDestino}-${monthKey}-${safeId}-${args.timestamp}`;
}

export function buildWithdrawalId(args: {
  tipoDestino: TipoDestinoReservaType;
  destinoId: string;
  fecha: string;
  timestamp: number;
}): string {
  const monthKey = generateMonthKey(args.fecha);
  const safeId = args.destinoId.replace(/[^A-Za-z0-9_-]/g, "_");
  return `${WITHDRAWAL_ID_PREFIX}${args.tipoDestino}-${monthKey}-${safeId}-${args.timestamp}`;
}

export function buildMonthlyPlannedSavingId(args: {
  monthKey: MonthKey;
  tipoDestino: TipoDestinoReservaType;
  destinoId: string;
}): string {
  const safeId = args.destinoId.replace(/[^A-Za-z0-9_-]/g, "_");
  return `${MONTHLY_PLANNED_SAVING_ID_PREFIX}${args.monthKey}-${args.tipoDestino}-${safeId}`;
}

export function isMonthlyPlannedSavingId(id: string): boolean {
  return id.startsWith(MONTHLY_PLANNED_SAVING_ID_PREFIX);
}

export function isLedgerId(id: string): boolean {
  return id.startsWith(LEDGER_ID_PREFIX);
}

export function getActiveMovements(
  movements: ReserveMovementRow[],
): ReserveMovementRow[] {
  return movements.filter((m) => m.id && !isDeletedMovement(m));
}

export function getEntriesForTarget(
  movements: ReserveMovementRow[],
  target: SavingsTarget,
): ReserveMovementRow[] {
  return getActiveMovements(movements).filter((m) => {
    if (m.tipoDestino !== target.tipoDestino) return false;
    if (m.destinoId === target.destinoId) return true;
    if (
      target.tipoDestino === TipoDestinoReserva.RESERVA &&
      m.reservaId === target.destinoId
    ) {
      return true;
    }
    return false;
  });
}

export function getEntriesForMonth(
  movements: ReserveMovementRow[],
  monthKey: MonthKey,
): ReserveMovementRow[] {
  return getActiveMovements(movements).filter((m) => {
    const mKey = m.mesClave || (m.fecha ?? "").slice(0, 7);
    return mKey === monthKey;
  });
}

export function getEntriesForTargetAndMonth(
  movements: ReserveMovementRow[],
  target: SavingsTarget,
  monthKey: MonthKey,
): ReserveMovementRow[] {
  return getEntriesForTarget(movements, target).filter((m) => {
    const mKey = m.mesClave || (m.fecha ?? "").slice(0, 7);
    return mKey === monthKey;
  });
}

export function calculateLedgerBalance(
  movements: ReserveMovementRow[],
): number {
  return getActiveMovements(movements).reduce((acc, m) => {
    if (m.tipoMovimiento === TipoMovimientoReserva.APORTE) {
      return acc + m.importe;
    }
    if (m.tipoMovimiento === TipoMovimientoReserva.RETIRADA) {
      return acc - m.importe;
    }
    return acc;
  }, 0);
}

export function calculateLedgerMonthlyTotal(
  movements: ReserveMovementRow[],
  monthKey: MonthKey,
): number {
  return getEntriesForMonth(movements, monthKey)
    .filter((m) => m.tipoMovimiento === TipoMovimientoReserva.APORTE)
    .reduce((acc, m) => acc + m.importe, 0);
}

export function calculateLedgerBreakdownByMonth(
  movements: ReserveMovementRow[],
  monthKey: MonthKey,
): { reserva: number; objetivo: number; pago_futuro: number } {
  const entries = getEntriesForMonth(movements, monthKey).filter(
    (m) => m.tipoMovimiento === TipoMovimientoReserva.APORTE,
  );
  let reserva = 0;
  let objetivo = 0;
  let pago_futuro = 0;
  for (const m of entries) {
    if (m.tipoDestino === TipoDestinoReserva.RESERVA) {
      reserva += m.importe;
    } else if (m.tipoDestino === TipoDestinoReserva.OBJETIVO) {
      objetivo += m.importe;
    } else if (m.tipoDestino === TipoDestinoReserva.PAGO_FUTURO) {
      pago_futuro += m.importe;
    }
  }
  return { reserva, objetivo, pago_futuro };
}

export function hasMonthlyPlannedSaving(
  movements: ReserveMovementRow[],
  monthKey: MonthKey,
  target: SavingsTarget,
): boolean {
  return movements.some((m) => {
    if (m.id !== buildMonthlyPlannedSavingId({ monthKey, ...target })) {
      return false;
    }
    return !isDeletedMovement(m);
  });
}

export function getMonthlyPlannedSavingEntry(
  movements: ReserveMovementRow[],
  monthKey: MonthKey,
  target: SavingsTarget,
): ReserveMovementRow | null {
  const id = buildMonthlyPlannedSavingId({ monthKey, ...target });
  const entry = movements.find((m) => m.id === id);
  if (!entry || isDeletedMovement(entry)) return null;
  return entry;
}

export async function readAllReserveMovements(
  sheetId: string,
): Promise<ReserveMovementRow[]> {
  const rows = await readSheetData<ReserveMovementRow>(
    sheetId,
    SHEET_NAMES.MOV_RESERVAS,
    rowToReserveMovement,
  );
  return rows.filter((r) => r.id);
}

export async function createSavingsContribution(args: {
  sheetId: string;
  input: SavingsContributionInput;
}): Promise<ReserveMovementRow> {
  const { sheetId, input } = args;
  if (!sheetId) throw new Error("No sheet connected");
  const token = getToken();
  if (!token) throw new Error("No access token");
  if (!(input.importe > 0)) {
    throw new Error("El importe del aporte debe ser mayor que 0.");
  }

  const fecha = input.fecha ?? new Date().toISOString().split("T")[0];
  const now = nowISO();
  const timestamp = Date.now();
  const id = buildContributionId({
    tipoDestino: input.tipoDestino,
    destinoId: input.destinoId,
    fecha,
    timestamp,
  });

  const row: ReserveMovementRow = {
    id,
    fecha,
    mesClave: generateMonthKey(fecha),
    tipoDestino: input.tipoDestino,
    destinoId: input.destinoId,
    reservaId: input.reservaId,
    tipoMovimiento: TipoMovimientoReserva.APORTE,
    importe: input.importe,
    cuentaOrigen: input.cuentaOrigen ?? "",
    cuentaDestino: input.cuentaDestino ?? "",
    notas: input.notas ?? "",
    createdAt: now,
    updatedAt: now,
  };

  await appendModelRow(
    sheetId,
    SHEET_NAMES.MOV_RESERVAS,
    MOV_RESERVAS_HEADERS,
    row as unknown as Record<string, string | number | boolean | undefined>,
    token,
  );

  return row;
}

export async function createSavingsWithdrawal(args: {
  sheetId: string;
  input: SavingsWithdrawalInput;
}): Promise<ReserveMovementRow> {
  const { sheetId, input } = args;
  if (!sheetId) throw new Error("No sheet connected");
  const token = getToken();
  if (!token) throw new Error("No access token");
  if (!(input.importe > 0)) {
    throw new Error("El importe de la retirada debe ser mayor que 0.");
  }

  const fecha = input.fecha ?? new Date().toISOString().split("T")[0];
  const now = nowISO();
  const timestamp = Date.now();
  const id = buildWithdrawalId({
    tipoDestino: input.tipoDestino,
    destinoId: input.destinoId,
    fecha,
    timestamp,
  });

  const row: ReserveMovementRow = {
    id,
    fecha,
    mesClave: generateMonthKey(fecha),
    tipoDestino: input.tipoDestino,
    destinoId: input.destinoId,
    reservaId: input.reservaId,
    tipoMovimiento: TipoMovimientoReserva.RETIRADA,
    importe: input.importe,
    cuentaOrigen: input.cuentaOrigen ?? "",
    cuentaDestino: input.cuentaDestino ?? "",
    notas: input.notas ?? "",
    createdAt: now,
    updatedAt: now,
  };

  await appendModelRow(
    sheetId,
    SHEET_NAMES.MOV_RESERVAS,
    MOV_RESERVAS_HEADERS,
    row as unknown as Record<string, string | number | boolean | undefined>,
    token,
  );

  return row;
}

export async function confirmMonthlyPlannedSaving(args: {
  sheetId: string;
  input: ConfirmMonthlyPlannedSavingInput;
}): Promise<ConfirmMonthlyPlannedSavingResult> {
  const { sheetId, input } = args;
  if (!sheetId) throw new Error("No sheet connected");
  const token = getToken();
  if (!token) throw new Error("No access token");
  if (!(input.importe > 0)) {
    throw new Error("El importe del aporte mensual debe ser mayor que 0.");
  }

  const id = buildMonthlyPlannedSavingId({
    monthKey: input.monthKey,
    tipoDestino: input.tipoDestino,
    destinoId: input.destinoId,
  });

  const [yearStr, monthStr] = input.monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const fecha = `${year}-${String(month).padStart(2, "0")}-01`;
  const now = nowISO();

  const existingRow = await findRowIndexByColumnValue(
    sheetId,
    SHEET_NAMES.MOV_RESERVAS,
    "id",
    id,
    token,
  );

  if (existingRow !== null) {
    await updateRowByColumn(
      sheetId,
      SHEET_NAMES.MOV_RESERVAS,
      existingRow,
      {
        fecha,
        mesClave: input.monthKey,
        tipoDestino: input.tipoDestino,
        destinoId: input.destinoId,
        reservaId: input.reservaId,
        tipoMovimiento: TipoMovimientoReserva.APORTE,
        importe: input.importe,
        cuentaOrigen: input.cuentaOrigen ?? "",
        cuentaDestino: input.cuentaDestino ?? "",
        notas: input.notas ?? "",
        updatedAt: now,
      },
      token,
    );
    return {
      created: false,
      updated: true,
      movementId: id,
      monthKey: input.monthKey,
      tipoDestino: input.tipoDestino,
      destinoId: input.destinoId,
    };
  }

  const row: ReserveMovementRow = {
    id,
    fecha,
    mesClave: input.monthKey,
    tipoDestino: input.tipoDestino,
    destinoId: input.destinoId,
    reservaId: input.reservaId,
    tipoMovimiento: TipoMovimientoReserva.APORTE,
    importe: input.importe,
    cuentaOrigen: input.cuentaOrigen ?? "",
    cuentaDestino: input.cuentaDestino ?? "",
    notas: input.notas ?? "",
    createdAt: now,
    updatedAt: now,
  };

  await appendModelRow(
    sheetId,
    SHEET_NAMES.MOV_RESERVAS,
    MOV_RESERVAS_HEADERS,
    row as unknown as Record<string, string | number | boolean | undefined>,
    token,
  );

  return {
    created: true,
    updated: false,
    movementId: id,
    monthKey: input.monthKey,
    tipoDestino: input.tipoDestino,
    destinoId: input.destinoId,
  };
}

export async function unconfirmMonthlyPlannedSaving(args: {
  sheetId: string;
  monthKey: MonthKey;
  tipoDestino: TipoDestinoReservaType;
  destinoId: string;
}): Promise<UnconfirmMonthlyPlannedSavingResult> {
  const { sheetId, monthKey, tipoDestino, destinoId } = args;
  if (!sheetId) throw new Error("No sheet connected");
  const token = getToken();
  if (!token) throw new Error("No access token");

  const id = buildMonthlyPlannedSavingId({ monthKey, tipoDestino, destinoId });
  const existingRow = await findRowIndexByColumnValue(
    sheetId,
    SHEET_NAMES.MOV_RESERVAS,
    "id",
    id,
    token,
  );

  if (existingRow === null) {
    return { removed: false, movementId: id };
  }

  await updateRowByColumn(
    sheetId,
    SHEET_NAMES.MOV_RESERVAS,
    existingRow,
    {
      tipoMovimiento: DELETED_SENTINEL as TipoMovimientoReservaType,
      updatedAt: nowISO(),
    },
    token,
  );

  return { removed: true, movementId: id };
}

export async function updateReserveMovement(args: {
  sheetId: string;
  id: string;
  tipoMovimiento?: TipoMovimientoReservaType;
  importe?: number;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  notas?: string;
  fecha?: string;
}): Promise<void> {
  const { sheetId, id } = args;
  if (!sheetId) throw new Error("No sheet connected");
  const token = getToken();
  if (!token) throw new Error("No access token");

  const rowIndex = await findRowIndexByColumnValue(
    sheetId,
    SHEET_NAMES.MOV_RESERVAS,
    "id",
    id,
    token,
  );
  if (rowIndex === null) throw new Error("Movimiento no encontrado");

  const updates: Record<string, string | number> = {
    updatedAt: nowISO(),
  };
  if (args.tipoMovimiento !== undefined) {
    updates.tipoMovimiento = normalizeTipoMovimiento(args.tipoMovimiento);
  }
  if (args.importe !== undefined) updates.importe = args.importe;
  if (args.cuentaOrigen !== undefined) updates.cuentaOrigen = args.cuentaOrigen;
  if (args.cuentaDestino !== undefined)
    updates.cuentaDestino = args.cuentaDestino;
  if (args.notas !== undefined) updates.notas = args.notas;
  if (args.fecha !== undefined) {
    updates.fecha = args.fecha;
    updates.mesClave = generateMonthKey(args.fecha);
  }

  await updateRowByColumn(
    sheetId,
    SHEET_NAMES.MOV_RESERVAS,
    rowIndex,
    updates,
    token,
  );
}

export async function softDeleteReserveMovement(args: {
  sheetId: string;
  id: string;
}): Promise<void> {
  await updateReserveMovement({
    sheetId: args.sheetId,
    id: args.id,
    tipoMovimiento: DELETED_SENTINEL as TipoMovimientoReservaType,
  });
}
