import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES, GASTOS_FIJOS_HEADERS } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import {
  appendModelRow,
  updateRowByColumn,
  findRowIndexByColumnValue,
  getToken,
} from "@/lib/sheets/writer";
import type { FixedExpenseRow } from "@/types/models";
import { nowISO } from "@/lib/sheets/adapters";
import { Frequency } from "@/constants/enums";

function rowToFixedExpense(row: Record<string, string>): FixedExpenseRow {
  return {
    fijoId: row.fijoId ?? "",
    concepto: row.concepto ?? "",
    categoria: row.categoria ?? "",
    importe: Number(row.importe) || 0,
    frecuencia: (row.frecuencia as FixedExpenseRow["frecuencia"]) ?? Frequency.MENSUAL,
    diaCargo: Number(row.diaCargo) || 1,
    cuentaOrigen: row.cuentaOrigen ?? "",
    activo: (row.activo as FixedExpenseRow["activo"]) ?? "S",
    fechaInicio: row.fechaInicio ?? "",
    fechaFin: row.fechaFin ?? "",
    notas: row.notas ?? "",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

export function useFixedExpenses(sheetId: string | null) {
  return useQuery({
    queryKey: ["fixedExpenses", sheetId],
    queryFn: async () => {
      if (!sheetId) return [];
      const rows = await readSheetData<FixedExpenseRow>(
        sheetId,
        SHEET_NAMES.GASTOS_FIJOS,
        rowToFixedExpense,
      );
      return rows.filter((r) => r.fijoId && r.activo === "S");
    },
    enabled: !!sheetId,
    staleTime: 30_000,
  });
}

export function useCreateFixedExpense(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      concepto: string;
      categoria: string;
      importe: number;
      frecuencia: string;
      diaCargo?: number;
      cuentaOrigen?: string;
      fechaInicio?: string;
      fechaFin?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const now = nowISO();
      const rowData = {
        fijoId: `FIX-${Date.now()}`,
        concepto: data.concepto,
        categoria: data.categoria,
        importe: data.importe,
        frecuencia: data.frecuencia as FixedExpenseRow["frecuencia"],
        diaCargo: data.diaCargo ?? 1,
        cuentaOrigen: data.cuentaOrigen ?? "",
        activo: "S" as const,
        fechaInicio: data.fechaInicio ?? "",
        fechaFin: data.fechaFin ?? "",
        notas: data.notas ?? "",
        createdAt: now,
        updatedAt: now,
      };

      await appendModelRow(
        sheetId,
        SHEET_NAMES.GASTOS_FIJOS,
        GASTOS_FIJOS_HEADERS,
        rowData,
        token,
      );

      return rowData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixedExpenses"] });
    },
  });
}

export function useUpdateFixedExpense(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      fijoId: string;
      concepto: string;
      categoria: string;
      importe: number;
      frecuencia: string;
      diaCargo?: number;
      cuentaOrigen?: string;
      activo?: string;
      fechaInicio?: string;
      fechaFin?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.GASTOS_FIJOS,
        "fijoId",
        data.fijoId,
        token,
      );
      if (rowIndex === null) throw new Error("Gasto fijo no encontrado");

      const now = nowISO();
      const updates: Record<string, string | number> = {
        concepto: data.concepto,
        categoria: data.categoria,
        importe: data.importe,
        frecuencia: data.frecuencia as FixedExpenseRow["frecuencia"],
        diaCargo: data.diaCargo ?? 1,
        cuentaOrigen: data.cuentaOrigen ?? "",
        activo: data.activo ?? "S",
        fechaInicio: data.fechaInicio ?? "",
        fechaFin: data.fechaFin ?? "",
        notas: data.notas ?? "",
        updatedAt: now,
      };

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.GASTOS_FIJOS,
        rowIndex,
        updates,
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixedExpenses"] });
    },
  });
}

export function useDeleteFixedExpense(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fijoId: string) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.GASTOS_FIJOS,
        "fijoId",
        fijoId,
        token,
      );
      if (rowIndex === null) throw new Error("Gasto fijo no encontrado");

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.GASTOS_FIJOS,
        rowIndex,
        { activo: "N", updatedAt: nowISO() },
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixedExpenses"] });
    },
  });
}
