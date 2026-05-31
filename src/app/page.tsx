"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useAppStore } from "@/stores/app-store";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState, useMemo } from "react";
import {
  calculateMonthlyBalance,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateExpensesByCategory,
} from "@/lib/finance/calculations";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

export default function DashboardPage() {
  const { sheetId } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const {
    data: transactions,
    isLoading,
    isError,
    error,
  } = useTransactions(sheetId, selectedMonth);
  const { data: categories } = useCategories(sheetId);

  const filteredTransactions = useMemo(
    () => transactions ?? [],
    [transactions],
  );

  const balance = useMemo(
    () =>
      calculateMonthlyBalance(
        filteredTransactions.map((t) => ({ tipo: t.tipo, importe: t.importe })),
      ),
    [filteredTransactions],
  );
  const income = useMemo(
    () =>
      calculateMonthlyIncome(
        filteredTransactions.map((t) => ({ tipo: t.tipo, importe: t.importe })),
      ),
    [filteredTransactions],
  );
  const expenses = useMemo(
    () =>
      calculateMonthlyExpenses(
        filteredTransactions.map((t) => ({ tipo: t.tipo, importe: t.importe })),
      ),
    [filteredTransactions],
  );

  const expensesByCategory = useMemo(() => {
    const byCategory = calculateExpensesByCategory(
      filteredTransactions.filter((t) => t.tipo === "Gasto"),
      categories ?? [],
    );
    return byCategory.map((item, i) => ({
      name: item.categoryName || item.category,
      value: item.total,
      color: COLORS[i % COLORS.length],
    }));
  }, [filteredTransactions, categories]);

  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  if (isLoading) return <LoadingState message="Cargando dashboard..." />;
  if (isError)
    return (
      <ErrorState message={(error as Error)?.message ?? "Error al cargar"} />
    );

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p
              className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ahorro</p>
            <p
              className={`text-2xl font-bold ${savingsRate >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {savingsRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-2xl font-bold text-green-600">
              {income.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="text-2xl font-bold text-red-600">
              {expenses.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {expensesByCategory.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-4">Gastos por categoria</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-4">Detalle de gastos</h2>
          <div className="space-y-3">
            {expensesByCategory.slice(0, 5).map((cat) => {
              const catData = categories?.find((c) => c.nombre === cat.name);
              const budget = catData?.presupuestoMensual ?? 0;
              const pct =
                budget > 0 ? Math.min((cat.value / budget) * 100, 100) : 0;

              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{cat.name}</span>
                    <span className="font-medium">{cat.value.toFixed(2)}</span>
                  </div>
                  {budget > 0 && (
                    <>
                      <Progress value={pct} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {pct.toFixed(0)}% del presupuesto ({budget.toFixed(2)})
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
