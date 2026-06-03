import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import {
  appendModelRow,
  softDeleteRow,
  updateRowByColumn,
  findRowIndexByColumnValue,
  getToken,
} from "@/lib/sheets/writer";
import type { ReserveRow } from "@/types/models";
import type { GenericStatus } from "@/constants/enums";
import { nowISO } from "@/lib/sheets/adapters";

const RESERVA_HEADERS = [
  "reservaId",
  "nombre",
  "tipo",
  "importeObjetivo",
  "saldoActual",
  "aporteMensualSugerido",
  "cuentaFisica",
  "activo",
  "prioridad",
  "estado",
  "fechaInicio",
  "fechaObjetivo",
  "notas",
  "createdAt",
  "updatedAt",
] as const;

function rowToReserve(row: Record<string, string>): ReserveRow {
  const rawEstado = (row.estado ?? "").trim();
  const estado: GenericStatus = rawEstado
    ? (rawEstado as GenericStatus)
    : (row.activo === "S" ? "Activo" : "Pausado");
  return {
    reservaId: row.reservaId ?? "",
    nombre: row.nombre ?? "",
    tipo: (row.tipo as ReserveRow["tipo"]) ?? "Emergencia",
    importeObjetivo: Number(row.importeObjetivo) || 0,
    saldoActual: Number(row.saldoActual) || 0,
    aporteMensualSugerido: Number(row.aporteMensualSugerido) || 0,
    cuentaFisica: row.cuentaFisica ?? "",
    activo: (row.activo as ReserveRow["activo"]) ?? "S",
    estado,
    prioridad: (row.prioridad as ReserveRow["prioridad"]) ?? "Media",
    fechaInicio: row.fechaInicio ?? "",
    fechaObjetivo: row.fechaObjetivo ?? "",
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
      return rows.filter((r) => r.reservaId && r.estado !== "Cancelado");
    },
    enabled: !!sheetId,
    staleTime: 30_000,
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
      estado?: string;
      fechaInicio?: string;
      fechaObjetivo?: string;
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
        estado: (data.estado ?? "Activo") as ReserveRow["estado"],
        fechaInicio: data.fechaInicio ?? "",
        fechaObjetivo: data.fechaObjetivo ?? "",
        notas: data.notas ?? "",
        createdAt: now,
        updatedAt: now,
      };

      return appendModelRow(
        sheetId,
        SHEET_NAMES.RESERVAS,
        RESERVA_HEADERS,
        rowData,
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserves"] });
    },
  });
}

export function useUpdateReserve(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      reservaId: string;
      nombre: string;
      tipo: string;
      importeObjetivo: number;
      saldoActual?: number;
      aporteMensualSugerido?: number;
      cuentaFisica?: string;
      prioridad?: string;
      estado?: string;
      fechaInicio?: string;
      fechaObjetivo?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.RESERVAS,
        "reservaId",
        data.reservaId,
        token,
      );
      if (rowIndex === null) throw new Error("Reserva no encontrada");

      const now = nowISO();
      const updates: Record<string, string | number> = {
        nombre: data.nombre,
        tipo: data.tipo as ReserveRow["tipo"],
        importeObjetivo: data.importeObjetivo,
        saldoActual: data.saldoActual ?? 0,
        aporteMensualSugerido: data.aporteMensualSugerido ?? 0,
        cuentaFisica: data.cuentaFisica ?? "",
        prioridad: (data.prioridad ?? "Media") as ReserveRow["prioridad"],
        estado: (data.estado ?? "Activo") as ReserveRow["estado"],
        fechaInicio: data.fechaInicio ?? "",
        fechaObjetivo: data.fechaObjetivo ?? "",
        notas: data.notas ?? "",
        updatedAt: now,
      };

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.RESERVAS,
        rowIndex,
        updates,
        token,
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
    mutationFn: async (reservaId: string) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.RESERVAS,
        "reservaId",
        reservaId,
        token,
      );
      if (rowIndex === null) throw new Error("Reserva no encontrada");

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.RESERVAS,
        rowIndex,
        { estado: "Cancelado", activo: "N", updatedAt: nowISO() },
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserves"] });
    },
  });
}
