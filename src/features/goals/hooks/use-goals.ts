import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import { createRow, softDeleteRow, getToken } from "@/lib/sheets/writer";
import { goalSheetSchema } from "@/schemas/goal";
import type { GoalRow } from "@/types/models";
import { nowISO } from "@/lib/sheets/adapters";

function rowToGoal(row: Record<string, string>): GoalRow {
  return {
    objetivoId: row.objetivoId ?? "",
    nombre: row.nombre ?? "",
    tipo: (row.tipo as GoalRow["tipo"]) ?? "Otro",
    cuentaAhorro: row.cuentaAhorro ?? "",
    importeObjetivo: Number(row.importeObjetivo) || 0,
    fechaObjetivo: row.fechaObjetivo ?? "",
    prioridad: (row.prioridad as GoalRow["prioridad"]) ?? "Media",
    saldoActual: Number(row.saldoActual) || 0,
    mesesRestantes: Number(row.mesesRestantes) || 0,
    aporteMensual: Number(row.aporteMensual) || 0,
    estado: (row.estado as GoalRow["estado"]) ?? "Activo",
    notas: row.notas ?? "",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

export function useGoals(sheetId: string | null) {
  return useQuery({
    queryKey: ["goals", sheetId],
    queryFn: async () => {
      if (!sheetId) return [];
      const rows = await readSheetData<GoalRow>(
        sheetId,
        SHEET_NAMES.OBJETIVOS,
        rowToGoal,
      );
      return rows.filter((r) => r.objetivoId && r.estado !== "Cancelado");
    },
    enabled: !!sheetId,
  });
}

export function useCreateGoal(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nombre: string;
      tipo: string;
      importeObjetivo: number;
      fechaObjetivo?: string;
      prioridad?: string;
      cuentaAhorro?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const now = nowISO();
      const rowData = {
        objetivoId: `OBJ-${Date.now()}`,
        nombre: data.nombre,
        tipo: data.tipo as GoalRow["tipo"],
        cuentaAhorro: data.cuentaAhorro ?? "",
        importeObjetivo: data.importeObjetivo,
        fechaObjetivo: data.fechaObjetivo ?? "",
        prioridad: (data.prioridad ?? "Media") as GoalRow["prioridad"],
        saldoActual: 0,
        mesesRestantes: 0,
        aporteMensual: 0,
        estado: "Activo" as const,
        notas: data.notas ?? "",
        createdAt: now,
        updatedAt: now,
      };

      return createRow(
        sheetId,
        SHEET_NAMES.OBJETIVOS,
        goalSheetSchema,
        rowData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteGoal(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rowIndex: number) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      await softDeleteRow(sheetId, SHEET_NAMES.OBJETIVOS, rowIndex, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
