"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  buildContributionId,
  buildMonthlyPlannedSavingId,
  buildWithdrawalId,
  confirmMonthlyPlannedSaving as confirmMonthlyPlannedSavingService,
  createSavingsContribution as createSavingsContributionService,
  createSavingsWithdrawal as createSavingsWithdrawalService,
  getActiveMovements,
  getEntriesForTarget,
  hasMonthlyPlannedSaving,
  isDeletedMovement,
  normalizeTipoDestino,
  normalizeTipoMovimiento,
  readAllReserveMovements,
  softDeleteReserveMovement,
  unconfirmMonthlyPlannedSaving as unconfirmMonthlyPlannedSavingService,
  updateReserveMovement as updateReserveMovementService,
  type ConfirmMonthlyPlannedSavingInput,
  type ConfirmMonthlyPlannedSavingResult,
  type SavingsContributionInput,
  type SavingsTarget,
  type SavingsWithdrawalInput,
  type UnconfirmMonthlyPlannedSavingResult,
} from "@/lib/finance/savings-ledger";
import type { ReserveMovementRow } from "@/types/models";
import type { MonthKey } from "@/lib/finance/finance-engine";
import {
  TipoDestinoReserva,
  type TipoDestinoReserva as TipoDestinoReservaType,
  type TipoMovimientoReserva as TipoMovimientoReservaType,
} from "@/constants/enums";

export type {
  ConfirmMonthlyPlannedSavingResult,
  SavingsContributionInput,
  SavingsTarget,
  SavingsWithdrawalInput,
  UnconfirmMonthlyPlannedSavingResult,
};

export const SAVINGS_LEDGER_QUERY_KEY = "savingsLedger";

export function useAllReserveMovements(sheetId: string | null) {
  return useQuery({
    queryKey: [SAVINGS_LEDGER_QUERY_KEY, sheetId],
    queryFn: async (): Promise<ReserveMovementRow[]> => {
      if (!sheetId) return [];
      return readAllReserveMovements(sheetId);
    },
    enabled: !!sheetId,
  });
}

export function useTargetReserveMovements(
  sheetId: string | null,
  target: SavingsTarget | null,
) {
  return useQuery({
    queryKey: [SAVINGS_LEDGER_QUERY_KEY, sheetId, target?.tipoDestino, target?.destinoId],
    queryFn: async (): Promise<ReserveMovementRow[]> => {
      if (!sheetId || !target) return [];
      const all = await readAllReserveMovements(sheetId);
      return getEntriesForTarget(all, target);
    },
    enabled: !!sheetId && !!target,
  });
}

export function useCreateSavingsContribution(sheetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: SavingsContributionInput,
    ): Promise<ReserveMovementRow> => {
      if (!sheetId) throw new Error("No sheet connected");
      return createSavingsContributionService({ sheetId, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SAVINGS_LEDGER_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["reserveMovements"] });
      queryClient.invalidateQueries({ queryKey: ["reserves"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["futurePayments"] });
    },
  });
}

export function useCreateSavingsWithdrawal(sheetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: SavingsWithdrawalInput,
    ): Promise<ReserveMovementRow> => {
      if (!sheetId) throw new Error("No sheet connected");
      return createSavingsWithdrawalService({ sheetId, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SAVINGS_LEDGER_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["reserveMovements"] });
      queryClient.invalidateQueries({ queryKey: ["reserves"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["futurePayments"] });
    },
  });
}

export function useConfirmMonthlyPlannedSaving(sheetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: ConfirmMonthlyPlannedSavingInput,
    ): Promise<ConfirmMonthlyPlannedSavingResult> => {
      if (!sheetId) throw new Error("No sheet connected");
      return confirmMonthlyPlannedSavingService({ sheetId, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SAVINGS_LEDGER_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["reserveMovements"] });
      queryClient.invalidateQueries({ queryKey: ["reserves"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["futurePayments"] });
    },
  });
}

export function useUnconfirmMonthlyPlannedSaving(sheetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      monthKey: MonthKey;
      tipoDestino: TipoDestinoReservaType;
      destinoId: string;
    }): Promise<UnconfirmMonthlyPlannedSavingResult> => {
      if (!sheetId) throw new Error("No sheet connected");
      return unconfirmMonthlyPlannedSavingService({
        sheetId,
        monthKey: args.monthKey,
        tipoDestino: args.tipoDestino,
        destinoId: args.destinoId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SAVINGS_LEDGER_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["reserveMovements"] });
      queryClient.invalidateQueries({ queryKey: ["reserves"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["futurePayments"] });
    },
  });
}

export function useUpdateReserveMovement(sheetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      tipoMovimiento?: TipoMovimientoReservaType;
      importe?: number;
      cuentaOrigen?: string;
      cuentaDestino?: string;
      notas?: string;
      fecha?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      await updateReserveMovementService({ sheetId, ...args });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SAVINGS_LEDGER_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["reserveMovements"] });
    },
  });
}

export function useDeleteReserveMovement(sheetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!sheetId) throw new Error("No sheet connected");
      await softDeleteReserveMovement({ sheetId, id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SAVINGS_LEDGER_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["reserveMovements"] });
    },
  });
}

export interface MonthlySavingStatus {
  monthKey: MonthKey;
  confirmedTargetIds: Set<string>;
  entriesByTarget: Map<string, ReserveMovementRow>;
}

export function useMonthlySavingStatus(
  sheetId: string | null,
  monthKey: MonthKey,
) {
  return useQuery({
    queryKey: [SAVINGS_LEDGER_QUERY_KEY, sheetId, "monthlyStatus", monthKey],
    queryFn: async (): Promise<MonthlySavingStatus> => {
      if (!sheetId) {
        return { monthKey, confirmedTargetIds: new Set(), entriesByTarget: new Map() };
      }
      const all = await readAllReserveMovements(sheetId);
      const active = getActiveMovements(all);
      const monthEntries = active.filter((m) => {
        if (!m.id.startsWith("LEDGER-MONTHLY-")) return false;
        const mKey = m.mesClave || (m.fecha ?? "").slice(0, 7);
        return mKey === monthKey;
      });
      const confirmedTargetIds = new Set<string>();
      const entriesByTarget = new Map<string, ReserveMovementRow>();
      for (const m of monthEntries) {
        const key = `${m.tipoDestino}::${m.destinoId}`;
        confirmedTargetIds.add(key);
        entriesByTarget.set(key, m);
      }
      return { monthKey, confirmedTargetIds, entriesByTarget };
    },
    enabled: !!sheetId,
  });
}

export interface PlannedTarget {
  tipoDestino: TipoDestinoReservaType;
  destinoId: string;
  reservaId: string;
  nombre: string;
  tipoLabel: string;
  importeObjetivo: number;
  monthlyRecommended: number;
}

export interface PlannedTargetWithStatus extends PlannedTarget {
  confirmed: boolean;
  existingAmount: number;
  effectiveAmount: number;
}

export function usePlannedMonthlyTargets(
  sheetId: string | null,
  monthKey: MonthKey,
  options?: {
    reserves?: Array<{
      reservaId: string;
      nombre: string;
      tipo: string;
      importeObjetivo: number;
      aporteMensualSugerido: number;
      activo: string;
    }>;
    goals?: Array<{
      objetivoId: string;
      nombre: string;
      tipo: string;
      importeObjetivo: number;
      aporteMensual: number;
      estado: string;
    }>;
    futurePayments?: Array<{
      pagoId: string;
      concepto: string;
      importeObjetivo: number;
      aporteMensual: number;
      activo: string;
    }>;
  },
) {
  const targets: PlannedTarget[] = [];

  for (const r of options?.reserves ?? []) {
    if (r.activo !== "S") continue;
    if (r.aporteMensualSugerido <= 0) continue;
    targets.push({
      tipoDestino: TipoDestinoReserva.RESERVA,
      destinoId: r.reservaId,
      reservaId: r.reservaId,
      nombre: r.nombre,
      tipoLabel: r.tipo,
      importeObjetivo: r.importeObjetivo,
      monthlyRecommended: r.aporteMensualSugerido,
    });
  }

  for (const g of options?.goals ?? []) {
    if (g.estado !== "Activo") continue;
    if (g.aporteMensual <= 0) continue;
    targets.push({
      tipoDestino: TipoDestinoReserva.OBJETIVO,
      destinoId: g.objetivoId,
      reservaId: g.objetivoId,
      nombre: g.nombre,
      tipoLabel: g.tipo,
      importeObjetivo: g.importeObjetivo,
      monthlyRecommended: g.aporteMensual,
    });
  }

  for (const f of options?.futurePayments ?? []) {
    if (f.activo !== "S") continue;
    if (f.aporteMensual <= 0) continue;
    targets.push({
      tipoDestino: TipoDestinoReserva.PAGO_FUTURO,
      destinoId: f.pagoId,
      reservaId: f.pagoId,
      nombre: f.concepto,
      tipoLabel: "Pago futuro",
      importeObjetivo: f.importeObjetivo,
      monthlyRecommended: f.aporteMensual,
    });
  }

  const status = useMonthlySavingStatus(sheetId, monthKey);
  const data = status.data;
  const isLoading = status.isLoading;
  const isError = status.isError;
  const error = status.error;

  const withStatus: PlannedTargetWithStatus[] = targets.map((t) => {
    const key = `${t.tipoDestino}::${t.destinoId}`;
    const existing = data?.entriesByTarget.get(key);
    return {
      ...t,
      confirmed: data?.confirmedTargetIds.has(key) ?? false,
      existingAmount: existing?.importe ?? 0,
      effectiveAmount: existing?.importe ?? t.monthlyRecommended,
    };
  });

  return {
    targets: withStatus,
    isLoading,
    isError,
    error,
  };
}

export {
  buildContributionId,
  buildMonthlyPlannedSavingId,
  buildWithdrawalId,
  getEntriesForTarget,
  hasMonthlyPlannedSaving,
  isDeletedMovement,
  normalizeTipoDestino,
  normalizeTipoMovimiento,
  readAllReserveMovements,
};

import { calculateLedgerBalance } from "@/lib/finance/savings-ledger";

export interface TargetBalance {
  tipoDestino: TipoDestinoReservaType;
  destinoId: string;
  reservaId: string;
  balance: number;
  manualBalance: number;
  effectiveBalance: number;
  hasLedgerEntries: boolean;
}

export interface TargetBalanceOptions {
  reserves?: Array<{ reservaId: string; saldoActual: number }>;
  goals?: Array<{ objetivoId: string; saldoActual: number }>;
  futurePayments?: Array<{ pagoId: string; saldoReservado: number }>;
}

export function computeTargetBalances(
  movements: ReserveMovementRow[],
  options: TargetBalanceOptions,
): TargetBalance[] {
  const balances: TargetBalance[] = [];

  for (const r of options.reserves ?? []) {
    const entries = getEntriesForTarget(movements, {
      tipoDestino: TipoDestinoReserva.RESERVA,
      destinoId: r.reservaId,
    });
    const ledgerBalance = calculateLedgerBalance(entries);
    const hasLedger = entries.length > 0;
    balances.push({
      tipoDestino: TipoDestinoReserva.RESERVA,
      destinoId: r.reservaId,
      reservaId: r.reservaId,
      balance: ledgerBalance,
      manualBalance: r.saldoActual,
      effectiveBalance: hasLedger ? ledgerBalance : r.saldoActual,
      hasLedgerEntries: hasLedger,
    });
  }

  for (const g of options.goals ?? []) {
    const entries = getEntriesForTarget(movements, {
      tipoDestino: TipoDestinoReserva.OBJETIVO,
      destinoId: g.objetivoId,
    });
    const ledgerBalance = calculateLedgerBalance(entries);
    const hasLedger = entries.length > 0;
    balances.push({
      tipoDestino: TipoDestinoReserva.OBJETIVO,
      destinoId: g.objetivoId,
      reservaId: g.objetivoId,
      balance: ledgerBalance,
      manualBalance: g.saldoActual,
      effectiveBalance: hasLedger ? ledgerBalance : g.saldoActual,
      hasLedgerEntries: hasLedger,
    });
  }

  for (const f of options.futurePayments ?? []) {
    const entries = getEntriesForTarget(movements, {
      tipoDestino: TipoDestinoReserva.PAGO_FUTURO,
      destinoId: f.pagoId,
    });
    const ledgerBalance = calculateLedgerBalance(entries);
    const hasLedger = entries.length > 0;
    balances.push({
      tipoDestino: TipoDestinoReserva.PAGO_FUTURO,
      destinoId: f.pagoId,
      reservaId: f.pagoId,
      balance: ledgerBalance,
      manualBalance: f.saldoReservado,
      effectiveBalance: hasLedger ? ledgerBalance : f.saldoReservado,
      hasLedgerEntries: hasLedger,
    });
  }

  return balances;
}

export function useTargetBalances(
  sheetId: string | null,
  options: TargetBalanceOptions,
): {
  data: TargetBalance[];
  isLoading: boolean;
  isError: boolean;
} {
  const all = useAllReserveMovements(sheetId);
  const stableKey = useMemo(
    () =>
      [
        (options.reserves ?? []).map((r) => `${r.reservaId}:${r.saldoActual}`).join(","),
        (options.goals ?? []).map((g) => `${g.objetivoId}:${g.saldoActual}`).join(","),
        (options.futurePayments ?? []).map((f) => `${f.pagoId}:${f.saldoReservado}`).join(","),
      ].join("|"),
    [options.reserves, options.goals, options.futurePayments],
  );
  const data = useMemo<TargetBalance[]>(() => {
    return computeTargetBalances(all.data ?? [], options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.data, stableKey]);
  return {
    data,
    isLoading: all.isLoading,
    isError: all.isError,
  };
}

export function useTargetBalance(
  sheetId: string | null,
  target: SavingsTarget | null,
  manualBalance: number,
): {
  data: TargetBalance | null;
  isLoading: boolean;
  isError: boolean;
} {
  const all = useAllReserveMovements(sheetId);
  const data = useMemo<TargetBalance | null>(() => {
    if (!target) return null;
    if (target.tipoDestino === TipoDestinoReserva.RESERVA) {
      const entries = getEntriesForTarget(all.data ?? [], target);
      const ledgerBalance = calculateLedgerBalance(entries);
      const hasLedger = entries.length > 0;
      return {
        tipoDestino: TipoDestinoReserva.RESERVA,
        destinoId: target.destinoId,
        reservaId: target.destinoId,
        balance: ledgerBalance,
        manualBalance,
        effectiveBalance: hasLedger ? ledgerBalance : manualBalance,
        hasLedgerEntries: hasLedger,
      };
    }
    if (target.tipoDestino === TipoDestinoReserva.OBJETIVO) {
      const entries = getEntriesForTarget(all.data ?? [], target);
      const ledgerBalance = calculateLedgerBalance(entries);
      const hasLedger = entries.length > 0;
      return {
        tipoDestino: TipoDestinoReserva.OBJETIVO,
        destinoId: target.destinoId,
        reservaId: target.destinoId,
        balance: ledgerBalance,
        manualBalance,
        effectiveBalance: hasLedger ? ledgerBalance : manualBalance,
        hasLedgerEntries: hasLedger,
      };
    }
    const entries = getEntriesForTarget(all.data ?? [], target);
    const ledgerBalance = calculateLedgerBalance(entries);
    const hasLedger = entries.length > 0;
    return {
      tipoDestino: TipoDestinoReserva.PAGO_FUTURO,
      destinoId: target.destinoId,
      reservaId: target.destinoId,
      balance: ledgerBalance,
      manualBalance,
      effectiveBalance: hasLedger ? ledgerBalance : manualBalance,
      hasLedgerEntries: hasLedger,
    };
  }, [all.data, target, manualBalance]);

  return {
    data,
    isLoading: all.isLoading,
    isError: all.isError,
  };
}
