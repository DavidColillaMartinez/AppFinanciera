import { nowISO } from "@/lib/sheets/adapters";
import { getToken } from "@/lib/sheets/writer";
import { SHEET_NAMES, MOVIMIENTOS_HEADERS } from "@/constants/sheet-structure";
import {
  appendModelRow,
  findRowIndexByColumnValue,
  updateRowByColumn,
  writeConfigValues,
} from "@/lib/sheets/writer";
import { readConfig } from "@/lib/sheets/reader";
import { TransactionType } from "@/constants/enums";
import {
  buildSalaryDate,
  buildSalaryMovementId,
  DEFAULT_SALARY_CATEGORY,
  DEFAULT_SALARY_DESCRIPTION,
  parseSalaryConfig,
  serializeSalaryConfig,
  type SalaryConfigRecord,
  type SalaryType,
} from "./salary-config";

export { generateMonthKey } from "@/lib/sheets/adapters";
export {
  buildSalaryMovementId,
  isSalaryMovementId,
  extractMonthKeyFromSalaryId,
  validateSalaryConfig,
  parseSalaryConfig,
  serializeSalaryConfig,
  EMPTY_SALARY_CONFIG,
  SALARY_MOVEMENT_ID_PREFIX,
  DEFAULT_SALARY_DAY,
  DEFAULT_SALARY_DESCRIPTION,
  DEFAULT_SALARY_CATEGORY,
} from "./salary-config";
export type { SalaryConfigRecord, SalaryType, SalaryValidation } from "./salary-config";

export interface ReadSalaryConfigResult {
  config: SalaryConfigRecord;
  raw: Record<string, string>;
}

export async function readSalaryConfigFromSheet(
  sheetId: string,
): Promise<ReadSalaryConfigResult> {
  const raw = await readConfig(sheetId);
  return { config: parseSalaryConfig(raw), raw };
}

export interface WriteSalaryConfigResult {
  updated: number;
  appended: number;
}

export async function writeSalaryConfigToSheet(args: {
  sheetId: string;
  config: SalaryConfigRecord;
}): Promise<WriteSalaryConfigResult> {
  const { sheetId, config } = args;
  const token = getToken();
  if (!token) throw new Error("No access token");
  return writeConfigValues(sheetId, serializeSalaryConfig(config), token);
}

export interface EnsureSalaryResult {
  created: boolean;
  monthKey: string;
  salaryMovementId: string;
}

export async function ensureSalaryForMonth(args: {
  sheetId: string;
  monthKey: string;
  config: SalaryConfigRecord;
  now?: Date;
}): Promise<EnsureSalaryResult> {
  const { sheetId, monthKey, config, now = new Date() } = args;
  const token = getToken();
  if (!token) throw new Error("No access token");

  const salaryMovementId = buildSalaryMovementId(monthKey);

  const existingRow = await findRowIndexByColumnValue(
    sheetId,
    SHEET_NAMES.MOVIMIENTOS,
    "id",
    salaryMovementId,
    token,
  );
  if (existingRow !== null) {
    return { created: false, monthKey, salaryMovementId };
  }

  if (!config.enabled) {
    return { created: false, monthKey, salaryMovementId };
  }

  if (config.type === "variable") {
    return { created: false, monthKey, salaryMovementId };
  }

  if (config.fixedAmount <= 0) {
    return { created: false, monthKey, salaryMovementId };
  }

  const targetMonth = monthKeyFromDate(now);
  if (targetMonth !== monthKey) {
    return { created: false, monthKey, salaryMovementId };
  }

  const movement = buildSalaryMovement({
    salaryMovementId,
    monthKey,
    amount: config.fixedAmount,
    description: config.description || DEFAULT_SALARY_DESCRIPTION,
    destinationAccount: config.destinationAccount,
    day: config.day,
  });

  await appendModelRow(
    sheetId,
    SHEET_NAMES.MOVIMIENTOS,
    MOVIMIENTOS_HEADERS,
    movement,
    token,
  );

  return { created: true, monthKey, salaryMovementId };
}

export interface SaveVariableSalaryResult {
  created: boolean;
  updated: boolean;
  monthKey: string;
  salaryMovementId: string;
  amount: number;
}

export async function saveVariableSalaryForMonth(args: {
  sheetId: string;
  monthKey: string;
  amount: number;
  destinationAccount: string;
  description?: string;
  category?: string;
  day?: number;
}): Promise<SaveVariableSalaryResult> {
  const {
    sheetId,
    monthKey,
    amount,
    destinationAccount,
    description,
    category,
    day,
  } = args;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El importe de la nomina variable debe ser mayor que 0.");
  }
  if (!destinationAccount) {
    throw new Error(
      "La nomina variable necesita una cuenta de destino. Configurala antes de guardar.",
    );
  }
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    throw new Error(`Mes invalido: ${monthKey}`);
  }

  const token = getToken();
  if (!token) throw new Error("No access token");

  const salaryMovementId = buildSalaryMovementId(monthKey);
  const safeDay = Math.max(1, Math.min(28, Math.floor(day ?? 1)));

  const existingRow = await findRowIndexByColumnValue(
    sheetId,
    SHEET_NAMES.MOVIMIENTOS,
    "id",
    salaryMovementId,
    token,
  );

  if (existingRow === null) {
    const movement = buildSalaryMovement({
      salaryMovementId,
      monthKey,
      amount,
      description: description || DEFAULT_SALARY_DESCRIPTION,
      destinationAccount,
      day: safeDay,
      category: category || DEFAULT_SALARY_CATEGORY,
    });
    await appendModelRow(
      sheetId,
      SHEET_NAMES.MOVIMIENTOS,
      MOVIMIENTOS_HEADERS,
      movement,
      token,
    );
    return { created: true, updated: false, monthKey, salaryMovementId, amount };
  }

  const now = nowISO();
  await updateRowByColumn(
    sheetId,
    SHEET_NAMES.MOVIMIENTOS,
    existingRow,
    {
      fecha: buildSalaryDate(monthKey, safeDay),
      mesClave: monthKey,
      concepto: description || DEFAULT_SALARY_DESCRIPTION,
      tipo: TransactionType.INGRESO as string,
      categoria: category || DEFAULT_SALARY_CATEGORY,
      importe: amount,
      metodo: "",
      cuentaOrigen: "",
      cuentaDestino: destinationAccount,
      notas: "Nomina variable guardada por el usuario",
      reservaId: "",
      updatedAt: now,
    },
    token,
  );

  return { created: false, updated: true, monthKey, salaryMovementId, amount };
}

function monthKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function buildSalaryMovement(args: {
  salaryMovementId: string;
  monthKey: string;
  amount: number;
  description: string;
  destinationAccount: string;
  day: number;
  category?: string;
}): Record<string, string | number> {
  const now = nowISO();
  return {
    id: args.salaryMovementId,
    fecha: buildSalaryDate(args.monthKey, args.day),
    mesClave: args.monthKey,
    concepto: args.description,
    tipo: TransactionType.INGRESO as string,
    categoria: args.category ?? DEFAULT_SALARY_CATEGORY,
    importe: args.amount,
    metodo: "",
    cuentaOrigen: "",
    cuentaDestino: args.destinationAccount,
    notas: "Nomina añadida automaticamente por la app",
    reservaId: "",
    createdAt: now,
    updatedAt: now,
    deletedAt: "",
  };
}
