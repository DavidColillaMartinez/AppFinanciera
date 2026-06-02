import { readConfig } from "@/lib/sheets/reader";
import {
  appendModelRow,
  findRowIndexByColumnValue,
  getToken,
  updateRowByColumn,
  writeConfigValues,
} from "@/lib/sheets/writer";
import { SHEET_NAMES, MOVIMIENTOS_HEADERS, FIXED_CONFIG_KEYS } from "@/constants/sheet-structure";
import { TransactionType } from "@/constants/enums";
import { nowISO } from "@/lib/sheets/adapters";
import type { FixedExpenseRow } from "@/types/models";
import type { MonthKey } from "@/lib/finance/finance-engine";

export const FIXED_CONFIRMATION_ID_PREFIX = "TX-FIJO-";
export const FIXED_NOTE_PREFIX = "Gasto fijo confirmado";

export function buildFixedExpenseMovementId(
  monthKey: MonthKey,
  fijoId: string,
): string {
  return `${FIXED_CONFIRMATION_ID_PREFIX}${monthKey}-${fijoId}`;
}

export function isFixedExpenseMovementId(id: string): boolean {
  return id.startsWith(FIXED_CONFIRMATION_ID_PREFIX);
}

export function buildFixedExpenseConfirmationKey(monthKey: MonthKey): string {
  return `${FIXED_CONFIG_KEYS.CONFIRMED_PREFIX}${monthKey}`;
}

function parseConfirmedIds(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function serializeConfirmedIds(ids: Iterable<string>): string {
  return Array.from(new Set(ids)).join(",");
}

export async function readConfirmedFixedExpenseIds(args: {
  sheetId: string;
  monthKey: MonthKey;
}): Promise<Set<string>> {
  const config = await readConfig(args.sheetId);
  const key = buildFixedExpenseConfirmationKey(args.monthKey);
  return parseConfirmedIds(config[key]);
}

async function writeConfirmedFixedExpenseIds(args: {
  sheetId: string;
  monthKey: MonthKey;
  ids: Iterable<string>;
}): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("No access token");
  const key = buildFixedExpenseConfirmationKey(args.monthKey);
  await writeConfigValues(
    args.sheetId,
    { [key]: serializeConfirmedIds(args.ids) },
    token,
  );
}

export interface ProposedFixedExpenseDraft {
  importe: number;
  categoria: string;
  cuentaOrigen: string;
  metodo: string;
  fecha: string;
  notas?: string;
}

export interface FixedExpenseProposal {
  fijo: FixedExpenseRow;
  movementId: string;
  alreadyConfirmed: boolean;
  proposedImporte: number;
  proposedCategoria: string;
  proposedCuentaOrigen: string;
  proposedMetodo: string;
  proposedFecha: string;
  proposedNotas: string;
}

export function buildProposal(args: {
  fijo: FixedExpenseRow;
  monthKey: MonthKey;
  alreadyConfirmed: boolean;
}): FixedExpenseProposal {
  const { fijo, monthKey, alreadyConfirmed } = args;
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const safeDay = Math.max(1, Math.min(28, Math.floor(fijo.diaCargo || 1)));
  const fecha = `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
  return {
    fijo,
    movementId: buildFixedExpenseMovementId(monthKey, fijo.fijoId),
    alreadyConfirmed,
    proposedImporte: fijo.importe,
    proposedCategoria: fijo.categoria,
    proposedCuentaOrigen: fijo.cuentaOrigen,
    proposedMetodo: "",
    proposedFecha: fecha,
    proposedNotas: `${FIXED_NOTE_PREFIX}: ${fijo.concepto} (${fijo.fijoId})`,
  };
}

export interface ConfirmFixedExpenseResult {
  created: boolean;
  updated: boolean;
  movementId: string;
  fijoId: string;
}

export async function confirmFixedExpenseForMonth(args: {
  sheetId: string;
  monthKey: MonthKey;
  fijo: FixedExpenseRow;
  draft?: Partial<ProposedFixedExpenseDraft>;
}): Promise<ConfirmFixedExpenseResult> {
  const { sheetId, monthKey, fijo, draft } = args;
  const token = getToken();
  if (!token) throw new Error("No access token");

  const proposal = buildProposal({ fijo, monthKey, alreadyConfirmed: false });
  const importe = draft?.importe ?? proposal.proposedImporte;
  const categoria = draft?.categoria ?? proposal.proposedCategoria;
  const cuentaOrigen = draft?.cuentaOrigen ?? proposal.proposedCuentaOrigen;
  const metodo = draft?.metodo ?? proposal.proposedMetodo;
  const fecha = draft?.fecha ?? proposal.proposedFecha;
  const notas = draft?.notas ?? proposal.proposedNotas;

  if (!Number.isFinite(importe) || importe <= 0) {
    throw new Error(
      `El importe del gasto fijo "${fijo.concepto}" debe ser mayor que 0.`,
    );
  }

  const movementId = proposal.movementId;
  const now = nowISO();

  const existingRow = await findRowIndexByColumnValue(
    sheetId,
    SHEET_NAMES.MOVIMIENTOS,
    "id",
    movementId,
    token,
  );

  if (existingRow !== null) {
    await updateRowByColumn(
      sheetId,
      SHEET_NAMES.MOVIMIENTOS,
      existingRow,
      {
        fecha,
        mesClave: monthKey,
        concepto: fijo.concepto,
        tipo: TransactionType.GASTO as string,
        categoria,
        importe,
        metodo,
        cuentaOrigen,
        cuentaDestino: "",
        notas,
        reservaId: "",
        deletedAt: "",
        updatedAt: now,
      },
      token,
    );
    await addFixedExpenseConfirmation({ sheetId, monthKey, fijoId: fijo.fijoId });
    return { created: false, updated: true, movementId, fijoId: fijo.fijoId };
  }

  const movement = {
    id: movementId,
    fecha,
    mesClave: monthKey,
    concepto: fijo.concepto,
    tipo: TransactionType.GASTO as string,
    categoria,
    importe,
    metodo,
    cuentaOrigen,
    cuentaDestino: "",
    notas,
    reservaId: "",
    createdAt: now,
    updatedAt: now,
    deletedAt: "",
  };

  await appendModelRow(
    sheetId,
    SHEET_NAMES.MOVIMIENTOS,
    MOVIMIENTOS_HEADERS,
    movement,
    token,
  );

  await addFixedExpenseConfirmation({ sheetId, monthKey, fijoId: fijo.fijoId });

  return { created: true, updated: false, movementId, fijoId: fijo.fijoId };
}

export async function addFixedExpenseConfirmation(args: {
  sheetId: string;
  monthKey: MonthKey;
  fijoId: string;
}): Promise<void> {
  const ids = await readConfirmedFixedExpenseIds({
    sheetId: args.sheetId,
    monthKey: args.monthKey,
  });
  ids.add(args.fijoId);
  await writeConfirmedFixedExpenseIds({
    sheetId: args.sheetId,
    monthKey: args.monthKey,
    ids,
  });
}

export async function removeFixedExpenseConfirmation(args: {
  sheetId: string;
  monthKey: MonthKey;
  fijoId: string;
}): Promise<void> {
  const ids = await readConfirmedFixedExpenseIds({
    sheetId: args.sheetId,
    monthKey: args.monthKey,
  });
  ids.delete(args.fijoId);
  await writeConfirmedFixedExpenseIds({
    sheetId: args.sheetId,
    monthKey: args.monthKey,
    ids,
  });
}

export interface UnconfirmFixedExpenseResult {
  movementDeleted: boolean;
  confirmationRemoved: boolean;
}

export async function unconfirmFixedExpenseForMonth(args: {
  sheetId: string;
  monthKey: MonthKey;
  fijoId: string;
}): Promise<UnconfirmFixedExpenseResult> {
  const { sheetId, monthKey, fijoId } = args;
  const token = getToken();
  if (!token) throw new Error("No access token");

  const movementId = buildFixedExpenseMovementId(monthKey, fijoId);
  const existingRow = await findRowIndexByColumnValue(
    sheetId,
    SHEET_NAMES.MOVIMIENTOS,
    "id",
    movementId,
    token,
  );

  let movementDeleted = false;
  if (existingRow !== null) {
    await updateRowByColumn(
      sheetId,
      SHEET_NAMES.MOVIMIENTOS,
      existingRow,
      { deletedAt: nowISO(), updatedAt: nowISO() },
      token,
    );
    movementDeleted = true;
  }

  await removeFixedExpenseConfirmation({ sheetId, monthKey, fijoId });
  return { movementDeleted, confirmationRemoved: true };
}

export interface ConfirmAllResult {
  confirmedCount: number;
  updatedCount: number;
  skippedCount: number;
  failures: Array<{ fijoId: string; error: string }>;
}

export async function confirmAllPendingFixedExpensesForMonth(args: {
  sheetId: string;
  monthKey: MonthKey;
  fijos: FixedExpenseRow[];
  alreadyConfirmed: ReadonlySet<string>;
}): Promise<ConfirmAllResult> {
  const result: ConfirmAllResult = {
    confirmedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failures: [],
  };

  for (const fijo of args.fijos) {
    if (fijo.activo !== "S") {
      result.skippedCount++;
      continue;
    }
    if (fijo.importe <= 0) {
      result.skippedCount++;
      continue;
    }
    const isAlready = args.alreadyConfirmed.has(fijo.fijoId);
    try {
      const r = await confirmFixedExpenseForMonth({
        sheetId: args.sheetId,
        monthKey: args.monthKey,
        fijo,
      });
      if (r.created) result.confirmedCount++;
      if (r.updated) result.updatedCount++;
      if (isAlready) result.skippedCount++;
    } catch (e) {
      result.failures.push({
        fijoId: fijo.fijoId,
        error: (e as Error).message,
      });
    }
  }

  return result;
}
