"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  readConfirmedFixedExpenseIds,
  confirmFixedExpenseForMonth,
  unconfirmFixedExpenseForMonth,
  confirmAllPendingFixedExpensesForMonth,
  type ConfirmFixedExpenseResult,
  type UnconfirmFixedExpenseResult,
  type ConfirmAllResult,
} from "@/lib/finance/fixed-expense-confirmation";
import type { FixedExpenseRow } from "@/types/models";
import type { MonthKey } from "@/lib/finance/finance-engine";

export function useConfirmedFixedExpenseIds(
  sheetId: string | null,
  monthKey: MonthKey,
) {
  return useQuery({
    queryKey: ["fixedExpensesConfirmed", sheetId, monthKey],
    queryFn: async (): Promise<Set<string>> => {
      if (!sheetId) return new Set();
      return readConfirmedFixedExpenseIds({ sheetId, monthKey });
    },
    enabled: !!sheetId,
    staleTime: 15_000,
  });
}

export function useConfirmFixedExpense(sheetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      monthKey: MonthKey;
      fijo: FixedExpenseRow;
      draft?: {
        importe: number;
        categoria: string;
        cuentaOrigen: string;
        metodo: string;
        fecha: string;
        notas?: string;
      };
    }): Promise<ConfirmFixedExpenseResult> => {
      if (!sheetId) throw new Error("No sheet connected");
      return confirmFixedExpenseForMonth({ sheetId, ...args });
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", sheetId] });
      queryClient.invalidateQueries({
        queryKey: ["fixedExpensesConfirmed", sheetId, vars.monthKey],
      });
      queryClient.invalidateQueries({ queryKey: ["config", sheetId] });
    },
  });
}

export function useUnconfirmFixedExpense(sheetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      monthKey: MonthKey;
      fijoId: string;
    }): Promise<UnconfirmFixedExpenseResult> => {
      if (!sheetId) throw new Error("No sheet connected");
      return unconfirmFixedExpenseForMonth({ sheetId, ...args });
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", sheetId] });
      queryClient.invalidateQueries({
        queryKey: ["fixedExpensesConfirmed", sheetId, vars.monthKey],
      });
      queryClient.invalidateQueries({ queryKey: ["config", sheetId] });
    },
  });
}

export function useConfirmAllPendingFixedExpenses(sheetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      monthKey: MonthKey;
      fijos: FixedExpenseRow[];
      alreadyConfirmed: ReadonlySet<string>;
    }): Promise<ConfirmAllResult> => {
      if (!sheetId) throw new Error("No sheet connected");
      return confirmAllPendingFixedExpensesForMonth({ sheetId, ...args });
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", sheetId] });
      queryClient.invalidateQueries({
        queryKey: ["fixedExpensesConfirmed", sheetId, vars.monthKey],
      });
      queryClient.invalidateQueries({ queryKey: ["config", sheetId] });
    },
  });
}
