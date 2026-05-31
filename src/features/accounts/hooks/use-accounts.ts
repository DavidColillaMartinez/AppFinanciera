import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import { createRow, softDeleteRow, getToken } from "@/lib/sheets/writer";
import { accountSheetSchema } from "@/schemas/account";
import type { AccountRow } from "@/types/models";
import { nowISO } from "@/lib/sheets/adapters";

function rowToAccount(row: Record<string, string>): AccountRow {
  return {
    cuentaId: row.cuentaId ?? "",
    nombre: row.nombre ?? "",
    tipo: (row.tipo as AccountRow["tipo"]) ?? "Bancaria",
    moneda: row.moneda ?? "EUR",
    saldoInicial: Number(row.saldoInicial) || 0,
    saldoActualManual: Number(row.saldoActualManual) || 0,
    incluirDashboard:
      (row.incluirDashboard as AccountRow["incluirDashboard"]) ?? "S",
    activo: (row.activo as AccountRow["activo"]) ?? "S",
    color: row.color ?? "",
    notas: row.notas ?? "",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

export function useAccounts(sheetId: string | null) {
  return useQuery({
    queryKey: ["accounts", sheetId],
    queryFn: async () => {
      if (!sheetId) return [];
      const rows = await readSheetData<AccountRow>(
        sheetId,
        SHEET_NAMES.CUENTAS,
        rowToAccount,
      );
      return rows.filter((r) => r.cuentaId && r.activo === "S");
    },
    enabled: !!sheetId,
  });
}

export function useCreateAccount(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nombre: string;
      tipo: string;
      moneda?: string;
      saldoInicial?: number;
      saldoActualManual?: number;
      incluirDashboard?: boolean;
      color?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const now = nowISO();
      const rowData = {
        cuentaId: `ACC-${Date.now()}`,
        nombre: data.nombre,
        tipo: data.tipo as AccountRow["tipo"],
        moneda: data.moneda ?? "EUR",
        saldoInicial: data.saldoInicial ?? 0,
        saldoActualManual: data.saldoActualManual ?? 0,
        incluirDashboard: (data.incluirDashboard
          ? "S"
          : "N") as AccountRow["incluirDashboard"],
        activo: "S" as const,
        color: data.color ?? "",
        notas: data.notas ?? "",
        createdAt: now,
        updatedAt: now,
      };

      return createRow(
        sheetId,
        SHEET_NAMES.CUENTAS,
        accountSheetSchema,
        rowData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rowIndex: number) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      await softDeleteRow(sheetId, SHEET_NAMES.CUENTAS, rowIndex, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
