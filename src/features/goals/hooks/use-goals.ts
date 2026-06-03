import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import {
  appendModelRow,
  findRowIndexByColumnValue,
  updateRowByColumn,
  getToken,
} from "@/lib/sheets/writer";
import type { GoalRow } from "@/types/models";
import { nowISO } from "@/lib/sheets/adapters";

const GOAL_HEADERS = [
  "objetivoId",
  "nombre",
  "tipo",
  "cuentaAhorro",
  "importeObjetivo",
  "fechaInicio",
  "fechaObjetivo",
  "prioridad",
  "saldoActual",
  "mesesRestantes",
  "aporteMensual",
  "estado",
  "notas",
  "createdAt",
  "updatedAt",
] as const;

function rowToGoal(row: Record<string, string>): GoalRow {
  return {
    objetivoId: row.objetivoId ?? "",
    nombre: row.nombre ?? "",
    tipo: (row.tipo as GoalRow["tipo"]) ?? "Otro",
    cuentaAhorro: row.cuentaAhorro ?? "",
    importeObjetivo: Number(row.importeObjetivo) || 0,
    fechaInicio: row.fechaInicio ?? "",
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
    staleTime: 30_000,
  });
}

export function useCreateGoal(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nombre: string;
      tipo: string;
      importeObjetivo: number;
      fechaInicio?: string;
      fechaObjetivo?: string;
      prioridad?: string;
      cuentaAhorro?: string;
      estado?: string;
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
        fechaInicio: data.fechaInicio ?? "",
        fechaObjetivo: data.fechaObjetivo ?? "",
        prioridad: (data.prioridad ?? "Media") as GoalRow["prioridad"],
        saldoActual: 0,
        mesesRestantes: 0,
        aporteMensual: 0,
        estado: (data.estado ?? "Activo") as GoalRow["estado"],
        notas: data.notas ?? "",
        createdAt: now,
        updatedAt: now,
      };

      await appendModelRow(
        sheetId,
        SHEET_NAMES.OBJETIVOS,
        GOAL_HEADERS,
        rowData,
        token,
      );

      return rowData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useUpdateGoal(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      objetivoId: string;
      nombre: string;
      tipo: string;
      importeObjetivo: number;
      fechaInicio?: string;
      fechaObjetivo?: string;
      prioridad?: string;
      cuentaAhorro?: string;
      saldoActual?: number;
      estado?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.OBJETIVOS,
        "objetivoId",
        data.objetivoId,
        token,
      );
      if (rowIndex === null) throw new Error("Objetivo no encontrado");

      const now = nowISO();

      const updates: Record<string, string | number | boolean> = {
        nombre: data.nombre,
        tipo: data.tipo as GoalRow["tipo"],
        importeObjetivo: data.importeObjetivo,
        fechaInicio: data.fechaInicio ?? "",
        fechaObjetivo: data.fechaObjetivo ?? "",
        prioridad: (data.prioridad ?? "Media") as GoalRow["prioridad"],
        cuentaAhorro: data.cuentaAhorro ?? "",
        saldoActual: data.saldoActual ?? 0,
        estado: (data.estado ?? "Activo") as GoalRow["estado"],
        notas: data.notas ?? "",
        updatedAt: now,
      };

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.OBJETIVOS,
        rowIndex,
        updates,
        token,
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
    mutationFn: async (objetivoId: string) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.OBJETIVOS,
        "objetivoId",
        objetivoId,
        token,
      );
      if (rowIndex === null) throw new Error("Objetivo no encontrado");

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.OBJETIVOS,
        rowIndex,
        { estado: "Cancelado", updatedAt: nowISO() },
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
