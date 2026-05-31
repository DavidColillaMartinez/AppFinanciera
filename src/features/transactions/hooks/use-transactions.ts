import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import { createRow, softDeleteRow, getToken } from "@/lib/sheets/writer";
import { transactionSheetSchema } from "@/schemas/transaction";
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
      if (monthKey) {
        return rows.filter((r) => r.mesClave === monthKey && r.id);
      }
      return rows.filter((r) => r.id);
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

      const rowData = {
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
      };

      return createRow(
        sheetId,
        SHEET_NAMES.MOVIMIENTOS,
        transactionSheetSchema,
        rowData,
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
    mutationFn: async (rowIndex: number) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      await softDeleteRow(sheetId, SHEET_NAMES.MOVIMIENTOS, rowIndex, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
