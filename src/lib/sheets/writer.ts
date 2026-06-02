import {
  batchGetSheet,
  batchUpdateSheet,
  appendRowToSheet,
  updateCell,
  getToken,
} from "./client";
import { SHEET_NAMES, CONFIG_HEADERS } from "@/constants/sheet-structure";

export async function getSheetHeaders(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string,
): Promise<string[]> {
  const result = await batchGetSheet(
    spreadsheetId,
    `${sheetName}!1:1`,
    accessToken,
  );
  if (result.values.length === 0 || result.values[0].length === 0) {
    return [];
  }
  return result.values[0].map((v) => String(v));
}

export async function findRowIndexByColumnValue(
  spreadsheetId: string,
  sheetName: string,
  columnName: string,
  value: string,
  accessToken: string,
): Promise<number | null> {
  const headers = await getSheetHeaders(spreadsheetId, sheetName, accessToken);
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) return null;

  const colLetter = String.fromCharCode(65 + colIndex);
  const range = `${sheetName}!${colLetter}:${colLetter}`;
  const result = await batchGetSheet(spreadsheetId, range, accessToken);

  for (let i = 1; i < result.values.length; i++) {
    if (String(result.values[i][0] ?? "") === value) {
      return i + 1;
    }
  }
  return null;
}

export async function appendModelRow(
  spreadsheetId: string,
  sheetName: string,
  headers: readonly string[],
  data: Record<string, string | number | boolean | undefined>,
  accessToken: string,
): Promise<void> {
  const orderedValues = headers.map((h) => {
    const val = data[h];
    if (val === undefined || val === null) return "";
    if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
    return String(val);
  });

  await appendRowToSheet(spreadsheetId, sheetName, orderedValues, accessToken);
}

export async function updateRowByColumn(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  updates: Record<string, string | number | boolean>,
  accessToken: string,
): Promise<void> {
  const headers = await getSheetHeaders(spreadsheetId, sheetName, accessToken);

  const existingRowRange = `${sheetName}!A${rowIndex}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex}`;
  const existingResult = await batchGetSheet(
    spreadsheetId,
    existingRowRange,
    accessToken,
  );
  const existingValues = existingResult.values[0] ?? [];

  const values: (string | number | boolean)[] = headers.map((h, colIndex) => {
    if (h in updates) {
      const val = updates[h];
      if (val === undefined || val === null) return "";
      if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
      return String(val);
    }
    return existingValues[colIndex] ?? "";
  });

  const range = `${sheetName}!A${rowIndex}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex}`;
  await batchUpdateSheet(spreadsheetId, range, [values], accessToken);
}

export async function softDeleteRow(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  accessToken: string,
): Promise<void> {
  await updateRowByColumn(
    spreadsheetId,
    sheetName,
    rowIndex,
    { deletedAt: new Date().toISOString() },
    accessToken,
  );
}

export interface WriteConfigValuesResult {
  updated: number;
  appended: number;
}

export async function writeConfigValues(
  spreadsheetId: string,
  values: Record<string, string>,
  accessToken: string,
): Promise<WriteConfigValuesResult> {
  const headers = await getSheetHeaders(
    spreadsheetId,
    SHEET_NAMES.CONFIG,
    accessToken,
  );
  const claveIndex = headers.indexOf("Clave");
  const valorIndex = headers.indexOf("Valor");

  if (claveIndex === -1 || valorIndex === -1) {
    throw new Error(
      "La hoja Config no tiene las columnas requeridas (Clave, Valor).",
    );
  }

  const dataRange = `${SHEET_NAMES.CONFIG}!A2:${String.fromCharCode(65 + headers.length - 1)}`;
  const dataResult = await batchGetSheet(spreadsheetId, dataRange, accessToken);

  const rowByClave = new Map<string, number>();
  for (let i = 0; i < dataResult.values.length; i++) {
    const clave = String(dataResult.values[i]?.[claveIndex] ?? "").trim();
    if (clave) {
      rowByClave.set(clave, i + 2);
    }
  }

  let updated = 0;
  let appended = 0;
  const appends: string[][] = [];

  for (const [clave, valor] of Object.entries(values)) {
    const existingRow = rowByClave.get(clave);
    if (existingRow !== undefined) {
      const colLetter = String.fromCharCode(65 + valorIndex);
      const cellRange = `${SHEET_NAMES.CONFIG}!${colLetter}${existingRow}`;
      await batchUpdateSheet(spreadsheetId, cellRange, [[valor]], accessToken);
      updated++;
    } else {
      const row = new Array(headers.length).fill("");
      row[claveIndex] = clave;
      row[valorIndex] = valor;
      appends.push(row);
      appended++;
    }
  }

  if (appends.length > 0) {
    for (const row of appends) {
      const data: Record<string, string | number | boolean | undefined> = {};
      for (let i = 0; i < CONFIG_HEADERS.length; i++) {
        const col = CONFIG_HEADERS[i];
        data[col] = row[i] ?? "";
      }
      await appendModelRow(
        spreadsheetId,
        SHEET_NAMES.CONFIG,
        CONFIG_HEADERS,
        data,
        accessToken,
      );
    }
  }

  return { updated, appended };
}

export { getToken };
