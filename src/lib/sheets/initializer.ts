"use client";

import { getToken } from "@/lib/sheets/client";
import {
  SHEET_NAMES,
  MOVIMIENTOS_HEADERS,
  CATEGORIAS_HEADERS,
  CUENTAS_HEADERS,
  GASTOS_FIJOS_HEADERS,
  PAGOS_FUTUROS_HEADERS,
  PAGOS_APLAZADOS_HEADERS,
  MOV_RESERVAS_HEADERS,
  TEMPLATE_VERSION,
  APP_MIN_VERSION,
} from "@/constants/sheet-structure";
import { DEFAULT_CATEGORIES } from "@/lib/categories/defaults";

export interface CreateSheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export interface InitializeResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  error?: string;
}

const RESERVAS_HEADERS = [
  "reservaId", "nombre", "tipo", "importeObjetivo", "saldoActual", "activo",
  "aporteMensualSugerido", "cuentaFisica", "prioridad", "notas", "createdAt", "updatedAt",
] as const;

const OBJETIVOS_HEADERS = [
  "objetivoId", "nombre", "tipo", "importeObjetivo", "estado",
  "cuentaAhorro", "fechaObjetivo", "prioridad", "saldoActual",
  "mesesRestantes", "aporteMensual", "notas", "createdAt", "updatedAt",
] as const;

const SHEET_TITLE = "AppFinanciera - Mis finanzas";

const ALL_SHEET_NAMES = [
  SHEET_NAMES.CONFIG,
  SHEET_NAMES.MOVIMIENTOS,
  SHEET_NAMES.CATEGORIAS,
  SHEET_NAMES.CUENTAS,
  SHEET_NAMES.GASTOS_FIJOS,
  SHEET_NAMES.PAGOS_FUTUROS,
  SHEET_NAMES.OBJETIVOS,
  SHEET_NAMES.RESERVAS,
  SHEET_NAMES.MOV_RESERVAS,
  SHEET_NAMES.PAGOS_APLAZADOS,
  "00_LEEME",
] as const;

function buildCategoryId(nombre: string): string {
  const slug = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `CAT-${slug}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function buildConfigRows(): string[][] {
  return [
    ["Clave", "Valor", "Descripcion"],
    ["templateVersion", TEMPLATE_VERSION, "Version de estructura de la plantilla. Se actualiza ante cambios incompatibles."],
    ["appMinVersion", APP_MIN_VERSION, "Version minima de la app que entiende esta plantilla."],
    ["currency", "EUR", "Moneda principal."],
    ["locale", "es-ES", "Locale para formateo de numeros y fechas."],
    ["firstDayOfWeek", "1", "Primer dia de la semana: 1=lunes, 7=domingo."],
    ["salary.enabled", "false", "Activa la generacion automatica del movimiento de nomina."],
    ["salary.type", "fixed", "Tipo: fixed | variable."],
    ["salary.fixedAmount", "0", "Importe de la nomina cuando type=fixed."],
    ["salary.day", "1", "Dia del mes en que se anade la nomina."],
    ["salary.destinationAccount", "", "ID de la cuenta destino del movimiento de nomina."],
    ["salary.description", "Nomina", "Concepto por defecto del movimiento de nomina."],
    ["salary.updatedAt", "", "Marca de tiempo de la ultima actualizacion de la nomina."],
    ["schemaLocked", "Si", "No cambiar nombres de columnas si la app esta conectada."],
  ];
}

function buildCategoryRows(): string[][] {
  const now = nowISO();
  return [
    CATEGORIAS_HEADERS.map((h) => h),
    ...DEFAULT_CATEGORIES.map((cat) => [
      buildCategoryId(cat.nombre),
      cat.nombre,
      String(cat.presupuestoMensual),
      cat.tipoHabitual,
      "S",
      cat.grupo,
      cat.color,
      cat.icono,
      "0",
      "",
      now,
      now,
    ]),
  ];
}

function buildHeaderRow(headers: readonly string[]): string[] {
  return [...headers];
}

function buildLeemeRows(): string[][] {
  return [
    ["Clave", "Valor"],
    [
      "PLANTILLA BASE - FINANZAS PERSONALES",
      "AppFinanciera - Hoja creada automaticamente.",
    ],
    [
      "Objetivo",
      "Hoja generada por la app con la estructura oficial (templateVersion 1.1.0).",
    ],
    [
      "Hojas oficiales",
      "Config, Movimientos, Categorias, Cuentas, Gastos_fijos, Pagos_futuros, Objetivos, Reservas, Mov_reservas, Pagos_aplazados.",
    ],
    [
      "Cuentas.rol",
      "Valores permitidos: diario, fijos, ahorro, general. La app usa el rol para calcular Disponible.",
    ],
    [
      "Mov_reservas",
      "Libro de ahorro: tipoDestino=reserva|objetivo|pago_futuro. tipoMovimiento=aporte|retirada.",
    ],
    [
      "Importante",
      "No renombres hojas ni columnas. Para limpiar registros, usa el campo deletedAt en Movimientos.",
    ],
  ];
}

export async function createAndInitializeSheet(): Promise<InitializeResult> {
  const token = getToken();
  if (!token) {
    return {
      success: false,
      spreadsheetId: "",
      spreadsheetUrl: "",
      error: "No hay sesion de Google. Inicia sesion primero.",
    };
  }

  // Step 1: Create the spreadsheet
  let spreadsheetId: string;
  let spreadsheetUrl: string;

  try {
    const createRes = await fetch(
      "https://sheets.googleapis.com/v4/spreadsheets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: { title: SHEET_TITLE },
        }),
      },
    );

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      const status = createRes.status;
      const message = err.error?.message ?? "Error al crear la hoja";

      if (status === 401) {
        return {
          success: false,
          spreadsheetId: "",
          spreadsheetUrl: "",
          error: "Sesion de Google caducada. Vuelve a iniciar sesion.",
        };
      }
      if (status === 403) {
        return {
          success: false,
          spreadsheetId: "",
          spreadsheetUrl: "",
          error:
            "No tienes permisos para crear una hoja de calculo. " +
            "Asegurate de haber iniciado sesion y aceptado los permisos de Google Sheets.",
        };
      }
      if (status === 429) {
        return {
          success: false,
          spreadsheetId: "",
          spreadsheetUrl: "",
          error: "Demasiadas solicitudes. Intentalo de nuevo en unos segundos.",
        };
      }

      return {
        success: false,
        spreadsheetId: "",
        spreadsheetUrl: "",
        error: `Error al crear la hoja: ${message}`,
      };
    }

    const data = await createRes.json();
    spreadsheetId = data.spreadsheetId;
    spreadsheetUrl =
      data.spreadsheetUrl ??
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  } catch (e) {
    return {
      success: false,
      spreadsheetId: "",
      spreadsheetUrl: "",
      error: `Error de red al crear la hoja: ${(e as Error).message}`,
    };
  }

  // Step 2: Rename default "Sheet1" to Config and add all other sheets
  // Sheet1 always has sheetId=0
  const addSheetRequests = ALL_SHEET_NAMES.filter(
    (name) => name !== SHEET_NAMES.CONFIG,
  ).map((name) => ({
    addSheet: { properties: { title: name } },
  }));

  try {
    const batchUpdateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              updateSheetProperties: {
                properties: { sheetId: 0, title: SHEET_NAMES.CONFIG },
                fields: "title",
              },
            },
            ...addSheetRequests,
          ],
        }),
      },
    );

    if (!batchUpdateRes.ok) {
      const err = await batchUpdateRes.json().catch(() => ({}));
      return {
        success: false,
        spreadsheetId,
        spreadsheetUrl,
        error: `Error al crear las hojas: ${err.error?.message ?? "Error de estructura"}`,
      };
    }
  } catch (e) {
    return {
      success: false,
      spreadsheetId,
      spreadsheetUrl,
      error: `Error de red al crear las hojas: ${(e as Error).message}`,
    };
  }

  // Step 3: Write all data via batchUpdate
  const valueData = [
    // Config (header + data rows)
    {
      range: `Config!A1:C${buildConfigRows().length}`,
      values: buildConfigRows(),
    },
    // Movimientos headers
    {
      range: `Movimientos!A1:${String.fromCharCode(64 + MOVIMIENTOS_HEADERS.length)}1`,
      values: [buildHeaderRow(MOVIMIENTOS_HEADERS)],
    },
    // Categorias (header + default rows)
    {
      range: `Categorias!A1:L${buildCategoryRows().length}`,
      values: buildCategoryRows(),
    },
    // Cuentas headers
    {
      range: `Cuentas!A1:${String.fromCharCode(64 + CUENTAS_HEADERS.length)}1`,
      values: [buildHeaderRow(CUENTAS_HEADERS)],
    },
    // Gastos_fijos headers
    {
      range: `Gastos_fijos!A1:${String.fromCharCode(64 + GASTOS_FIJOS_HEADERS.length)}1`,
      values: [buildHeaderRow(GASTOS_FIJOS_HEADERS)],
    },
    // Pagos_futuros headers
    {
      range: `Pagos_futuros!A1:${String.fromCharCode(64 + PAGOS_FUTUROS_HEADERS.length)}1`,
      values: [buildHeaderRow(PAGOS_FUTUROS_HEADERS)],
    },
    // Objetivos headers
    {
      range: `Objetivos!A1:${String.fromCharCode(64 + OBJETIVOS_HEADERS.length)}1`,
      values: [buildHeaderRow(OBJETIVOS_HEADERS)],
    },
    // Reservas headers
    {
      range: `Reservas!A1:${String.fromCharCode(64 + RESERVAS_HEADERS.length)}1`,
      values: [buildHeaderRow(RESERVAS_HEADERS)],
    },
    // Mov_reservas headers
    {
      range: `Mov_reservas!A1:${String.fromCharCode(64 + MOV_RESERVAS_HEADERS.length)}1`,
      values: [buildHeaderRow(MOV_RESERVAS_HEADERS)],
    },
    // Pagos_aplazados headers
    {
      range: `Pagos_aplazados!A1:${String.fromCharCode(64 + PAGOS_APLAZADOS_HEADERS.length)}1`,
      values: [buildHeaderRow(PAGOS_APLAZADOS_HEADERS)],
    },
    // 00_LEEME data
    {
      range: `00_LEEME!A1:B${buildLeemeRows().length}`,
      values: buildLeemeRows(),
    },
  ];

  try {
    const batchValuesRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valueInputOption: "RAW",
          data: valueData,
        }),
      },
    );

    if (!batchValuesRes.ok) {
      const err = await batchValuesRes.json().catch(() => ({}));
      return {
        success: false,
        spreadsheetId,
        spreadsheetUrl,
        error: `Error al escribir los datos iniciales: ${err.error?.message ?? "Error de escritura"}`,
      };
    }
  } catch (e) {
    return {
      success: false,
      spreadsheetId,
      spreadsheetUrl,
      error: `Error de red al escribir los datos: ${(e as Error).message}`,
    };
  }

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
  };
}
