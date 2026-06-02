"use client";

import { useMemo } from "react";
import { useAppStore } from "@/stores/app-store";
import { hasToken } from "@/lib/sheets/client";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useFixedExpenses } from "@/features/fixed-expenses/hooks/use-fixed-expenses";
import { useFuturePayments } from "@/features/future-payments/hooks/use-future-payments";
import { useDeferredPayments } from "@/features/deferred-payments/hooks/use-deferred-payments";
import { useReserves } from "@/features/reserves/hooks/use-reserves";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { useAllReserveMovements } from "@/features/savings/hooks/use-savings";
import { useSalaryConfig } from "@/features/salary/hooks/use-salary";
import { useConfirmedFixedExpenseIds } from "@/features/fixed-expenses/hooks/use-fixed-confirmation";
import {
  buildFinanceContext,
  getDashboardSummary,
  type DashboardFinanceSummary,
  type MonthKey,
} from "@/lib/finance/finance-engine";

export interface UseFinanceSummaryOptions {
  monthKey?: MonthKey;
  confirmedFixedExpenseIds?: ReadonlySet<string>;
  confirmedDeferredPaymentIds?: ReadonlySet<string>;
}

export interface UseFinanceSummaryResult {
  summary: DashboardFinanceSummary;
  isLoading: boolean;
  isError: boolean;
}

export function useFinanceSummary(
  options: UseFinanceSummaryOptions = {},
): UseFinanceSummaryResult {
  const { sheetId } = useAppStore();
  const tokenOk = hasToken();
  const effectiveSheetId = sheetId && tokenOk ? sheetId : null;

  const monthKey =
    options.monthKey ?? new Date().toISOString().slice(0, 7);

  const { data: transactions, isLoading: lT, isError: eT } = useTransactions(effectiveSheetId, monthKey);
  const { data: categories, isLoading: lC } = useCategories(effectiveSheetId);
  const { data: accounts, isLoading: lA } = useAccounts(effectiveSheetId);
  const { data: fixedExpenses, isLoading: lF } = useFixedExpenses(effectiveSheetId);
  const { data: futurePayments, isLoading: lFP } = useFuturePayments(effectiveSheetId);
  const { data: deferredPayments, isLoading: lD } = useDeferredPayments(effectiveSheetId);
  const { data: reserves, isLoading: lR } = useReserves(effectiveSheetId);
  const { data: goals, isLoading: lG } = useGoals(effectiveSheetId);
  const { data: reserveMovements, isLoading: lRM } = useAllReserveMovements(effectiveSheetId);
  const { data: salaryConfig, isLoading: lS } = useSalaryConfig(effectiveSheetId);
  const { data: confirmedFixedIds, isLoading: lCF } = useConfirmedFixedExpenseIds(
    effectiveSheetId,
    monthKey,
  );

  const externalConfirmedFixed = options.confirmedFixedExpenseIds;
  const effectiveConfirmedFixed = useMemo(
    () => externalConfirmedFixed ?? confirmedFixedIds ?? new Set<string>(),
    [externalConfirmedFixed, confirmedFixedIds],
  );

  const summary = useMemo(() => {
    const ctx = buildFinanceContext({
      monthKey,
      transactions: transactions ?? [],
      categories: categories ?? [],
      accounts: accounts ?? [],
      fixedExpenses: fixedExpenses ?? [],
      futurePayments: futurePayments ?? [],
      deferredPayments: deferredPayments ?? [],
      reserves: reserves ?? [],
      goals: goals ?? [],
      reserveMovements: reserveMovements ?? [],
      monthlyIncome: salaryConfig?.enabled ? salaryConfig.fixedAmount : 0,
      incomeType: salaryConfig?.type ?? "fixed",
      confirmedFixedExpenseIds: effectiveConfirmedFixed,
      confirmedDeferredPaymentIds: options.confirmedDeferredPaymentIds,
    });
    return getDashboardSummary(ctx);
  }, [
    monthKey,
    transactions,
    categories,
    accounts,
    fixedExpenses,
    futurePayments,
    deferredPayments,
    reserves,
    goals,
    reserveMovements,
    salaryConfig,
    effectiveConfirmedFixed,
    options.confirmedDeferredPaymentIds,
  ]);

  return {
    summary,
    isLoading:
      !!effectiveSheetId && (lT || lC || lA || lF || lFP || lD || lR || lG || lRM || lS || lCF),
    isError: eT,
  };
}
