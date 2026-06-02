import { SALARY_CONFIG_KEYS } from "@/constants/sheet-structure";
import type { AccountRow } from "@/types/models";

export const SALARY_MOVEMENT_ID_PREFIX = "TX-SALARY-";
export const DEFAULT_SALARY_DAY = 1;
export const DEFAULT_SALARY_DESCRIPTION = "Nomina mensual";
export const DEFAULT_SALARY_CATEGORY = "Nomina";
export const SALARY_TYPE_FIXED = "fixed" as const;
export const SALARY_TYPE_VARIABLE = "variable" as const;

export type SalaryType = "fixed" | "variable";

export interface SalaryConfigRecord {
  enabled: boolean;
  type: SalaryType;
  fixedAmount: number;
  day: number;
  destinationAccount: string;
  description: string;
  updatedAt: string;
}

export const EMPTY_SALARY_CONFIG: SalaryConfigRecord = {
  enabled: false,
  type: SALARY_TYPE_FIXED,
  fixedAmount: 0,
  day: DEFAULT_SALARY_DAY,
  destinationAccount: "",
  description: DEFAULT_SALARY_DESCRIPTION,
  updatedAt: "",
};

function parseBooleanConfig(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === null) return fallback;
  const v = String(raw).trim().toLowerCase();
  if (v === "true" || v === "1" || v === "s" || v === "si" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "n" || v === "no") return false;
  return fallback;
}

function parseAmountConfig(raw: string | undefined): number {
  if (!raw) return 0;
  const v = Number(String(raw).replace(",", "."));
  return Number.isFinite(v) && v >= 0 ? v : 0;
}

function parseDayConfig(raw: string | undefined): number {
  if (!raw) return DEFAULT_SALARY_DAY;
  const v = Number(raw);
  if (!Number.isFinite(v) || v < 1) return DEFAULT_SALARY_DAY;
  return Math.min(Math.floor(v), 28);
}

function parseSalaryType(raw: string | undefined): SalaryType {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === SALARY_TYPE_VARIABLE) return SALARY_TYPE_VARIABLE;
  return SALARY_TYPE_FIXED;
}

export function parseSalaryConfig(
  configMap: Record<string, string>,
): SalaryConfigRecord {
  return {
    enabled: parseBooleanConfig(configMap[SALARY_CONFIG_KEYS.ENABLED], false),
    type: parseSalaryType(configMap[SALARY_CONFIG_KEYS.TYPE]),
    fixedAmount: parseAmountConfig(configMap[SALARY_CONFIG_KEYS.FIXED_AMOUNT]),
    day: parseDayConfig(configMap[SALARY_CONFIG_KEYS.DAY]),
    destinationAccount:
      configMap[SALARY_CONFIG_KEYS.DESTINATION_ACCOUNT] ?? "",
    description:
      configMap[SALARY_CONFIG_KEYS.DESCRIPTION] ?? DEFAULT_SALARY_DESCRIPTION,
    updatedAt: configMap[SALARY_CONFIG_KEYS.UPDATED_AT] ?? "",
  };
}

export function serializeSalaryConfig(
  config: SalaryConfigRecord,
): Record<string, string> {
  return {
    [SALARY_CONFIG_KEYS.ENABLED]: config.enabled ? "true" : "false",
    [SALARY_CONFIG_KEYS.TYPE]: config.type,
    [SALARY_CONFIG_KEYS.FIXED_AMOUNT]: String(config.fixedAmount),
    [SALARY_CONFIG_KEYS.DAY]: String(config.day),
    [SALARY_CONFIG_KEYS.DESTINATION_ACCOUNT]: config.destinationAccount,
    [SALARY_CONFIG_KEYS.DESCRIPTION]: config.description,
    [SALARY_CONFIG_KEYS.UPDATED_AT]: config.updatedAt,
  };
}

export interface SalaryValidation {
  valid: boolean;
  error?: string;
}

export function validateSalaryConfig(
  config: SalaryConfigRecord,
  accounts: AccountRow[],
): SalaryValidation {
  if (!config.enabled) return { valid: true };

  if (config.type === SALARY_TYPE_FIXED && config.fixedAmount <= 0) {
    return {
      valid: false,
      error: "El importe de la nomina fija debe ser mayor que 0.",
    };
  }

  if (config.day < 1 || config.day > 28) {
    return {
      valid: false,
      error: "El dia de la nomina debe estar entre 1 y 28.",
    };
  }

  if (config.destinationAccount) {
    const account = accounts.find((a) => a.cuentaId === config.destinationAccount);
    if (!account) {
      return {
        valid: false,
        error: "La cuenta de destino seleccionada ya no existe.",
      };
    }
    if (account.activo !== "S") {
      return {
        valid: false,
        error: "La cuenta de destino seleccionada esta inactiva.",
      };
    }
  }

  return { valid: true };
}

export function buildSalaryMovementId(monthKey: string): string {
  return `${SALARY_MOVEMENT_ID_PREFIX}${monthKey}`;
}

export function isSalaryMovementId(id: string): boolean {
  return id.startsWith(SALARY_MOVEMENT_ID_PREFIX);
}

export function extractMonthKeyFromSalaryId(id: string): string | null {
  if (!isSalaryMovementId(id)) return null;
  const monthKey = id.slice(SALARY_MOVEMENT_ID_PREFIX.length);
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return null;
  return monthKey;
}

export function buildSalaryDate(monthKey: string, day: number): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return new Date().toISOString().split("T")[0];
  }
  const safeDay = Math.max(1, Math.min(28, Math.floor(day) || 1));
  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}
