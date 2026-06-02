import {
  FIRST_DATA_ROW,
  SHEET_NAMES,
  TEMPLATE_VERSION,
  APP_MIN_VERSION,
} from "@/constants/sheet-structure";
import { batchGetSheet, SheetsApiError, getToken } from "./client";
import type { ConfigRow } from "@/types/models";

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

interface SheetHeaderRequirement {
  required: string[];
  recommended: string[];
}

const SHEET_REQUIRED_HEADERS: Record<string, SheetHeaderRequirement> = {
  [SHEET_NAMES.MOVIMIENTOS]: {
    required: [
      "id",
      "fecha",
      "mesClave",
      "concepto",
      "tipo",
      "categoria",
      "importe",
    ],
    recommended: [
      "metodo",
      "cuentaOrigen",
      "cuentaDestino",
      "notas",
      "reservaId",
      "createdAt",
      "updatedAt",
      "deletedAt",
    ],
  },
  [SHEET_NAMES.CATEGORIAS]: {
    required: ["categoriaId", "nombre", "tipoHabitual", "activo"],
    recommended: [
      "presupuestoMensual",
      "grupo",
      "color",
      "icono",
      "orden",
      "notas",
      "createdAt",
      "updatedAt",
    ],
  },
  [SHEET_NAMES.CUENTAS]: {
    required: ["cuentaId", "nombre", "tipo", "moneda", "activo"],
    recommended: [
      "rol",
      "saldoInicial",
      "saldoActualManual",
      "incluirDashboard",
      "color",
      "notas",
      "createdAt",
      "updatedAt",
    ],
  },
  [SHEET_NAMES.GASTOS_FIJOS]: {
    required: ["fijoId", "concepto", "importe", "frecuencia", "activo"],
    recommended: [
      "categoria",
      "diaCargo",
      "cuentaOrigen",
      "fechaInicio",
      "fechaFin",
      "notas",
      "createdAt",
      "updatedAt",
    ],
  },
  [SHEET_NAMES.PAGOS_FUTUROS]: {
    required: ["pagoId", "concepto", "importeObjetivo", "activo"],
    recommended: [
      "categoria",
      "fechaVencimiento",
      "frecuencia",
      "cuentaReserva",
      "saldoReservado",
      "mesesRestantes",
      "aporteMensual",
      "notas",
      "createdAt",
      "updatedAt",
    ],
  },
  [SHEET_NAMES.PAGOS_APLAZADOS]: {
    required: ["aplazadoId", "concepto", "importeTotal", "estado"],
    recommended: [
      "importePagado",
      "fechaInicio",
      "fechaFin",
      "cuotaMensual",
      "categoria",
      "cuentaOrigen",
      "notas",
      "createdAt",
      "updatedAt",
    ],
  },
  [SHEET_NAMES.RESERVAS]: {
    required: ["reservaId", "nombre", "tipo", "importeObjetivo", "saldoActual", "activo"],
    recommended: [
      "aporteMensualSugerido",
      "cuentaFisica",
      "prioridad",
      "notas",
      "createdAt",
      "updatedAt",
    ],
  },
  [SHEET_NAMES.OBJETIVOS]: {
    required: ["objetivoId", "nombre", "tipo", "importeObjetivo", "estado"],
    recommended: [
      "cuentaAhorro",
      "fechaObjetivo",
      "prioridad",
      "saldoActual",
      "mesesRestantes",
      "aporteMensual",
      "notas",
      "createdAt",
      "updatedAt",
    ],
  },
  [SHEET_NAMES.MOV_RESERVAS]: {
    required: ["id", "fecha", "importe", "tipoMovimiento"],
    recommended: [
      "mesClave",
      "tipoDestino",
      "destinoId",
      "reservaId",
      "cuentaOrigen",
      "cuentaDestino",
      "notas",
      "createdAt",
      "updatedAt",
    ],
  },
  [SHEET_NAMES.CONFIG]: {
    required: ["Clave", "Valor"],
    recommended: ["Descripcion"],
  },
};

export interface SheetMissingColumn {
  sheet: string;
  column: string;
  category: "required" | "recommended";
}

export interface SheetVersionInfo {
  appVersion: string;
  appMinVersion: string;
  sheetVersion: string | null;
  sheetMinVersion: string | null;
  compatible: boolean;
  warnings: string[];
}

export async function validateSheetCompatibility(
  spreadsheetId: string,
  requiredSheets?: string[],
  options?: { recommendedOnly?: boolean },
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing: SheetMissingColumn[];
  version: SheetVersionInfo;
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing: SheetMissingColumn[] = [];
  const token = getToken();
  if (!token) {
    errors.push("No access token. Por favor, conecta con Google.");
    return {
      valid: false,
      errors,
      warnings,
      missing,
      version: buildEmptyVersionInfo(),
    };
  }

  const sheetsToCheck = requiredSheets ?? Object.values(SHEET_NAMES);

  for (const sheetName of sheetsToCheck) {
    const requirement = SHEET_REQUIRED_HEADERS[sheetName];
    if (!requirement) continue;

    try {
      const headers = await readSheetHeaders(spreadsheetId, sheetName);

      if (headers.length === 0) {
        errors.push(
          `Hoja "${sheetName}" no tiene encabezados. Asegurate de que la hoja existe y tiene datos.`,
        );
        continue;
      }

      const missingRequired = requirement.required.filter(
        (h) => !headers.includes(h),
      );
      const missingRecommended = requirement.recommended.filter(
        (h) => !headers.includes(h),
      );

      if (missingRequired.length > 0 && !options?.recommendedOnly) {
        errors.push(
          `Hoja "${sheetName}" faltan columnas obligatorias: ${missingRequired.join(", ")}`,
        );
      }

      for (const column of missingRequired) {
        missing.push({ sheet: sheetName, column, category: "required" });
      }
      for (const column of missingRecommended) {
        missing.push({ sheet: sheetName, column, category: "recommended" });
      }

      if (missingRecommended.length > 0) {
        warnings.push(
          `Hoja "${sheetName}" faltan columnas recomendadas: ${missingRecommended.join(", ")} (la app las generara al guardar).`,
        );
      }

      const knownHeaders = new Set([
        ...requirement.required,
        ...requirement.recommended,
      ]);
      const extraHeaders = headers.filter(
        (h) => !knownHeaders.has(h) && !h.startsWith("_"),
      );
      if (
        extraHeaders.length > 0 &&
        missingRequired.length === 0 &&
        missingRecommended.length === 0
      ) {
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

  const version = await readSheetVersionInfo(spreadsheetId, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missing,
    version,
  };
}

function buildEmptyVersionInfo(): SheetVersionInfo {
  return {
    appVersion: TEMPLATE_VERSION,
    appMinVersion: APP_MIN_VERSION,
    sheetVersion: null,
    sheetMinVersion: null,
    compatible: true,
    warnings: [],
  };
}

function compareSemver(a: string, b: string): number {
  const parse = (v: string) =>
    v
      .split(".")
      .map((n) => Number.parseInt(n, 10) || 0);
  const [aMaj, aMin, aPatch] = parse(a);
  const [bMaj, bMin, bPatch] = parse(b);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPatch - bPatch;
}

async function readSheetVersionInfo(
  spreadsheetId: string,
  warnings: string[],
): Promise<SheetVersionInfo> {
  const info = buildEmptyVersionInfo();
  try {
    const config = await readConfig(spreadsheetId);
    info.sheetVersion = config["templateVersion"] ?? null;
    info.sheetMinVersion = config["appMinVersion"] ?? null;

    if (info.sheetVersion && compareSemver(info.sheetVersion, info.appVersion) < 0) {
      warnings.push(
        `Tu plantilla es v${info.sheetVersion} y la app espera v${info.appVersion}. Algunas funciones nuevas pueden no estar disponibles.`,
      );
    }
    if (info.sheetMinVersion && compareSemver(info.sheetVersion ?? "0.0.0", info.sheetMinVersion) < 0) {
      warnings.push(
        `Tu plantilla es v${info.sheetVersion}, inferior a la version minima v${info.sheetMinVersion} que requiere la app. Actualiza la plantilla.`,
      );
      info.compatible = false;
    }
    if (compareSemver(info.appVersion, info.sheetMinVersion ?? "0.0.0") < 0) {
      warnings.push(
        `Tu app es v${info.appVersion}, inferior a la version minima v${info.sheetMinVersion} que requiere la plantilla. Actualiza la app.`,
      );
      info.compatible = false;
    }
  } catch (e) {
    warnings.push(
      `No se pudo leer la version de la plantilla: ${(e as Error).message}`,
    );
  }
  return info;
}

export async function readConfig(
  spreadsheetId: string,
): Promise<Record<string, string>> {
  const token = getToken();
  if (!token) throw new Error("No access token");

  const rows = await readSheetData<ConfigRow>(
    spreadsheetId,
    SHEET_NAMES.CONFIG,
    (row) => ({
      Clave: row.Clave ?? "",
      Valor: row.Valor ?? "",
      Descripcion: row.Descripcion ?? "",
    }),
  );

  const result: Record<string, string> = {};
  for (const row of rows) {
    if (!row.Clave) continue;
    result[row.Clave] = row.Valor ?? "";
  }
  return result;
}
