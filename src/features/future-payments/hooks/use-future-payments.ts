import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES, PAGOS_FUTUROS_HEADERS } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import {
  appendModelRow,
  updateRowByColumn,
  findRowIndexByColumnValue,
  getToken,
} from "@/lib/sheets/writer";
import type { FuturePaymentRow } from "@/types/models";
import { nowISO } from "@/lib/sheets/adapters";

function rowToFuturePayment(row: Record<string, string>): FuturePaymentRow {
  return {
    pagoId: row.pagoId ?? "",
    concepto: row.concepto ?? "",
    categoria: row.categoria ?? "",
    importeObjetivo: Number(row.importeObjetivo) || 0,
    fechaVencimiento: row.fechaVencimiento ?? "",
    frecuencia: (row.frecuencia as FuturePaymentRow["frecuencia"]) ?? "Mensual",
    cuentaReserva: row.cuentaReserva ?? "",
    activo: (row.activo as FuturePaymentRow["activo"]) ?? "S",
    saldoReservado: Number(row.saldoReservado) || 0,
    mesesRestantes: Number(row.mesesRestantes) || 0,
    aporteMensual: Number(row.aporteMensual) || 0,
    notas: row.notas ?? "",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

export function useFuturePayments(sheetId: string | null) {
  return useQuery({
    queryKey: ["futurePayments", sheetId],
    queryFn: async () => {
      if (!sheetId) return [];
      const rows = await readSheetData<FuturePaymentRow>(
        sheetId,
        SHEET_NAMES.PAGOS_FUTUROS,
        rowToFuturePayment,
      );
      return rows.filter((r) => r.pagoId && r.activo === "S");
    },
    enabled: !!sheetId,
    staleTime: 30_000,
  });
}

export function useCreateFuturePayment(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      concepto: string;
      categoria: string;
      importeObjetivo: number;
      fechaVencimiento?: string;
      frecuencia?: string;
      cuentaReserva?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const now = nowISO();
      const rowData = {
        pagoId: `FUT-${Date.now()}`,
        concepto: data.concepto,
        categoria: data.categoria,
        importeObjetivo: data.importeObjetivo,
        fechaVencimiento: data.fechaVencimiento ?? "",
        frecuencia: data.frecuencia ?? "Mensual",
        cuentaReserva: data.cuentaReserva ?? "",
        activo: "S" as const,
        saldoReservado: 0,
        mesesRestantes: 0,
        aporteMensual: 0,
        notas: data.notas ?? "",
        createdAt: now,
        updatedAt: now,
      };

      await appendModelRow(
        sheetId,
        SHEET_NAMES.PAGOS_FUTUROS,
        PAGOS_FUTUROS_HEADERS,
        rowData,
        token,
      );

      return rowData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["futurePayments"] });
    },
  });
}

export function useUpdateFuturePayment(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      pagoId: string;
      concepto: string;
      categoria: string;
      importeObjetivo: number;
      fechaVencimiento?: string;
      frecuencia?: string;
      cuentaReserva?: string;
      saldoReservado?: number;
      mesesRestantes?: number;
      aporteMensual?: number;
      activo?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.PAGOS_FUTUROS,
        "pagoId",
        data.pagoId,
        token,
      );
      if (rowIndex === null) throw new Error("Pago futuro no encontrado");

      const now = nowISO();
      const updates: Record<string, string | number> = {
        concepto: data.concepto,
        categoria: data.categoria,
        importeObjetivo: data.importeObjetivo,
        fechaVencimiento: data.fechaVencimiento ?? "",
        frecuencia: data.frecuencia ?? "Mensual",
        cuentaReserva: data.cuentaReserva ?? "",
        saldoReservado: data.saldoReservado ?? 0,
        mesesRestantes: data.mesesRestantes ?? 0,
        aporteMensual: data.aporteMensual ?? 0,
        activo: data.activo ?? "S",
        notas: data.notas ?? "",
        updatedAt: now,
      };

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.PAGOS_FUTUROS,
        rowIndex,
        updates,
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["futurePayments"] });
    },
  });
}

export function useDeleteFuturePayment(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pagoId: string) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.PAGOS_FUTUROS,
        "pagoId",
        pagoId,
        token,
      );
      if (rowIndex === null) throw new Error("Pago futuro no encontrado");

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.PAGOS_FUTUROS,
        rowIndex,
        { activo: "N", updatedAt: nowISO() },
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["futurePayments"] });
    },
  });
}
