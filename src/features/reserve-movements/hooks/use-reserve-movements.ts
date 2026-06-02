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
import { nowISO, generateMonthKey } from "@/lib/sheets/adapters";
import {
  ReserveMovementType,
  TipoDestinoReserva,
  TipoMovimientoReserva,
} from "@/constants/enums";

function normalizeTipoMovimiento(
  raw: string,
): ReserveMovementRow["tipoMovimiento"] {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "aporte" || value === "aportacion") {
    return TipoMovimientoReserva.APORTE;
  }
  if (value === "retirada" || value === "disposicion") {
    return TipoMovimientoReserva.RETIRADA;
  }
  return TipoMovimientoReserva.APORTE;
}

function normalizeTipoDestino(
  raw: string,
): ReserveMovementRow["tipoDestino"] {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === TipoDestinoReserva.OBJETIVO) {
    return TipoDestinoReserva.OBJETIVO;
  }
  if (value === TipoDestinoReserva.PAGO_FUTURO) {
    return TipoDestinoReserva.PAGO_FUTURO;
  }
  return TipoDestinoReserva.RESERVA;
}

function rowToReserveMovement(
  row: Record<string, string>,
): ReserveMovementRow {
  const reservaId = row.reservaId ?? "";
  const destinoId = row.destinoId ?? reservaId;
  const tipoDestino = normalizeTipoDestino(row.tipoDestino);
  return {
    id: row.id ?? "",
    fecha: row.fecha ?? "",
    mesClave: row.mesClave ?? "",
    tipoDestino,
    destinoId,
    reservaId,
    tipoMovimiento: normalizeTipoMovimiento(row.tipoMovimiento),
    importe: Number(row.importe) || 0,
    cuentaOrigen: row.cuentaOrigen ?? "",
    cuentaDestino: row.cuentaDestino ?? "",
    notas: row.notas ?? "",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
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
      const fecha = new Date().toISOString().split("T")[0];
      const rowData = {
        id: `MOVRES-${Date.now()}`,
        fecha,
        mesClave: generateMonthKey(fecha),
        tipoDestino: TipoDestinoReserva.RESERVA,
        destinoId: data.reservaId,
        reservaId: data.reservaId,
        tipoMovimiento: normalizeTipoMovimiento(data.tipoMovimiento),
        importe: data.importe,
        cuentaOrigen: data.cuentaOrigen ?? "",
        cuentaDestino: data.cuentaDestino ?? "",
        notas: data.notas ?? "",
        createdAt: now,
        updatedAt: now,
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
        tipoMovimiento: normalizeTipoMovimiento(data.tipoMovimiento),
        importe: data.importe,
        cuentaOrigen: data.cuentaOrigen ?? "",
        cuentaDestino: data.cuentaDestino ?? "",
        notas: data.notas ?? "",
        updatedAt: nowISO(),
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
