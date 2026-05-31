import { appendRowToSheet, updateCell, getToken } from "./client";
import { z } from "zod";

export async function createRow<T extends z.ZodTypeAny>(
  spreadsheetId: string,
  sheetName: string,
  schema: T,
  data: z.infer<T>,
): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("No access token");

  const validated = schema.parse(data) as Record<
    string,
    string | number | boolean
  >;
  const headers = Object.keys(validated);
  const values = headers.map((h) => validated[h]);

  await appendRowToSheet(spreadsheetId, sheetName, values, token);
}

export async function updateRowById(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  updates: Record<string, string | number | boolean>,
  headers: string[],
  accessToken: string,
): Promise<void> {
  for (const [key, value] of Object.entries(updates)) {
    const colIndex = headers.indexOf(key);
    if (colIndex === -1) continue;

    const colLetter = String.fromCharCode(65 + colIndex);
    const cell = `${colLetter}${rowIndex}`;

    await updateCell(spreadsheetId, sheetName, cell, value, accessToken);
  }
}

export async function softDeleteRow(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  accessToken: string,
): Promise<void> {
  const colLetter = String.fromCharCode(65);
  const cell = `${colLetter}${rowIndex}`;

  await updateCell(
    spreadsheetId,
    sheetName,
    cell,
    new Date().toISOString(),
    accessToken,
  );
}

export { getToken, SheetsApiError } from "./client";
