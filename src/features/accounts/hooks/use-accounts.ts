import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES, CUENTAS_HEADERS } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import {
  appendModelRow,
  softDeleteRow,
  findRowIndexByColumnValue,
  updateRowByColumn,
  getToken,
} from "@/lib/sheets/writer";
import type { AccountRow } from "@/types/models";
import { nowISO } from "@/lib/sheets/adapters";
import { AccountRole } from "@/constants/enums";

function rowToAccount(row: Record<string, string>): AccountRow {
  const rawRol = String(row.rol ?? "").trim().toLowerCase();
  const allowedRoles = Object.values(AccountRole) as string[];
  const rol: AccountRow["rol"] = allowedRoles.includes(rawRol)
    ? (rawRol as AccountRow["rol"])
    : AccountRole.GENERAL;
  return {
    cuentaId: row.cuentaId ?? "",
    nombre: row.nombre ?? "",
    tipo: (row.tipo as AccountRow["tipo"]) ?? "Banco",
    rol,
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
      rol?: string;
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
      const allowedRoles = Object.values(AccountRole) as string[];
      const requestedRol = String(data.rol ?? "").trim().toLowerCase();
      const rol: AccountRow["rol"] = allowedRoles.includes(requestedRol)
        ? (requestedRol as AccountRow["rol"])
        : AccountRole.GENERAL;
      const rowData = {
        cuentaId: `ACC-${Date.now()}`,
        nombre: data.nombre,
        tipo: data.tipo as AccountRow["tipo"],
        rol,
        moneda: data.moneda ?? "EUR",
        saldoInicial: data.saldoInicial ?? 0,
        saldoActualManual: data.saldoActualManual ?? 0,
        incluirDashboard: (data.incluirDashboard
          ? "S"
          : "N") as AccountRow["incluirDashboard"],
        activo: "S" as const,
        color: data.color ?? "#10B981",
        notas: data.notas ?? "",
        createdAt: now,
        updatedAt: now,
      };

      await appendModelRow(
        sheetId,
        SHEET_NAMES.CUENTAS,
        CUENTAS_HEADERS,
        rowData,
        token,
      );

      return rowData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateAccount(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      cuentaId: string;
      nombre: string;
      tipo: string;
      rol?: string;
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

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.CUENTAS,
        "cuentaId",
        data.cuentaId,
        token,
      );
      if (rowIndex === null) throw new Error("Cuenta no encontrada");

      const now = nowISO();
      const allowedRoles = Object.values(AccountRole) as string[];
      const requestedRol = String(data.rol ?? "").trim().toLowerCase();
      const rol: AccountRow["rol"] = allowedRoles.includes(requestedRol)
        ? (requestedRol as AccountRow["rol"])
        : AccountRole.GENERAL;

      const updates = {
        nombre: data.nombre,
        tipo: data.tipo as AccountRow["tipo"],
        rol,
        moneda: data.moneda ?? "EUR",
        saldoInicial: data.saldoInicial ?? 0,
        saldoActualManual: data.saldoActualManual ?? 0,
        incluirDashboard: (data.incluirDashboard
          ? "S"
          : "N") as AccountRow["incluirDashboard"],
        color: data.color ?? "",
        notas: data.notas ?? "",
        updatedAt: now,
      };

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.CUENTAS,
        rowIndex,
        updates,
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteAccount(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cuentaId: string) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.CUENTAS,
        "cuentaId",
        cuentaId,
        token,
      );
      if (rowIndex === null) throw new Error("Cuenta no encontrada");

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.CUENTAS,
        rowIndex,
        { activo: "N", updatedAt: nowISO() },
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
