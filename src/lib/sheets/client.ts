import { SHEET_NAMES, FIRST_DATA_ROW } from "@/constants/sheet-structure";

export interface SheetBatchGetResult {
  values: string[][];
  range: string;
}

export class SheetsApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public range: string,
  ) {
    super(message);
    this.name = "SheetsApiError";
  }

  isPermissionError(): boolean {
    return this.statusCode === 403;
  }

  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  isQuotaError(): boolean {
    return this.statusCode === 429;
  }

  isAuthError(): boolean {
    return this.statusCode === 401;
  }

  isNetworkError(): boolean {
    return this.statusCode === 0;
  }
}

export class SheetsAuthError extends SheetsApiError {
  constructor(statusCode: number, message: string, range: string) {
    super(statusCode, message, range);
    this.name = "SheetsAuthError";
  }
}

export class SheetsNetworkError extends SheetsApiError {
  constructor(message: string, range: string) {
    super(0, message, range);
    this.name = "SheetsNetworkError";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("google_access_token");
}

export function hasToken(): boolean {
  return !!getToken();
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("google_access_token");
}

function mapAuthFailure(err: SheetsApiError): SheetsAuthError {
  return new SheetsAuthError(err.statusCode, err.message, err.range);
}

async function unwrapAuth<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof SheetsApiError && e.isAuthError()) {
      clearToken();
      if (typeof window !== "undefined") {
        try {
          window.dispatchEvent(new CustomEvent("appfinanzas:auth-expired"));
        } catch {
        }
      }
      throw mapAuthFailure(e);
    }
    throw e;
  }
}

export async function batchGetSheet(
  spreadsheetId: string,
  range: string,
  accessToken: string,
): Promise<SheetBatchGetResult> {
  return unwrapAuth(async () => {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new SheetsApiError(
        response.status,
        error.error?.message ?? "Failed to read sheet",
        range,
      );
    }

    const data = await response.json();
    return {
      values: data.values ?? [],
      range: data.range ?? range,
    };
  });
}

export async function batchUpdateSheet(
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean)[][],
  accessToken: string,
): Promise<void> {
  await unwrapAuth(async () => {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new SheetsApiError(
        response.status,
        error.error?.message ?? "Failed to update sheet",
        range,
      );
    }
  });
}

export async function appendRowToSheet(
  spreadsheetId: string,
  sheetName: string,
  values: (string | number | boolean)[],
  accessToken: string,
): Promise<void> {
  const range = `${sheetName}!A:A`;

  await unwrapAuth(async () => {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [values] }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new SheetsApiError(
        response.status,
        error.error?.message ?? "Failed to append row",
        range,
      );
    }
  });
}

export async function updateCell(
  spreadsheetId: string,
  sheetName: string,
  cell: string,
  value: string | number | boolean,
  accessToken: string,
): Promise<void> {
  const range = `${sheetName}!${cell}`;

  await unwrapAuth(async () => {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [[value]] }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new SheetsApiError(
        response.status,
        error.error?.message ?? "Failed to update cell",
        range,
      );
    }
  });
}

export { SHEET_NAMES, FIRST_DATA_ROW };
