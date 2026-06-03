"use client";

import { getToken } from "@/lib/sheets/client";

export interface DriveCopyResult {
  fileId: string;
  name: string;
  webViewLink?: string;
}

function getTemplateSheetId(): string | null {
  if (typeof window === "undefined") return null;
  return (
    process.env.NEXT_PUBLIC_TEMPLATE_SPREADSHEET_ID ??
    "1NQk-eJkPgE46V1sbe0KQ67_ZkUcfvdv-RXN99r-mZXc"
  );
}

export function getTemplateSheetIdOrThrow(): string {
  const id = getTemplateSheetId();
  if (!id) {
    throw new Error(
      "NEXT_PUBLIC_TEMPLATE_SPREADSHEET_ID no configurado. " +
        "Añádelo en las variables de entorno de Vercel.",
    );
  }
  return id;
}

export async function copyTemplateToUserDrive(
  templateFileId: string,
): Promise<DriveCopyResult> {
  const token = getToken();
  if (!token) {
    throw new Error(
      "No hay sesión de Google. Inicia sesión primero.",
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const name = `AppFinanciera - Mis finanzas - ${today}`;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${templateFileId}/copy`,
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
    const error = await response.json().catch(() => ({}));
    const message = error.error?.message ?? "Error al copiar la plantilla";

    if (response.status === 403) {
      throw new Error(
        "No tienes permisos para copiar la plantilla. " +
          "Puede que necesites reconectar Google para autorizar el permiso de Drive. " +
          "Ve a 'Volver a inicio de sesión', inicia sesión de nuevo y acepta el nuevo permiso.",
      );
    }
    if (response.status === 404) {
      throw new Error(
        "Plantilla oficial no encontrada. Contacta con soporte.",
      );
    }
    if (response.status === 429) {
      throw new Error(
        "Demasiadas solicitudes. Inténtalo de nuevo en unos segundos.",
      );
    }

    throw new Error(`Error al copiar la plantilla: ${message}`);
  }

  const data = await response.json();
  return {
    fileId: data.id,
    name: data.name,
    webViewLink: data.webViewLink,
  };
}
