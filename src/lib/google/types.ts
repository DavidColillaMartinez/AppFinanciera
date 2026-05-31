export interface GoogleTokens {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface SheetConnection {
  sheetId: string;
  spreadsheetUrl: string;
  title: string;
  connected: boolean;
}

export function parseSheetId(input: string): string | null {
  const trimmed = input.trim();

  const urlPattern = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = trimmed.match(urlPattern);
  if (match) return match[1];

  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;

  return null;
}

export function buildSpreadsheetUrl(sheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}`;
}

export function isValidSheetId(sheetId: string): boolean {
  return /^[a-zA-Z0-9-_]{20,}$/.test(sheetId);
}
