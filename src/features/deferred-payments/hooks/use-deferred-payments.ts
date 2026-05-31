import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES, PAGOS_APLAZADOS_HEADERS } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import {
  appendModelRow,
  updateRowByColumn,
  findRowIndexByColumnValue,
  getToken,
} from "@/lib/sheets/writer";
import type { InstallmentPaymentRow } from "@/types/models";
import { nowISO } from "@/lib/sheets/adapters";

function rowToDeferredPayment(
  row: Record<string, string>,
): InstallmentPaymentRow {
  return {
    aplazadoId: row.aplazadoId ?? "",
    concepto: row.concepto ?? "",
    importeTotal: Number(row.importeTotal) || 0,
    importePagado: Number(row.importePagado) || 0,
    fechaInicio: row.fechaInicio ?? "",
    fechaFin: row.fechaFin ?? "",
    cuotaMensual: Number(row.cuotaMensual) || 0,
    categoria: row.categoria ?? "",
    cuentaOrigen: row.cuentaOrigen ?? "",
    estado: (row.estado as InstallmentPaymentRow["estado"]) ?? "Activo",
    notas: row.notas ?? "",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

export function useDeferredPayments(sheetId: string | null) {
  return useQuery({
    queryKey: ["deferredPayments", sheetId],
    queryFn: async () => {
      if (!sheetId) return [];
      const rows = await readSheetData<InstallmentPaymentRow>(
        sheetId,
        SHEET_NAMES.PAGOS_APLAZADOS,
        rowToDeferredPayment,
      );
      return rows.filter((r) => r.aplazadoId);
    },
    enabled: !!sheetId,
  });
}

export function useCreateDeferredPayment(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      concepto: string;
      importeTotal: number;
      cuotaMensual?: number;
      fechaInicio?: string;
      fechaFin?: string;
      categoria?: string;
      cuentaOrigen?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const now = nowISO();
      const rowData = {
        aplazadoId: `APL-${Date.now()}`,
        concepto: data.concepto,
        importeTotal: data.importeTotal,
        importePagado: 0,
        fechaInicio: data.fechaInicio ?? "",
        fechaFin: data.fechaFin ?? "",
        cuotaMensual: data.cuotaMensual ?? data.importeTotal,
        categoria: data.categoria ?? "",
        cuentaOrigen: data.cuentaOrigen ?? "",
        estado: "Activo" as const,
        notas: data.notas ?? "",
        createdAt: now,
        updatedAt: now,
      };

      await appendModelRow(
        sheetId,
        SHEET_NAMES.PAGOS_APLAZADOS,
        PAGOS_APLAZADOS_HEADERS,
        rowData,
        token,
      );

      return rowData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deferredPayments"] });
    },
  });
}

export function useUpdateDeferredPayment(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      aplazadoId: string;
      concepto: string;
      importeTotal: number;
      importePagado?: number;
      cuotaMensual?: number;
      fechaInicio?: string;
      fechaFin?: string;
      categoria?: string;
      cuentaOrigen?: string;
      estado?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.PAGOS_APLAZADOS,
        "aplazadoId",
        data.aplazadoId,
        token,
      );
      if (rowIndex === null) throw new Error("Pago aplazado no encontrado");

      const now = nowISO();
      const updates: Record<string, string | number> = {
        concepto: data.concepto,
        importeTotal: data.importeTotal,
        importePagado: data.importePagado ?? 0,
        cuotaMensual: data.cuotaMensual ?? data.importeTotal,
        fechaInicio: data.fechaInicio ?? "",
        fechaFin: data.fechaFin ?? "",
        categoria: data.categoria ?? "",
        cuentaOrigen: data.cuentaOrigen ?? "",
        estado: data.estado ?? "Activo",
        notas: data.notas ?? "",
        updatedAt: now,
      };

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.PAGOS_APLAZADOS,
        rowIndex,
        updates,
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deferredPayments"] });
    },
  });
}

export function useDeleteDeferredPayment(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aplazadoId: string) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.PAGOS_APLAZADOS,
        "aplazadoId",
        aplazadoId,
        token,
      );
      if (rowIndex === null) throw new Error("Pago aplazado no encontrado");

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.PAGOS_APLAZADOS,
        rowIndex,
        { estado: "Cancelado", updatedAt: nowISO() },
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deferredPayments"] });
    },
  });
}
