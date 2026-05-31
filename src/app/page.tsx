"use client";

import { useState, useMemo } from "react";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useAppStore } from "@/stores/app-store";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { ChartWidget, DetailWidget } from "@/components/dashboard/dashboard-widgets";
import { DashboardCustomizer } from "@/components/dashboard/dashboard-customizer";

export default function DashboardPage() {
  const { sheetId, dashboardConfig } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [customizerOpen, setCustomizerOpen] = useState(false);

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

  const visibleWidgets = useMemo(() => {
    return dashboardConfig.widgets
      .filter((w) => w.visible)
      .map((w) => w.id);
  }, [dashboardConfig.widgets]);

  const metricsVisible = visibleWidgets.includes("balance");
  const savingsVisible = visibleWidgets.includes("savings");
  const incomeVisible = visibleWidgets.includes("income");
  const expensesVisible = visibleWidgets.includes("expenses");
  const chartVisible = visibleWidgets.includes("chart");
  const detailVisible = visibleWidgets.includes("detail");

  if (isLoading) return <LoadingState message="Cargando dashboard..." />;
  if (isError)
    return (
      <ErrorState message={(error as Error)?.message ?? "Error al cargar"} />
    );

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => setCustomizerOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(metricsVisible || savingsVisible || incomeVisible || expensesVisible) && (
        <div className="grid grid-cols-2 gap-3">
          {metricsVisible && (
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredTransactions
                    .reduce((acc, t) => {
                      if (t.tipo === "Ingreso") return acc + t.importe;
                      if (t.tipo === "Gasto") return acc - t.importe;
                      return acc;
                    }, 0)
                    .toFixed(2)}
                </p>
              </div>
              {savingsVisible && (
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Ahorro</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(() => {
                      const income = filteredTransactions
                        .filter((t) => t.tipo === "Ingreso")
                        .reduce((acc, t) => acc + t.importe, 0);
                      const expenses = filteredTransactions
                        .filter((t) => t.tipo === "Gasto")
                        .reduce((acc, t) => acc + t.importe, 0);
                      const rate = income > 0 ? ((income - expenses) / income) * 100 : 0;
                      return `${rate.toFixed(1)}%`;
                    })()}
                  </p>
                </div>
              )}
              {incomeVisible && (
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Ingresos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredTransactions
                      .filter((t) => t.tipo === "Ingreso")
                      .reduce((acc, t) => acc + t.importe, 0)
                      .toFixed(2)}
                  </p>
                </div>
              )}
              {expensesVisible && (
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Gastos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredTransactions
                      .filter((t) => t.tipo === "Gasto")
                      .reduce((acc, t) => acc + t.importe, 0)
                      .toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {chartVisible && <ChartWidget transactions={filteredTransactions} />}

      {detailVisible && (
        <DetailWidget
          transactions={filteredTransactions}
          categories={categories ?? []}
        />
      )}

      <DashboardCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
      />
    </div>
  );
}
