import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import { createRow, softDeleteRow, getToken } from "@/lib/sheets/writer";
import { reserveSheetSchema } from "@/schemas/reserve";
import type { ReserveRow } from "@/types/models";
import { nowISO } from "@/lib/sheets/adapters";

function rowToReserve(row: Record<string, string>): ReserveRow {
  return {
    reservaId: row.reservaId ?? "",
    nombre: row.nombre ?? "",
    tipo: (row.tipo as ReserveRow["tipo"]) ?? "Emergencia",
    importeObjetivo: Number(row.importeObjetivo) || 0,
    saldoActual: Number(row.saldoActual) || 0,
    aporteMensualSugerido: Number(row.aporteMensualSugerido) || 0,
    cuentaFisica: row.cuentaFisica ?? "",
    activo: (row.activo as ReserveRow["activo"]) ?? "S",
    prioridad: (row.prioridad as ReserveRow["prioridad"]) ?? "Media",
    notas: row.notas ?? "",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

export function useReserves(sheetId: string | null) {
  return useQuery({
    queryKey: ["reserves", sheetId],
    queryFn: async () => {
      if (!sheetId) return [];
      const rows = await readSheetData<ReserveRow>(
        sheetId,
        SHEET_NAMES.RESERVAS,
        rowToReserve,
      );
      return rows.filter((r) => r.reservaId && r.activo === "S");
    },
    enabled: !!sheetId,
  });
}

export function useCreateReserve(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nombre: string;
      tipo: string;
      importeObjetivo: number;
      saldoActual?: number;
      aporteMensualSugerido?: number;
      cuentaFisica?: string;
      prioridad?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const now = nowISO();
      const rowData = {
        reservaId: `RES-${Date.now()}`,
        nombre: data.nombre,
        tipo: data.tipo as ReserveRow["tipo"],
        importeObjetivo: data.importeObjetivo,
        saldoActual: data.saldoActual ?? 0,
        aporteMensualSugerido: data.aporteMensualSugerido ?? 0,
        cuentaFisica: data.cuentaFisica ?? "",
        activo: "S" as const,
        prioridad: (data.prioridad ?? "Media") as ReserveRow["prioridad"],
        notas: data.notas ?? "",
        createdAt: now,
        updatedAt: now,
      };

      return createRow(
        sheetId,
        SHEET_NAMES.RESERVAS,
        reserveSheetSchema,
        rowData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserves"] });
    },
  });
}

export function useDeleteReserve(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rowIndex: number) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      await softDeleteRow(sheetId, SHEET_NAMES.RESERVAS, rowIndex, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserves"] });
    },
  });
}
