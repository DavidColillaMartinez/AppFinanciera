import { SHEET_NAMES, FIRST_DATA_ROW } from "@/constants/sheet-structure";

export type SheetRow = Record<string, string | number | boolean>;

export interface SheetColumn {
  index: number;
  header: string;
}

export function rowToObject(headers: string[], row: string[]): SheetRow {
  const obj: SheetRow = {};
  headers.forEach((header, i) => {
    obj[header] = row[i] ?? "";
  });
  return obj;
}

export function objectToRow(
  obj: SheetRow,
  headers: string[],
): (string | number)[] {
  return headers.map((h) => {
    const val = obj[h];
    if (val === undefined || val === null) return "";
    if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
    return String(val);
  });
}

export function findColumnIndex(headers: string[], columnName: string): number {
  const idx = headers.indexOf(columnName);
  if (idx === -1) throw new Error(`Columna no encontrada: ${columnName}`);
  return idx;
}

export function parseBoolean(value: string | number | boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value).trim().toUpperCase();
  return s === "S" || s === "SI" || s === "TRUE" || s === "1" || s === "YES";
}

export function formatBoolean(value: boolean): string {
  return value ? "S" : "N";
}

export function parseOptionalDate(value: string): string {
  if (!value) return "";
  return value;
}

export function parseDate(value: string | number): string {
  if (!value) return "";
  if (typeof value === "number") {
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  return String(value).split("T")[0];
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function generateId(prefix: string = "ID"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function generateMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function parseSheetBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (!value) return false;
  const s = String(value).trim().toUpperCase();
  return s === "S" || s === "SI" || s === "TRUE" || s === "1" || s === "YES";
}

export { SHEET_NAMES, FIRST_DATA_ROW };
