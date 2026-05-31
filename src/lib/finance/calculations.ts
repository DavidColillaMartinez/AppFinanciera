import { TransactionType } from "@/constants/enums";

export function calculateMonthlyIncome(
  transactions: { tipo: string; importe: number }[],
): number {
  return transactions
    .filter((t) => t.tipo === TransactionType.INGRESO)
    .reduce((sum, t) => sum + t.importe, 0);
}

export function calculateMonthlyExpenses(
  transactions: { tipo: string; importe: number }[],
): number {
  return transactions
    .filter((t) => t.tipo === TransactionType.GASTO)
    .reduce((sum, t) => sum + t.importe, 0);
}

export function calculateMonthlySavings(
  transactions: { tipo: string; importe: number }[],
): number {
  return transactions
    .filter((t) => t.tipo === TransactionType.AHORRO)
    .reduce((sum, t) => sum + t.importe, 0);
}

export function calculateMonthlyBalance(
  transactions: { tipo: string; importe: number }[],
): number {
  const income = calculateMonthlyIncome(transactions);
  const expenses = calculateMonthlyExpenses(transactions);
  return income - expenses;
}

export function calculateAvailableAmount(
  income: number,
  expenses: number,
  savings: number,
): number {
  return income - expenses - savings;
}

export function calculateBudgetUsed(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min((spent / budget) * 100, 100);
}

export function calculateBudgetRemaining(
  spent: number,
  budget: number,
): number {
  return Math.max(budget - spent, 0);
}

export function isOverBudget(spent: number, budget: number): boolean {
  return budget > 0 && spent > budget;
}

export function calculateMonthsRemaining(targetDate: string): number {
  if (!targetDate) return 0;
  const target = new Date(targetDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
}

export function calculateMonthlyContribution(
  remaining: number,
  months: number,
): number {
  if (months <= 0) return remaining;
  return remaining / months;
}

export function calculateGoalProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, 100);
}

export function calculateEstimatedCompletionDate(
  current: number,
  target: number,
  monthlyContribution: number,
): Date | null {
  if (monthlyContribution <= 0) return null;
  if (current >= target) return new Date();
  const remaining = target - current;
  const months = Math.ceil(remaining / monthlyContribution);
  const result = new Date();
  result.setMonth(result.getMonth() + months);
  return result;
}

export function isPaycheckToPaycheck(
  income: number,
  expenses: number,
): boolean {
  return expenses >= income * 0.95;
}

export function getFinancialHealthStatus(
  balance: number,
  expenses: number,
  income: number,
): "good" | "warning" | "danger" {
  if (balance < 0) return "danger";
  const savingsRate = balance / income;
  if (savingsRate < 0.1) return "warning";
  return "good";
}
