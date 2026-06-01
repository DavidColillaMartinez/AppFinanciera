"use client";

import { useState, useMemo, useEffect } from "react";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useFixedExpenses } from "@/features/fixed-expenses/hooks/use-fixed-expenses";
import { useFuturePayments } from "@/features/future-payments/hooks/use-future-payments";
import { useDeferredPayments } from "@/features/deferred-payments/hooks/use-deferred-payments";
import { useAppStore } from "@/stores/app-store";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Settings,
  Receipt,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { DashboardCustomizer } from "@/components/dashboard/dashboard-customizer";
import { SavingsPanelExpanded } from "@/components/dashboard/savings-panel-expanded";
import {
  useWidgetReorder,
  ReorderOverlay,
} from "@/components/dashboard/widget-reorder";
import { ChartRenderer } from "@/components/dashboard/chart-renderer";
import { TransactionType } from "@/constants/enums";
import { cn } from "@/lib/utils";
import {
  calculateExpensesByCategory,
} from "@/lib/finance/calculations";
import { ensureMonthlySalary, shouldAddSalaryToday } from "@/lib/finance/salary";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useRouter } from "next/navigation";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

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

function MetricCard({
  title,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  delay,
  onClick,
  isActive,
}: {
  title: string;
  value: string;
  icon: typeof Wallet;
  colorClass: string;
  bgClass: string;
  delay: number;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden animate-fade-in transition-all",
        bgClass,
        onClick && "cursor-pointer hover:shadow-md active:scale-[0.98]"
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
              {isActive !== undefined && (
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  isActive ? "bg-green-500" : "bg-muted-foreground/30"
                )} />
              )}
            </div>
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

export default function VistaMesPage() {
  const router = useRouter();
  const {
    sheetId,
    dashboardConfig,
    monthlyIncome,
    incomeType,
    salaryAddedMonths,
    addSalaryMonth,
  } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);
  const [salaryAutoAdded, setSalaryAutoAdded] = useState(false);
  const [savingsExpanded, setSavingsExpanded] = useState(false);

  const widgets = dashboardConfig.widgets;
  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.visible ?? true;

  const {
    reorderWidgets,
  } = useAppStore();
  const {
    isReorderMode,
    enterReorderMode,
    exitReorderMode,
    confirmReorder,
    selectForReorder,
    pickedIndex,
    activeIndex,
  } = useWidgetReorder(widgets, (from, to) => {
    reorderWidgets(from, to);
  });

  const {
    data: transactions,
    isLoading,
    isError,
    error,
    refetch: refetchTransactions,
  } = useTransactions(sheetId, selectedMonth);
  const { data: categories } = useCategories(sheetId);
  const { data: accounts } = useAccounts(sheetId);
  const { data: fixedExpenses } = useFixedExpenses(sheetId);
  const { data: futurePayments } = useFuturePayments(sheetId);
  const { data: deferredPayments } = useDeferredPayments(sheetId);

  useEffect(() => {
    if (!sheetId || incomeType !== "fixed" || !monthlyIncome) return;
    if (!shouldAddSalaryToday(incomeType, salaryAddedMonths)) return;

    async function addSalary() {
      if (!sheetId) return;
      try {
        const result = await ensureMonthlySalary(
          sheetId as string,
          monthlyIncome,
          incomeType,
          salaryAddedMonths,
          addSalaryMonth
        );
        if (result.added) {
          setSalaryAutoAdded(true);
          await refetchTransactions();
        }
      } catch (e) {
        console.error("Error adding salary:", e);
      }
    }
    addSalary();
  }, [sheetId, monthlyIncome, incomeType, salaryAddedMonths]);

  const filteredTransactions = useMemo(
    () => transactions ?? [],
    [transactions],
  );

  const totalIncome = useMemo(() => {
    const transactionsIncome = filteredTransactions
      .filter((t) => t.tipo === "Ingreso")
      .reduce((acc, t) => acc + t.importe, 0);
    return transactionsIncome;
  }, [filteredTransactions]);

  const totalExpenses = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.tipo === "Gasto")
        .reduce((acc, t) => acc + t.importe, 0),
    [filteredTransactions],
  );

  const userSavingsThisMonth = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.tipo === "Ahorro")
        .reduce((acc, t) => acc + t.importe, 0),
    [filteredTransactions],
  );

  const fixedMonthly = useMemo(() => {
    return (fixedExpenses ?? []).reduce((acc, exp) => {
      if (exp.frecuencia === "Mensual") return acc + exp.importe;
      if (exp.frecuencia === "Trimestral") return acc + exp.importe / 3;
      if (exp.frecuencia === "Anual") return acc + exp.importe / 12;
      return acc;
    }, 0);
  }, [fixedExpenses]);

  const deferredMonthly = useMemo(() => {
    return (deferredPayments ?? [])
      .filter((p) => p.estado === "Activo")
      .reduce((acc, p) => acc + p.cuotaMensual, 0);
  }, [deferredPayments]);

  const futureMonthly = useMemo(() => {
    return (futurePayments ?? [])
      .filter((p) => p.activo === "S")
      .reduce((acc, p) => acc + p.aporteMensual, 0);
  }, [futurePayments]);

  const totalExpensesWithFixed = fixedMonthly + deferredMonthly + futureMonthly + totalExpenses;

  const availableBalance = totalIncome - totalExpensesWithFixed - userSavingsThisMonth;

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

  const savingsPlanData = useMemo(() => {
    const baseIncome = totalIncome > 0 ? totalIncome : monthlyIncome;
    if (baseIncome === 0) return null;
    const netForMonth = baseIncome - totalExpensesWithFixed;
    const suggestedSavings = Math.max(0, netForMonth * 0.2);
    const discretionaryBudget = netForMonth - suggestedSavings;
    return {
      baseIncome,
      totalFixed: totalExpensesWithFixed,
      netForMonth,
      suggestedSavings,
      discretionaryBudget,
      savingsRate: 20,
    };
  }, [totalIncome, monthlyIncome, totalExpensesWithFixed]);

  const chartData = useMemo(() => {
    const activeCharts = dashboardConfig.charts.filter((c) => c.dataSource === "categories");
    if (activeCharts.length > 0) return expensesByCategory;
    return expensesByCategory;
  }, [dashboardConfig.charts, expensesByCategory]);

  const recentTransactions = useMemo(() => {
    return filteredTransactions.slice(0, 5);
  }, [filteredTransactions]);

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthName = MONTH_NAMES[month - 1] ?? "";

  function handleAddType(type: TransactionType) {
    setSelectedType(type);
    setShowAddMenu(false);
    setShowTransactionForm(true);
  }

  function handleIncomeClick() {
    router.push("/transactions?filterType=Ingreso");
  }

  function handleExpensesClick() {
    router.push("/transactions?filterType=Gasto");
  }

  function handleSavingsClick() {
    setSavingsExpanded(!savingsExpanded);
  }

  if (isLoading) return <LoadingState message="Cargando vista del mes..." />;
  if (isError)
    return (
      <ErrorState message={(error as Error)?.message ?? "Error al cargar"} />
    );

  return (
    <div className="px-4 py-6 space-y-6 pb-32">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {new Date().getFullYear()}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {monthName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setShowCustomizer(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Vista del mes</p>
      </div>

      <div className="space-y-3">
        <MetricCard
          title="Disponible"
          value={`${availableBalance >= 0 ? "+" : ""}${availableBalance.toFixed(2)}`}
          icon={Wallet}
          colorClass={availableBalance >= 0 ? "text-income" : "text-expense"}
          bgClass={availableBalance >= 0 ? "card-income" : "card-expense"}
          delay={0}
        />
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Ingresos"
            value={`+${totalIncome.toFixed(2)}`}
            icon={TrendingUp}
            colorClass="text-income"
            bgClass="card-income"
            delay={100}
            onClick={handleIncomeClick}
          />
          <MetricCard
            title="Gastos"
            value={`-${totalExpenses.toFixed(2)}`}
            icon={TrendingDown}
            colorClass="text-expense"
            bgClass="card-expense"
            delay={150}
            onClick={handleExpensesClick}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Ahorro"
            value={`+${userSavingsThisMonth.toFixed(2)}`}
            icon={PiggyBank}
            colorClass="text-savings"
            bgClass={cn("card-savings", savingsExpanded && "ring-2 ring-savings")}
            delay={200}
            onClick={handleSavingsClick}
            isActive={savingsExpanded}
          />
          <MetricCard
            title="Total gastos"
            value={`-${totalExpensesWithFixed.toFixed(2)}`}
            icon={Receipt}
            colorClass="text-warning"
            bgClass="bg-warning/10 border-warning/20"
            delay={250}
          />
        </div>
      </div>

      {savingsExpanded && <SavingsPanelExpanded />}

      {isVisible("chart") && dashboardConfig.charts.length > 0 && (
        <Card
          className="overflow-hidden animate-fade-in"
          style={{ animationDelay: "300ms", borderColor: dashboardConfig.charts[0].accentColor + "30" }}
        >
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              {dashboardConfig.charts[0].name}
            </h2>
            <div className="h-64">
              <ChartRenderer
                chart={dashboardConfig.charts[0]}
                data={chartData}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {isVisible("chart") && dashboardConfig.charts.length === 0 && (
        <Card className="overflow-hidden animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardContent className="p-4 text-center py-8">
            <p className="text-sm text-muted-foreground">No hay graficos creados.</p>
            <p className="text-xs text-muted-foreground mt-1">Usa el boton de personalizar para crear uno.</p>
          </CardContent>
        </Card>
      )}

      {isVisible("savingsPlan") && savingsPlanData && (
        <Card className="overflow-hidden animate-fade-in border-blue-200 bg-blue-50/50" style={{ animationDelay: "320ms" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-savings" />
                Plan de ahorro del mes
              </h2>
              {monthlyIncome > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-income/20 text-income font-medium">
                  {incomeType === "fixed" ? "Fija" : "Variable"}
                </span>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ingresos</span>
                <span className="font-medium text-income">+{savingsPlanData.baseIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gastos fijos mensuales</span>
                <span className="font-medium">-{savingsPlanData.totalFixed.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Disponible</span>
                <span className={savingsPlanData.netForMonth >= 0 ? "text-income" : "text-expense"}>
                  {savingsPlanData.netForMonth >= 0 ? "+" : ""}{savingsPlanData.netForMonth.toFixed(2)}
                </span>
              </div>

              {monthlyIncome > 0 && (
                <>
                  <div className="mt-4 p-3 rounded-lg bg-white/50 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-800 mb-2 uppercase tracking-wide">
                      Basado en tu nomina configurada
                    </p>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Tu nomina</span>
                      <span className="font-medium">{monthlyIncome.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Gastos fijos</span>
                      <span className="font-medium">-{fixedMonthly.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-blue-200 my-2" />
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-blue-800">Neto estimado</span>
                      <span className="text-blue-800">{(monthlyIncome - fixedMonthly).toFixed(2)} €</span>
                    </div>
                  </div>

                  <div className="border-t border-blue-100 pt-3 mt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      Recomendacion por prioridad
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs text-muted-foreground flex-1">Gastos esenciales (ALTA)</span>
                        <span className="text-xs font-medium text-red-600">Cubiertos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-xs text-muted-foreground flex-1">Gastos importantes (MEDIA)</span>
                        <span className="text-xs font-medium text-yellow-600">Revisar</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs text-muted-foreground flex-1">Ahorro sugerido (20%)</span>
                        <span className="text-xs font-medium text-savings">+{savingsPlanData.suggestedSavings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sugerencia: 20% ahorro</span>
                <span className="font-medium text-savings">+{savingsPlanData.suggestedSavings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Para gastos variables</span>
                <span className="font-medium">{savingsPlanData.discretionaryBudget.toFixed(2)}</span>
              </div>
              {savingsPlanData.netForMonth < 0 && (
                <div className="rounded-lg bg-red-100 p-3 text-xs text-red-800">
                  Cuidado: tus gastos fijos superan tus ingresos. Revisa tu presupuesto.
                </div>
              )}
              {monthlyIncome === 0 && (
                <a
                  href="/more/salary"
                  className="block mt-2 text-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Configurar nomina para ver plan personalizado →
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isVisible("detail") && recentTransactions.length > 0 && (
        <Card className="overflow-hidden animate-fade-in" style={{ animationDelay: "350ms" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Últimos movimientos</h2>
              <a href="/transactions" className="text-xs text-primary hover:underline">
                Ver todos →
              </a>
            </div>
            <div className="space-y-2">
              {recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        "rounded-lg p-2",
                        t.tipo === "Ingreso"
                          ? "bg-income/10"
                          : t.tipo === "Gasto"
                            ? "bg-expense/10"
                            : "bg-savings/10",
                      )}
                    >
                      {t.tipo === "Ingreso" ? (
                        <ArrowDownLeft className="h-4 w-4 text-income" />
                      ) : t.tipo === "Gasto" ? (
                        <ArrowUpRight className="h-4 w-4 text-expense" />
                      ) : (
                        <PiggyBank className="h-4 w-4 text-savings" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.concepto}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.categoria} · {t.fecha}
                      </p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      t.tipo === "Ingreso"
                        ? "text-income"
                        : t.tipo === "Gasto"
                          ? "text-expense"
                          : "text-savings",
                    )}
                  >
                    {t.tipo === "Ingreso" ? "+" : "-"}
                    {t.importe.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="fixed bottom-24 right-4 z-40">
        <div className="relative">
          {showAddMenu && (
            <div className="absolute bottom-16 right-0 space-y-2 animate-fade-in">
              <Button
                size="sm"
                variant="income"
                className="gap-2 shadow-lg"
                onClick={() => handleAddType(TransactionType.INGRESO)}
              >
                <ArrowDownLeft className="h-4 w-4" />
                Ingreso
              </Button>
              <Button
                size="sm"
                variant="expense"
                className="gap-2 shadow-lg"
                onClick={() => handleAddType(TransactionType.GASTO)}
              >
                <ArrowUpRight className="h-4 w-4" />
                Gasto
              </Button>
              <Button
                size="sm"
                className="gap-2 shadow-lg bg-savings hover:bg-savings/90"
                onClick={() => handleAddType(TransactionType.AHORRO)}
              >
                <PiggyBank className="h-4 w-4" />
                Ahorro
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 shadow-lg"
                onClick={() => handleAddType(TransactionType.TRANSFERENCIA_INTERNA)}
              >
                <Calendar className="h-4 w-4" />
                Transferencia
              </Button>
            </div>
          )}
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90"
            onClick={() => setShowAddMenu(!showAddMenu)}
          >
            {showAddMenu ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedType === TransactionType.INGRESO
                ? "Nuevo ingreso"
                : selectedType === TransactionType.GASTO
                  ? "Nuevo gasto"
                  : selectedType === TransactionType.AHORRO
                    ? "Nuevo ahorro"
                    : "Nueva transferencia"}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            sheetId={sheetId}
            categories={categories ?? []}
            accounts={accounts ?? []}
            defaultType={selectedType ?? undefined}
            onSuccess={() => {
              setShowTransactionForm(false);
              setSelectedType(null);
              refetchTransactions();
            }}
            onCancel={() => {
              setShowTransactionForm(false);
              setSelectedType(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <DashboardCustomizer open={showCustomizer} onOpenChange={setShowCustomizer} />
    </div>
  );
}