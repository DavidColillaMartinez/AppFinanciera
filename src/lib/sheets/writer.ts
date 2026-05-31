import {
  batchGetSheet,
  batchUpdateSheet,
  appendRowToSheet,
  updateCell,
  getToken,
  type SheetBatchGetResult,
  SheetsApiError,
} from "./client";

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
      return i + 2;
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
  const range = `${sheetName}!A${rowIndex}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex}`;

  const values: (string | number | boolean)[] = headers.map((h) => {
    if (h in updates) {
      const val = updates[h];
      if (val === undefined || val === null) return "";
      if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
      return String(val);
    }
    return "";
  });

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

export { getToken, SheetsApiError };
