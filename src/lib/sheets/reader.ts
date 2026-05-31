import { SHEET_NAMES, FIRST_DATA_ROW } from "@/constants/sheet-structure";
import { batchGetSheet, SheetsApiError, getToken } from "./client";

export async function readSheetHeaders(
  spreadsheetId: string,
  sheetName: string,
): Promise<string[]> {
  const token = getToken();
  if (!token) throw new Error("No access token");

  const range = `${sheetName}!1:1`;
  const result = await batchGetSheet(spreadsheetId, range, token);

  if (result.values.length === 0) {
    throw new Error(`No headers found in ${sheetName}`);
  }

  return result.values[0].map((v) => String(v));
}

export async function readSheetData<T>(
  spreadsheetId: string,
  sheetName: string,
  rowAdapter: (row: Record<string, string>, headers: string[]) => T,
): Promise<T[]> {
  const token = getToken();
  if (!token) throw new Error("No access token");

  const range = `${sheetName}!${FIRST_DATA_ROW}:1000`;
  const result = await batchGetSheet(spreadsheetId, range, token);

  if (result.values.length === 0) return [];

  const headers = await readSheetHeaders(spreadsheetId, sheetName);

  return result.values
    .filter((row) =>
      row.some((cell) => cell !== "" && cell !== null && cell !== undefined),
    )
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = String(row[i] ?? "");
      });
      return obj;
    })
    .map((obj) => rowAdapter(obj, headers));
}

export async function validateSheetCompatibility(
  spreadsheetId: string,
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const token = getToken();
  if (!token) {
    errors.push("No access token");
    return { valid: false, errors };
  }

  const requiredSheets = Object.values(SHEET_NAMES);

  for (const sheetName of requiredSheets) {
    try {
      const headers = await readSheetHeaders(spreadsheetId, sheetName);
      if (headers.length === 0) {
        errors.push(`Hoja "${sheetName}" vacia o sin encabezados`);
      }
    } catch (e) {
      if (e instanceof SheetsApiError && e.isNotFoundError()) {
        errors.push(`Hoja "${sheetName}" no encontrada`);
      } else {
        errors.push(`Error al leer "${sheetName}": ${(e as Error).message}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
