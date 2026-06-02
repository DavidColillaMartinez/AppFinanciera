"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES, MOV_RESERVAS_HEADERS } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import { rowToReserveMovement } from "@/lib/finance/savings-ledger";
import {
  useCreateSavingsContribution as useCreateSavingsContributionCore,
  useCreateSavingsWithdrawal as useCreateSavingsWithdrawalCore,
} from "@/features/savings/hooks/use-savings";
import { TipoMovimientoReserva } from "@/constants/enums";
import type { ReserveMovementRow } from "@/types/models";

export {
  useAllReserveMovements,
  useTargetReserveMovements,
  useCreateSavingsContribution,
  useCreateSavingsWithdrawal,
  useConfirmMonthlyPlannedSaving,
  useUnconfirmMonthlyPlannedSaving,
  useUpdateReserveMovement,
  useDeleteReserveMovement,
  useMonthlySavingStatus,
  usePlannedMonthlyTargets,
} from "@/features/savings/hooks/use-savings";

export type {
  SavingsTarget,
  SavingsContributionInput,
  SavingsWithdrawalInput,
  ConfirmMonthlyPlannedSavingResult,
  UnconfirmMonthlyPlannedSavingResult,
  PlannedTarget,
  PlannedTargetWithStatus,
  MonthlySavingStatus,
} from "@/features/savings/hooks/use-savings";

export function useReserveMovements(
  sheetId: string | null,
  reservaId?: string,
) {
  return useQuery({
    queryKey: ["reserveMovements", sheetId, reservaId ?? null],
    queryFn: async () => {
      if (!sheetId) return [];
      const rows = await readSheetData<ReserveMovementRow>(
        sheetId,
        SHEET_NAMES.MOV_RESERVAS,
        rowToReserveMovement,
      );
      const filtered = rows.filter((r) => r.id);
      if (reservaId) {
        return filtered.filter(
          (r) =>
            r.reservaId === reservaId ||
            (r.tipoDestino === "reserva" && r.destinoId === reservaId),
        );
      }
      return filtered;
    },
    enabled: !!sheetId,
  });
}

export function useCreateReserveMovement(sheetId: string | null) {
  const queryClient = useQueryClient();
  const core = useCreateSavingsContributionCore(sheetId);
  const withdrawal = useCreateSavingsWithdrawalCore(sheetId);
  return useMutation({
    mutationFn: async (data: {
      reservaId: string;
      tipoMovimiento: string;
      importe: number;
      cuentaOrigen?: string;
      cuentaDestino?: string;
      notas?: string;
      fecha?: string;
    }) => {
      const isWithdrawal = data.tipoMovimiento === TipoMovimientoReserva.RETIRADA;
      if (isWithdrawal) {
        return withdrawal.mutateAsync({
          tipoDestino: "reserva",
          destinoId: data.reservaId,
          reservaId: data.reservaId,
          importe: data.importe,
          cuentaOrigen: data.cuentaOrigen,
          cuentaDestino: data.cuentaDestino,
          notas: data.notas,
          fecha: data.fecha,
        });
      }
      return core.mutateAsync({
        tipoDestino: "reserva",
        destinoId: data.reservaId,
        reservaId: data.reservaId,
        importe: data.importe,
        cuentaOrigen: data.cuentaOrigen,
        cuentaDestino: data.cuentaDestino,
        notas: data.notas,
        fecha: data.fecha,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserveMovements"] });
      queryClient.invalidateQueries({ queryKey: ["reserves"] });
      queryClient.invalidateQueries({ queryKey: ["savingsLedger"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["futurePayments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financeSummary"] });
    },
  });
}
