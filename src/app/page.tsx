"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ListChecks,
  Target,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { DashboardCustomizer } from "@/components/dashboard/dashboard-customizer";
import {
  useWidgetReorder,
  ReorderOverlay,
} from "@/components/dashboard/widget-reorder";
import { ChartRenderer } from "@/components/dashboard/chart-renderer";
import { DisponibleExplanationModal } from "@/components/dashboard/disponible-explanation-modal";
import { GeneralSavingsBreakdownModal } from "@/components/dashboard/general-savings-breakdown-modal";
import { MonthlySavingsBreakdownModal } from "@/components/dashboard/monthly-savings-breakdown-modal";
import { TransactionType } from "@/constants/enums";
import { cn } from "@/lib/utils";
import { buildSalaryMovementId } from "@/lib/finance/salary";
import { useSalaryConfig, useEnsureSalaryForMonth } from "@/features/salary/hooks/use-salary";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { useAppStore } from "@/stores/app-store";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useFixedExpenses } from "@/features/fixed-expenses/hooks/use-fixed-expenses";
import { useFuturePayments } from "@/features/future-payments/hooks/use-future-payments";
import { useReserves } from "@/features/reserves/hooks/use-reserves";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { calculateExpensesByCategory } from "@/lib/finance/calculations";
import { generateMonthKey } from "@/lib/sheets/adapters";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { EmptyState } from "@/components/states/empty-state";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const CHART_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

interface MetricCardProps {
  title: string;
  value: string;
  icon: typeof Wallet;
  colorClass: string;
  bgClass: string;
  delay: number;
  onClick?: () => void;
  isActive?: boolean;
  subtitle?: string;
  disabled?: boolean;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  delay,
  onClick,
  isActive,
  subtitle,
  disabled,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden animate-fade-in transition-all",
        bgClass,
        onClick && !disabled && "cursor-pointer hover:shadow-md active:scale-[0.98]",
        disabled && "opacity-60 cursor-not-allowed",
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={disabled ? undefined : onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (disabled || !onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
              {isActive !== undefined && (
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isActive ? "bg-green-500" : "bg-muted-foreground/30",
                  )}
                />
              )}
            </div>
            <p className={cn("text-2xl font-bold tracking-tight", colorClass)}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
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
  const { sheetId, dashboardConfig, addSalaryMonth } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);
  const [salaryAutoAdded, setSalaryAutoAdded] = useState(false);
  const [showDisponibleModal, setShowDisponibleModal] = useState(false);
  const [showGeneralSavingsModal, setShowGeneralSavingsModal] = useState(false);
  const [showMonthlySavingsModal, setShowMonthlySavingsModal] = useState(false);

  const widgets = dashboardConfig.widgets;
  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.visible ?? true;

  const { reorderWidgets } = useAppStore();
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

  const { summary, isLoading, isError } = useFinanceSummary({ monthKey: selectedMonth });
  const {
    data: transactions,
    refetch: refetchTransactions,
  } = useTransactions(sheetId, selectedMonth);
  const { data: categories } = useCategories(sheetId);
  const { data: accounts } = useAccounts(sheetId);
  const { data: fixedExpenses } = useFixedExpenses(sheetId);
  const { data: futurePayments } = useFuturePayments(sheetId);
  const { data: reserves } = useReserves(sheetId);
  const { data: goals } = useGoals(sheetId);
  const { data: salaryConfig } = useSalaryConfig(sheetId);
  const ensureSalary = useEnsureSalaryForMonth(sheetId);

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthName = MONTH_NAMES[(month ?? 1) - 1] ?? "";
  const currentMonth = useMemo(() => generateMonthKey(new Date().toISOString()), []);
  const isCurrentMonth = selectedMonth === currentMonth;
  const isSalaryConfigured = Boolean(
    salaryConfig && salaryConfig.enabled && salaryConfig.fixedAmount > 0,
  );

  useEffect(() => {
    if (!sheetId || !salaryConfig) return;
    if (!salaryConfig.enabled) return;
    if (salaryConfig.type !== "fixed") return;
    if (!isCurrentMonth) return;
    const salaryMovementId = buildSalaryMovementId(selectedMonth);
    const alreadyPresent = (transactions ?? []).some(
      (t) => t.id === salaryMovementId,
    );
    if (alreadyPresent) return;
    let cancelled = false;
    async function addSalary() {
      if (cancelled || !sheetId || !salaryConfig) return;
      try {
        const result = await ensureSalary.mutateAsync({
          monthKey: selectedMonth,
          config: salaryConfig,
        });
        if (result.created) {
          setSalaryAutoAdded(true);
          addSalaryMonth(selectedMonth);
          await refetchTransactions();
        }
      } catch (e) {
        console.error("Error adding salary:", e);
      }
    }
    addSalary();
    return () => {
      cancelled = true;
    };
  }, [
    sheetId,
    salaryConfig,
    isCurrentMonth,
    selectedMonth,
    transactions,
    ensureSalary,
    addSalaryMonth,
    refetchTransactions,
  ]);

  const available = summary.available;
  const savingsSummary = summary.savings;
  const monthlySavings = summary.monthlySavings;

  const variableExpenses = summary.variableExpenses;
  const fixedExpensesTotal = summary.fixedExpensesTotal;
  const deferredPaymentsTotal = available.deferredPayments;
  const futureProvisions = summary.futurePaymentProvisions;
  const totalObligations = useMemo(
    () =>
      variableExpenses +
      fixedExpensesTotal +
      deferredPaymentsTotal +
      futureProvisions,
    [variableExpenses, fixedExpensesTotal, deferredPaymentsTotal, futureProvisions],
  );

  const expensesByCategory = useMemo(() => {
    const filtered = (transactions ?? []).filter((t) => t.tipo === "Gasto");
    const byCategory = calculateExpensesByCategory(filtered, categories ?? []);
    return byCategory.map((item, i) => ({
      name: item.categoryName || item.category,
      value: item.total,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [transactions, categories]);

  const breakdown = summary?.savingsBreakdown ?? { reserves: [], goals: [], futurePayments: [] };

  const targetNameById = useCallback(
    (tipoDestino: string, destinoId: string): string | null => {
      if (tipoDestino === "reserva") {
        return reserves?.find((r) => r.reservaId === destinoId)?.nombre ?? null;
      }
      if (tipoDestino === "objetivo") {
        return goals?.find((g) => g.objetivoId === destinoId)?.nombre ?? null;
      }
      if (tipoDestino === "pago_futuro") {
        return futurePayments?.find((f) => f.pagoId === destinoId)?.concepto ?? null;
      }
      return null;
    },
    [reserves, goals, futurePayments],
  );

  const recentTransactions = useMemo(() => {
    return (transactions ?? []).slice(0, 5);
  }, [transactions]);

  const savingsBreakdownHasAny = useMemo(
    () =>
      (breakdown.reserves.length ?? 0) +
        (breakdown.goals.length ?? 0) +
        (breakdown.futurePayments.length ?? 0) >
      0,
    [breakdown],
  );

  const pendingFixedCount = useMemo(
    () =>
      (fixedExpenses ?? []).filter(
        (f) =>
          f.activo === "S" &&
          (f.frecuencia === "Mensual" ||
            f.frecuencia === "Trimestral" ||
            f.frecuencia === "Anual" ||
            f.frecuencia === "Unico"),
      ).length - available.fixedExpensesConfirmed,
    [fixedExpenses, available.fixedExpensesConfirmed],
  );

  const monthlySavingsHasAny = monthlySavings.totalForMonth > 0 || monthlySavings.planned > 0;

  function handleAddType(type: TransactionType) {
    setSelectedType(type);
    setShowAddMenu(false);
    setShowTransactionForm(true);
  }

  function handleIncomeClick() {
    router.push(`/transactions?filterType=${TransactionType.INGRESO}&month=${selectedMonth}`);
  }

  function handleExpensesClick() {
    router.push(`/transactions?filterType=${TransactionType.GASTO}&month=${selectedMonth}`);
  }

  function handleDisponibleClick() {
    setShowDisponibleModal(true);
  }

  function handleGeneralSavingsClick() {
    setShowGeneralSavingsModal(true);
  }

  function handleMonthlySavingsClick() {
    setShowMonthlySavingsModal(true);
  }

  if (!sheetId) {
    return (
      <div className="px-4 py-6 space-y-4">
        <EmptyState
          title="Sin hoja conectada"
          description="Conecta una Google Sheet para ver tu vista del mes."
          type="empty"
          action={{
            label: "Conectar hoja",
            onClick: () => router.push("/onboarding"),
          }}
        />
      </div>
    );
  }

  if (isLoading && transactions === undefined) {
    return <LoadingState message="Cargando vista del mes..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message="No se pudo cargar la información del mes. Revisa tu conexión a Google."
      />
    );
  }

  const chart = dashboardConfig.charts?.[0];
  const hasChart = isVisible("chart") && chart;

  return (
    <div className="px-4 py-6 space-y-6 pb-32">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{year}</p>
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
          value={`${available.available >= 0 ? "+" : ""}${available.available.toFixed(2)}`}
          icon={Wallet}
          colorClass={available.available >= 0 ? "text-income" : "text-expense"}
          bgClass={available.available >= 0 ? "card-income" : "card-expense"}
          delay={0}
          onClick={handleDisponibleClick}
          subtitle="Toca para ver el detalle"
        />
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Ingresos"
            value={`+${available.income.toFixed(2)}`}
            icon={TrendingUp}
            colorClass="text-income"
            bgClass="card-income"
            delay={100}
            onClick={handleIncomeClick}
            subtitle={
              available.salaryIncome > 0 && available.extraIncome > 0
                ? `Nomina + extras`
                : available.salaryIncome > 0
                  ? "Nomina"
                  : "Extras"
            }
          />
          <MetricCard
            title="Gastos variables"
            value={`-${variableExpenses.toFixed(2)}`}
            icon={TrendingDown}
            colorClass="text-expense"
            bgClass="card-expense"
            delay={150}
            onClick={handleExpensesClick}
            subtitle="Ver movimientos del mes"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Ahorro general"
            value={`+${savingsSummary.totalSaved.toFixed(2)}`}
            icon={PiggyBank}
            colorClass="text-savings"
            bgClass="card-savings"
            delay={200}
            onClick={handleGeneralSavingsClick}
            subtitle={
              savingsSummary.totalTarget > 0
                ? `${savingsSummary.overallProgress.toFixed(0)}% del objetivo`
                : "Toca para ver detalle"
            }
            disabled={!savingsBreakdownHasAny}
          />
          <MetricCard
            title="Ahorro del mes"
            value={`+${monthlySavings.totalForMonth.toFixed(2)}`}
            icon={CalendarCheck}
            colorClass="text-savings"
            bgClass="card-savings"
            delay={220}
            onClick={handleMonthlySavingsClick}
            subtitle={
              monthlySavings.planned > 0
                ? `Plan: ${monthlySavings.planned.toFixed(2)}`
                : "Confirmar ahorro del mes"
            }
          />
        </div>
        <MetricCard
          title="Total obligaciones"
          value={`-${totalObligations.toFixed(2)}`}
          icon={ListChecks}
          colorClass="text-warning"
          bgClass="bg-warning/10 border-warning/20"
          delay={250}
          subtitle={`Variables + fijos + aplazados + provisiones`}
        />
      </div>

      {hasChart && (
        <Card
          className="overflow-hidden animate-fade-in"
          style={{ animationDelay: "300ms", borderColor: chart.accentColor + "30" }}
        >
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              {chart.name}
            </h2>
            <div className="h-64">
              <ChartRenderer chart={chart} data={expensesByCategory} />
            </div>
          </CardContent>
        </Card>
      )}

      {isVisible("chart") && !hasChart && (
        <Card className="overflow-hidden animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardContent className="p-4 text-center py-8">
            <p className="text-sm text-muted-foreground">No hay graficos creados.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Usa el boton de personalizar para crear uno.
            </p>
          </CardContent>
        </Card>
      )}

      {isVisible("savingsPlan") && (
        <SavingsPlanWidget
          monthName={monthName}
          monthlyIncome={salaryConfig?.fixedAmount ?? 0}
          incomeType={salaryConfig?.type ?? "fixed"}
          salaryConfigured={isSalaryConfigured}
        />
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
                            : t.tipo === "Ahorro"
                              ? "bg-savings/10"
                              : "bg-muted",
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

      {isReorderMode && (
        <ReorderOverlay
          isActive={isReorderMode}
          onConfirm={confirmReorder}
          onCancel={exitReorderMode}
        />
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
            {showAddMenu ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
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

      <DisponibleExplanationModal
        open={showDisponibleModal}
        onOpenChange={setShowDisponibleModal}
        available={available}
        pendingFixedCount={Math.max(0, pendingFixedCount)}
        savingsEmpty={!monthlySavingsHasAny}
        salaryConfigured={isSalaryConfigured}
      />

      <GeneralSavingsBreakdownModal
        open={showGeneralSavingsModal}
        onOpenChange={setShowGeneralSavingsModal}
        totalSaved={savingsSummary.totalSaved}
        totalTarget={savingsSummary.totalTarget}
        overallProgress={savingsSummary.overallProgress}
        reserves={breakdown.reserves}
        goals={breakdown.goals}
        futurePayments={breakdown.futurePayments}
        hasAnyItems={savingsBreakdownHasAny}
      />

      <MonthlySavingsBreakdownModal
        open={showMonthlySavingsModal}
        onOpenChange={setShowMonthlySavingsModal}
        monthKey={selectedMonth}
        monthName={monthName}
        breakdown={monthlySavings}
        targetNameById={targetNameById}
      />
    </div>
  );
}

interface SavingsPlanWidgetProps {
  monthName: string;
  monthlyIncome: number;
  incomeType: "fixed" | "variable";
  salaryConfigured: boolean;
}

function SavingsPlanWidget({
  monthName,
  monthlyIncome,
  incomeType,
  salaryConfigured,
}: SavingsPlanWidgetProps) {
  if (!salaryConfigured) {
    return (
      <Card
        className="overflow-hidden animate-fade-in border-blue-200 bg-blue-50/50"
        style={{ animationDelay: "320ms" }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Plan personalizado</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Configura tu nomina para ver un plan de ahorro basado en tus ingresos.
          </p>
          <Button asChild size="sm" variant="outline" className="w-full">
            <a href="/more/salary">Configurar nomina</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="overflow-hidden animate-fade-in border-blue-200 bg-blue-50/50"
      style={{ animationDelay: "320ms" }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Plan de ahorro del mes
          </h2>
          <span className="text-xs px-2 py-1 rounded-full bg-income/20 text-income font-medium">
            {incomeType === "fixed" ? "Fija" : "Variable"}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tu nomina</span>
            <span className="font-medium">{monthlyIncome.toFixed(2)} €</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Toca el card &quot;Disponible&quot; arriba para ver el desglose completo
            de {monthName}.
          </p>
          {salaryConfigured && (
            <div className="rounded-lg bg-blue-100/70 p-2 text-xs text-blue-900 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                El Disponible ya descuenta los fijos confirmados/pendientes y
                las provisiones de pagos futuros.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
