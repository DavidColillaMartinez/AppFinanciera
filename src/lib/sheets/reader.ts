import {
  FIRST_DATA_ROW,
  SHEET_NAMES,
  MOVIMIENTOS_HEADERS,
  CATEGORIAS_HEADERS,
  CUENTAS_HEADERS,
  GASTOS_FIJOS_HEADERS,
  PAGOS_FUTUROS_HEADERS,
  PAGOS_APLAZADOS_HEADERS,
  MOV_RESERVAS_HEADERS,
} from "@/constants/sheet-structure";
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

  const headers = await readSheetHeaders(spreadsheetId, sheetName);
  const range = `${sheetName}!${FIRST_DATA_ROW}:1000`;
  const result = await batchGetSheet(spreadsheetId, range, token);

  if (result.values.length === 0) return [];

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

const SHEET_REQUIRED_HEADERS: Record<string, string[]> = {
  [SHEET_NAMES.MOVIMIENTOS]: [...MOVIMIENTOS_HEADERS],
  [SHEET_NAMES.CATEGORIAS]: [...CATEGORIAS_HEADERS],
  [SHEET_NAMES.CUENTAS]: [...CUENTAS_HEADERS],
  [SHEET_NAMES.GASTOS_FIJOS]: [...GASTOS_FIJOS_HEADERS],
  [SHEET_NAMES.PAGOS_FUTUROS]: [...PAGOS_FUTUROS_HEADERS],
  [SHEET_NAMES.PAGOS_APLAZADOS]: [...PAGOS_APLAZADOS_HEADERS],
  [SHEET_NAMES.RESERVAS]: ["reservaId", "nombre", "tipo", "importeObjetivo", "saldoActual", "activo"],
  [SHEET_NAMES.OBJETIVOS]: ["objetivoId", "nombre", "tipo", "importeObjetivo", "estado"],
  [SHEET_NAMES.MOV_RESERVAS]: [...MOV_RESERVAS_HEADERS],
  [SHEET_NAMES.CONFIG]: ["Clave", "Valor"],
};

export async function validateSheetCompatibility(
  spreadsheetId: string,
  requiredSheets?: string[],
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const token = getToken();
  if (!token) {
    errors.push("No access token. Por favor, conecta con Google.");
    return { valid: false, errors, warnings };
  }

  const sheetsToCheck = requiredSheets ?? Object.values(SHEET_NAMES);

  for (const sheetName of sheetsToCheck) {
    const requiredHeaders = SHEET_REQUIRED_HEADERS[sheetName];
    if (!requiredHeaders) continue;

    try {
      const headers = await readSheetHeaders(spreadsheetId, sheetName);

      if (headers.length === 0) {
        errors.push(
          `Hoja "${sheetName}" no tiene encabezados. Asegurate de que la hoja existe y tiene datos.`,
        );
        continue;
      }

      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h),
      );
      if (missingHeaders.length > 0) {
        errors.push(
          `Hoja "${sheetName}" faltan columnas: ${missingHeaders.join(", ")}`,
        );
      }

      const extraHeaders = headers.filter(
        (h) => !requiredHeaders.includes(h) && !h.startsWith("_"),
      );
      if (extraHeaders.length > 0 && missingHeaders.length === 0) {
        warnings.push(
          `Hoja "${sheetName}" tiene columnas extra no reconocidas: ${extraHeaders.join(", ")}. Pueden ignorarse.`,
        );
      }
    } catch (e) {
      if (e instanceof SheetsApiError && e.isNotFoundError()) {
        errors.push(
          `Hoja "${sheetName}" no encontrada. Crea la hoja en tu documento Google Sheets.`,
        );
      } else if (e instanceof SheetsApiError && e.isPermissionError()) {
        errors.push(
          `Sin permisos para leer "${sheetName}". Comparte la hoja con la cuenta de Google usada.`,
        );
      } else {
        errors.push(
          `Error al leer "${sheetName}": ${(e as Error).message}`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
