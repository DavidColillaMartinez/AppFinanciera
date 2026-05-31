import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES, MOV_RESERVAS_HEADERS } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import {
  appendModelRow,
  updateRowByColumn,
  findRowIndexByColumnValue,
  getToken,
} from "@/lib/sheets/writer";
import type { ReserveMovementRow } from "@/types/models";
import { nowISO } from "@/lib/sheets/adapters";
import { ReserveMovementType } from "@/constants/enums";

function rowToReserveMovement(
  row: Record<string, string>,
): ReserveMovementRow {
  return {
    id: row.id ?? "",
    fecha: row.fecha ?? "",
    reservaId: row.reservaId ?? "",
    tipoMovimiento: (row.tipoMovimiento as ReserveMovementRow["tipoMovimiento"]) ?? ReserveMovementType.APORTACION,
    importe: Number(row.importe) || 0,
    cuentaOrigen: row.cuentaOrigen ?? "",
    cuentaDestino: row.cuentaDestino ?? "",
    notas: row.notas ?? "",
    createdAt: row.createdAt ?? "",
  };
}

export function useReserveMovements(sheetId: string | null, reservaId?: string) {
  return useQuery({
    queryKey: ["reserveMovements", sheetId, reservaId],
    queryFn: async () => {
      if (!sheetId) return [];
      const rows = await readSheetData<ReserveMovementRow>(
        sheetId,
        SHEET_NAMES.MOV_RESERVAS,
        rowToReserveMovement,
      );
      const filtered = rows.filter((r) => r.id);
      if (reservaId) {
        return filtered.filter((r) => r.reservaId === reservaId);
      }
      return filtered;
    },
    enabled: !!sheetId,
  });
}

export function useCreateReserveMovement(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      reservaId: string;
      tipoMovimiento: string;
      importe: number;
      cuentaOrigen?: string;
      cuentaDestino?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const now = nowISO();
      const rowData = {
        id: `MOVRES-${Date.now()}`,
        fecha: new Date().toISOString().split("T")[0],
        reservaId: data.reservaId,
        tipoMovimiento: data.tipoMovimiento as ReserveMovementRow["tipoMovimiento"],
        importe: data.importe,
        cuentaOrigen: data.cuentaOrigen ?? "",
        cuentaDestino: data.cuentaDestino ?? "",
        notas: data.notas ?? "",
        createdAt: now,
      };

      await appendModelRow(
        sheetId,
        SHEET_NAMES.MOV_RESERVAS,
        MOV_RESERVAS_HEADERS,
        rowData,
        token,
      );

      return rowData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserveMovements"] });
      queryClient.invalidateQueries({ queryKey: ["reserves"] });
    },
  });
}

export function useUpdateReserveMovement(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      tipoMovimiento: string;
      importe: number;
      cuentaOrigen?: string;
      cuentaDestino?: string;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.MOV_RESERVAS,
        "id",
        data.id,
        token,
      );
      if (rowIndex === null) throw new Error("Movimiento no encontrado");

      const updates: Record<string, string | number> = {
        tipoMovimiento: data.tipoMovimiento as ReserveMovementRow["tipoMovimiento"],
        importe: data.importe,
        cuentaOrigen: data.cuentaOrigen ?? "",
        cuentaDestino: data.cuentaDestino ?? "",
        notas: data.notas ?? "",
      };

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.MOV_RESERVAS,
        rowIndex,
        updates,
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserveMovements"] });
    },
  });
}

export function useDeleteReserveMovement(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.MOV_RESERVAS,
        "id",
        id,
        token,
      );
      if (rowIndex === null) throw new Error("Movimiento no encontrado");

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.MOV_RESERVAS,
        rowIndex,
        { tipoMovimiento: "Eliminado" },
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserveMovements"] });
    },
  });
}
