"use client";

import { useMemo } from "react";
import { useAppStore } from "@/stores/app-store";
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

  const monthKey =
    options.monthKey ?? new Date().toISOString().slice(0, 7);

  const { data: transactions, isLoading: lT, isError: eT } = useTransactions(sheetId, monthKey);
  const { data: categories, isLoading: lC } = useCategories(sheetId);
  const { data: accounts, isLoading: lA } = useAccounts(sheetId);
  const { data: fixedExpenses, isLoading: lF } = useFixedExpenses(sheetId);
  const { data: futurePayments, isLoading: lFP } = useFuturePayments(sheetId);
  const { data: deferredPayments, isLoading: lD } = useDeferredPayments(sheetId);
  const { data: reserves, isLoading: lR } = useReserves(sheetId);
  const { data: goals, isLoading: lG } = useGoals(sheetId);
  const { data: reserveMovements, isLoading: lRM } = useAllReserveMovements(sheetId);
  const { data: salaryConfig, isLoading: lS } = useSalaryConfig(sheetId);
  const { data: confirmedFixedIds, isLoading: lCF } = useConfirmedFixedExpenseIds(
    sheetId,
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
      lT || lC || lA || lF || lFP || lD || lR || lG || lRM || lS || lCF,
    isError: eT,
  };
}
