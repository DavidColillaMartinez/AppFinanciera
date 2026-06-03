"use client";

import { getToken } from "@/lib/sheets/client";

export const OFFICIAL_TEMPLATE_ID =
  "1NQk-eJkPgE46V1sbe0KQ67_ZkUcfvdv-RXN99r-mZXc";

export const OFFICIAL_TEMPLATE_URL = `https://docs.google.com/spreadsheets/d/${OFFICIAL_TEMPLATE_ID}/edit?usp=sharing`;

export const MANUAL_COPY_URL = `https://docs.google.com/spreadsheets/d/${OFFICIAL_TEMPLATE_ID}/copy`;

export interface DriveCopyResult {
  fileId: string;
  name: string;
  webViewLink?: string;
}

export interface TemplateIdValidation {
  valid: boolean;
  id: string;
  error: string | null;
}

export function validateTemplateId(id: string): TemplateIdValidation {
  const trimmed = id.trim();

  if (!trimmed) {
    return { valid: false, id: trimmed, error: "Falta configurar la plantilla oficial." };
  }

  if (!/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return { valid: false, id: trimmed, error: "El ID de la plantilla oficial no es válido." };
  }

  return { valid: true, id: trimmed, error: null };
}

export function getTemplateSheetIdOrThrow(): string {
  const raw =
    process.env.NEXT_PUBLIC_TEMPLATE_SPREADSHEET_ID ?? OFFICIAL_TEMPLATE_ID;

  const { valid, id, error } = validateTemplateId(raw);

  if (!valid) {
    throw new Error(error ?? "Plantilla oficial no configurada.");
  }

  return id;
}

export async function copyTemplateToUserDrive(
  templateFileId: string,
): Promise<DriveCopyResult> {
  const token = getToken();
  if (!token) {
    throw new CopyError(401, "No hay sesión de Google. Inicia sesión primero.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const name = `AppFinanciera - Mis finanzas - ${today}`;

  console.info("[drive-copy] templateFileId:", templateFileId);
  console.info("[drive-copy] endpoint:", `POST /drive/v3/files/${templateFileId}/copy`);

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(templateFileId)}/copy`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    },
  );

  if (!response.ok) {
    let reason = "unknown";
    let message = "Error al copiar la plantilla";

    try {
      const body = await response.json();
      reason = body.error?.errors?.[0]?.reason ?? body.error?.status ?? "unknown";
      message = body.error?.message ?? message;
    } catch {
      // ignore parse failure
    }

    console.info("[drive-copy] HTTP", response.status, "reason:", reason, "message:", message);

    throw new CopyError(response.status, message, reason);
  }

  const data = await response.json();

  console.info("[drive-copy] success — copied fileId:", data.id);

  return {
    fileId: data.id,
    name: data.name,
    webViewLink: data.webViewLink,
  };
}

export class CopyError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
    public readonly googleReason?: string,
  ) {
    super(message);
    this.name = "CopyError";
  }
}

export function userFacingCopyError(err: CopyError): string {
  const status = err.httpStatus;

  if (status === 401) {
    return "Sesión de Google caducada. Vuelve a iniciar sesión.";
  }

  if (status === 403) {
    return (
      "No tienes permisos para copiar la plantilla. " +
      "Puede que necesites reconectar Google para autorizar el permiso de Drive. " +
      "Ve a 'Volver a inicio de sesión', inicia sesión de nuevo y acepta el nuevo permiso. " +
      "También puedes crear una copia manual desde el botón de abajo."
    );
  }

  if (status === 404) {
    return (
      "No se pudo acceder a la plantilla oficial a través de Drive. " +
      "Crea una copia manual desde el botón de abajo."
    );
  }

  if (status === 429) {
    return "Demasiadas solicitudes. Inténtalo de nuevo en unos segundos.";
  }

  return `Error al copiar la plantilla (HTTP ${status}). Crea una copia manual desde el botón de abajo.`;
}
