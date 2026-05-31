import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES, MOVIMIENTOS_HEADERS } from "@/constants/sheet-structure";
import { readSheetData, readSheetHeaders } from "@/lib/sheets/reader";
import {
  appendModelRow,
  softDeleteRow,
  findRowIndexByColumnValue,
  updateRowByColumn,
  getToken,
} from "@/lib/sheets/writer";
import type { TransactionRow } from "@/types/models";
import { generateMonthKey, nowISO } from "@/lib/sheets/adapters";

function rowToTransaction(row: Record<string, string>): TransactionRow {
  return {
    id: row.id ?? "",
    fecha: row.fecha ?? "",
    mesClave: row.mesClave ?? "",
    concepto: row.concepto ?? "",
    tipo: (row.tipo as TransactionRow["tipo"]) ?? "Gasto",
    categoria: row.categoria ?? "",
    importe: Number(row.importe) || 0,
    metodo: row.metodo ?? "",
    cuentaOrigen: row.cuentaOrigen ?? "",
    cuentaDestino: row.cuentaDestino ?? "",
    notas: row.notas ?? "",
    reservaId: row.reservaId ?? "",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
    deletedAt: row.deletedAt ?? "",
  };
}

export function useTransactions(sheetId: string | null, monthKey?: string) {
  return useQuery({
    queryKey: ["transactions", sheetId, monthKey],
    queryFn: async () => {
      if (!sheetId) return [];
      const rows = await readSheetData<TransactionRow>(
        sheetId,
        SHEET_NAMES.MOVIMIENTOS,
        rowToTransaction,
      );
      const active = rows.filter((r) => r.id && !r.deletedAt);
      if (monthKey) {
        return active.filter((r) => r.mesClave === monthKey);
      }
      return active;
    },
    enabled: !!sheetId,
  });
}

export function useCreateTransaction(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      fecha: string;
      concepto: string;
      tipo: string;
      categoria: string;
      importe: number;
      metodo?: string;
      cuentaOrigen?: string;
      cuentaDestino?: string;
      notas?: string;
      reservaId?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const now = nowISO();
      const monthKey = generateMonthKey(data.fecha);
      const id = `TX-${Date.now()}`;

      const rowData = {
        id,
        fecha: data.fecha,
        mesClave: monthKey,
        concepto: data.concepto,
        tipo: data.tipo as TransactionRow["tipo"],
        categoria: data.categoria,
        importe: data.importe,
        metodo: data.metodo ?? "",
        cuentaOrigen: data.cuentaOrigen ?? "",
        cuentaDestino: data.cuentaDestino ?? "",
        notas: data.notas ?? "",
        reservaId: data.reservaId ?? "",
        createdAt: now,
        updatedAt: now,
        deletedAt: "",
      };

      await appendModelRow(
        sheetId,
        SHEET_NAMES.MOVIMIENTOS,
        MOVIMIENTOS_HEADERS,
        rowData,
        token,
      );

      return rowData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateTransaction(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      fecha: string;
      concepto: string;
      tipo: string;
      categoria: string;
      importe: number;
      metodo?: string;
      cuentaOrigen?: string;
      cuentaDestino?: string;
      notas?: string;
      reservaId?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.MOVIMIENTOS,
        "id",
        data.id,
        token,
      );
      if (rowIndex === null) throw new Error("Transaccion no encontrada");

      const now = nowISO();
      const monthKey = generateMonthKey(data.fecha);

      const updates: Record<string, string | number | boolean> = {
        fecha: data.fecha,
        mesClave: monthKey,
        concepto: data.concepto,
        tipo: data.tipo as TransactionRow["tipo"],
        categoria: data.categoria,
        importe: data.importe,
        metodo: data.metodo ?? "",
        cuentaOrigen: data.cuentaOrigen ?? "",
        cuentaDestino: data.cuentaDestino ?? "",
        notas: data.notas ?? "",
        reservaId: data.reservaId ?? "",
        updatedAt: now,
      };

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.MOVIMIENTOS,
        rowIndex,
        updates,
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteTransaction(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.MOVIMIENTOS,
        "id",
        id,
        token,
      );
      if (rowIndex === null) throw new Error("Transaccion no encontrada");

      await softDeleteRow(sheetId, SHEET_NAMES.MOVIMIENTOS, rowIndex, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
