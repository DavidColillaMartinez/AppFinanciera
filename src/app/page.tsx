"use client";

import { useState, useMemo } from "react";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useAppStore } from "@/stores/app-store";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { Settings, TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { ChartWidget, DetailWidget } from "@/components/dashboard/dashboard-widgets";
import { DashboardCustomizer } from "@/components/dashboard/dashboard-customizer";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function FinancialHealthBadge({ savingsRate }: { savingsRate: number }) {
  let label: string;
  let color: string;
  let bg: string;

  if (savingsRate >= 20) {
    label = "Saludable";
    color = "text-income";
    bg = "bg-income/10";
  } else if (savingsRate >= 10) {
    label = "Moderado";
    color = "text-warning";
    bg = "bg-warning/10";
  } else {
    label = "Atencion";
    color = "text-expense";
    bg = "bg-expense/10";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        bg,
        color,
      )}
    >
      {savingsRate >= 20 ? (
        <TrendingUp className="h-3 w-3" />
      ) : savingsRate >= 10 ? (
        <Wallet className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  delay,
}: {
  title: string;
  value: string;
  icon: typeof Wallet;
  colorClass: string;
  bgClass: string;
  delay: number;
}) {
  return (
    <Card
      className={cn("overflow-hidden animate-fade-in", bgClass)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className={cn("text-2xl font-bold tracking-tight", colorClass)}>
              {value}
            </p>
          </div>
          <div
            className={cn(
              "rounded-xl p-2.5 opacity-90",
              bgClass.replace("bg-", "bg-") + "/20",
            )}
          >
            <Icon className={cn("h-5 w-5", colorClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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

  const income = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.tipo === "Ingreso")
        .reduce((acc, t) => acc + t.importe, 0),
    [filteredTransactions],
  );

  const expenses = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.tipo === "Gasto")
        .reduce((acc, t) => acc + t.importe, 0),
    [filteredTransactions],
  );

  const balance = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  const visibleWidgets = useMemo(() => {
    return dashboardConfig.widgets
      .filter((w) => w.visible)
      .map((w) => w.id);
  }, [dashboardConfig.widgets]);

  const chartVisible = visibleWidgets.includes("chart");
  const detailVisible = visibleWidgets.includes("detail");

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthName = MONTH_NAMES[month - 1] ?? "";

  if (isLoading) return <LoadingState message="Cargando dashboard..." />;
  if (isError)
    return (
      <ErrorState message={(error as Error)?.message ?? "Error al cargar"} />
    );

  return (
    <div className="px-4 py-6 space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">
            {monthName} {year}
          </h1>
          <p className="text-sm text-muted-foreground">Tu resumen financiero</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shadow-sm"
            onClick={() => setCustomizerOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <MetricCard
          title="Balance"
          value={`${balance >= 0 ? "+" : ""}${balance.toFixed(2)}`}
          icon={balance >= 0 ? TrendingUp : TrendingDown}
          colorClass={balance >= 0 ? "text-income" : "text-expense"}
          bgClass={balance >= 0 ? "card-income" : "card-expense"}
          delay={0}
        />
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Ingresos"
            value={`+${income.toFixed(2)}`}
            icon={TrendingUp}
            colorClass="text-income"
            bgClass="card-income"
            delay={100}
          />
          <MetricCard
            title="Gastos"
            value={`-${expenses.toFixed(2)}`}
            icon={TrendingDown}
            colorClass="text-expense"
            bgClass="card-expense"
            delay={150}
          />
        </div>
      </div>

      <Card
        className="overflow-hidden animate-fade-in"
        style={{ animationDelay: "200ms" }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tasa de ahorro
              </p>
              <p
                className={cn(
                  "text-3xl font-bold tracking-tight",
                  savingsRate >= 20
                    ? "text-income"
                    : savingsRate >= 10
                      ? "text-warning"
                      : "text-expense",
                )}
              >
                {savingsRate.toFixed(1)}%
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <FinancialHealthBadge savingsRate={savingsRate} />
              <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    savingsRate >= 20
                      ? "bg-income"
                      : savingsRate >= 10
                        ? "bg-warning"
                        : "bg-expense",
                  )}
                  style={{ width: `${Math.min(savingsRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {balance >= 0 ? "+" : ""}
                {balance.toFixed(2)} ahorrados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {chartVisible && (
        <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
          <ChartWidget transactions={filteredTransactions} />
        </div>
      )}

      {detailVisible && (
        <div className="animate-fade-in" style={{ animationDelay: "350ms" }}>
          <DetailWidget
            transactions={filteredTransactions}
            categories={categories ?? []}
          />
        </div>
      )}

      <DashboardCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
      />
    </div>
  );
}
