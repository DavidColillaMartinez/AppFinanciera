"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  Columns2,
  LayoutGrid,
  GripVertical,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { DashboardCustomizer } from "@/components/dashboard/dashboard-customizer";
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
import type { ChartDataSource } from "@/stores/app-store";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useFixedExpenses } from "@/features/fixed-expenses/hooks/use-fixed-expenses";
import { useFuturePayments } from "@/features/future-payments/hooks/use-future-payments";
import { useReserves } from "@/features/reserves/hooks/use-reserves";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useDeferredPayments } from "@/features/deferred-payments/hooks/use-deferred-payments";
import { getChartData } from "@/lib/finance/chart-data";
import { generateMonthKey } from "@/lib/sheets/adapters";
import { hasToken } from "@/lib/sheets/client";
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

function AnimatedNumber({ value, prefix = "", suffix = "", duration = 600 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (prefersReduced.current) { setDisplay(value); return; }
    const start = performance.now();
    const from = 0;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(from + (value - from) * progress);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  return <>{prefix}{display.toFixed(2)}{suffix}</>;
}

function SortableWidgetWrapper({ id, children, reorderMode }: { id: string; children: React.ReactNode; reorderMode: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !reorderMode });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(reorderMode ? listeners : {})}>
      {children}
    </div>
  );
}

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
  const { sheetId, dashboardConfig, addSalaryMonth, setLayoutMode, reorderWidgets } = useAppStore();
  const dataReady = !!sheetId && hasToken();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);
  const [salaryAutoAdded, setSalaryAutoAdded] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: reorderMode ? 0 : 100 } })
  );
  const [showDisponibleModal, setShowDisponibleModal] = useState(false);
  const [showGeneralSavingsModal, setShowGeneralSavingsModal] = useState(false);
  const [showMonthlySavingsModal, setShowMonthlySavingsModal] = useState(false);

  const widgets = dashboardConfig.widgets;
  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.enabled ?? true;
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);
  const layoutMode = dashboardConfig.layoutMode;

  const { summary, isLoading, isError } = useFinanceSummary({ monthKey: selectedMonth });
  const {
    data: transactions,
    refetch: refetchTransactions,
  } = useTransactions(dataReady ? sheetId : null, selectedMonth);
  const { data: categories } = useCategories(dataReady ? sheetId : null);
  const { data: accounts } = useAccounts(dataReady ? sheetId : null);
  const { data: fixedExpenses } = useFixedExpenses(dataReady ? sheetId : null);
  const { data: futurePayments } = useFuturePayments(dataReady ? sheetId : null);
  const { data: deferredPayments } = useDeferredPayments(dataReady ? sheetId : null);
  const { data: reserves } = useReserves(dataReady ? sheetId : null);
  const { data: goals } = useGoals(dataReady ? sheetId : null);
  const { data: salaryConfig } = useSalaryConfig(dataReady ? sheetId : null);
  const ensureSalary = useEnsureSalaryForMonth(dataReady ? sheetId : null);

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthName = MONTH_NAMES[(month ?? 1) - 1] ?? "";
  const currentMonth = useMemo(() => generateMonthKey(new Date().toISOString()), []);
  const isCurrentMonth = selectedMonth === currentMonth;
  const isSalaryConfigured = Boolean(
    salaryConfig && salaryConfig.enabled && salaryConfig.fixedAmount > 0,
  );
  const isVariableSalaryConfigured = Boolean(
    salaryConfig && salaryConfig.enabled && salaryConfig.type === "variable",
  );
  const salaryEnabled = salaryConfig?.enabled ?? false;
  const salaryMovementIdStr = useMemo(
    () => buildSalaryMovementId(selectedMonth),
    [selectedMonth],
  );
  const salaryMovement = useMemo(
    () => (transactions ?? []).find((t) => t.id === salaryMovementIdStr && !t.deletedAt),
    [transactions, salaryMovementIdStr],
  );
  const salaryMovementExists = !!salaryMovement;
  const salaryIncome = summary.available.salaryIncome;
  const salaryAccountName = useMemo(() => {
    const targetId = salaryMovement?.cuentaDestino || salaryConfig?.destinationAccount;
    if (!targetId) return null;
    return accounts?.find((a) => a.cuentaId === targetId)?.nombre ?? targetId;
  }, [salaryMovement, salaryConfig, accounts]);

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

  const capacidadAhorro = useMemo(() => {
    return Math.max(0, available.income - totalObligations);
  }, [available.income, totalObligations]);


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
    return (transactions ?? [])
      .slice()
      .sort((a, b) => {
        const dateCmp = b.fecha.localeCompare(a.fecha);
        if (dateCmp !== 0) return dateCmp;
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      })
      .slice(0, 5);
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
    if (type === TransactionType.AHORRO) {
      setShowAddMenu(false);
      router.push("/savings");
      return;
    }
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

  if (!hasToken()) {
    return (
      <div className="px-4 py-6 space-y-4">
        <EmptyState
          title="Sesion de Google caducada"
          description="Tu sesion ha expirado. Necesitas volver a iniciar sesion."
          type="empty"
          action={{
            label: "Reconectar Google",
            onClick: () => router.push("/onboarding?error=auth_failed&step=google"),
          }}
          secondaryAction={
            sheetId
              ? {
                  label: "Desconectar hoja",
                  onClick: () => {
                    useAppStore.getState().disconnect();
                    router.push("/onboarding");
                  },
                }
              : undefined
          }
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

  return (
    <div className="px-4 py-6 space-y-6 pb-32">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {year}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {monthName}
            </h1>
            <p className="text-sm text-muted-foreground">Vista del mes</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-9 w-9"
              aria-label={layoutMode === "single" ? "Una columna" : "Dos columnas"}
              onClick={() => setLayoutMode(layoutMode === "single" ? "two-column" : "single")}
            >
              {layoutMode === "single" ? <LayoutGrid className="h-4 w-4" /> : <Columns2 className="h-4 w-4" />}
            </Button>
            <Button
              variant={reorderMode ? "default" : "ghost"}
              size="icon"
              className="rounded-xl h-9 w-9"
              aria-label={reorderMode ? "Salir de ordenar" : "Ordenar widgets"}
              onClick={() => setReorderMode(!reorderMode)}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              aria-label="Personalizar dashboard"
              onClick={() => setShowCustomizer(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              aria-label="Selector de mes"
            />
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (!over || active.id === over.id) return;
          const oldIndex = sortedWidgets.findIndex((w) => w.id === active.id);
          const newIndex = sortedWidgets.findIndex((w) => w.id === over.id);
          if (oldIndex !== -1 && newIndex !== -1) reorderWidgets(oldIndex, newIndex);
        }}
      >
      <SortableContext items={sortedWidgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
      <div className={cn(layoutMode === "two-column" ? "grid grid-cols-2 gap-3" : "space-y-3")}>
        {sortedWidgets.map((w, idx) => {
          if (!w.enabled) return null;
          const isFullWidth = w.kind === "chart" || w.id === "detail" || w.id === "obligations" || w.id === "savingsPlan";
          const wrapperClass = layoutMode === "two-column" && isFullWidth ? "col-span-2" : "";

          if (w.id === "balance") return (
            <SortableWidgetWrapper key={w.id} id={w.id} reorderMode={reorderMode}>
            <div className={wrapperClass}>
              {reorderMode && <div className="text-xs text-primary text-center py-1 font-medium">Arrastrar para reordenar</div>}
              <MetricCard
                title="Disponible"
                value={`${available.available >= 0 ? "+" : ""}${available.available.toFixed(2)}`}
                icon={Wallet}
                colorClass={available.available >= 0 ? "text-income" : "text-expense"}
                bgClass={available.available >= 0 ? "card-income" : "card-expense"}
                delay={0}
                onClick={reorderMode ? undefined : handleDisponibleClick}
                subtitle="Toca para ver el detalle"
              />
            </div>
            </SortableWidgetWrapper>
          );

          if (w.id === "income") return (
            <SortableWidgetWrapper key={w.id} id={w.id} reorderMode={reorderMode}>
            <div className={wrapperClass}>
              {reorderMode && <div className="text-xs text-primary text-center py-1 font-medium">Arrastrar para reordenar</div>}
              <MetricCard
                title="Ingresos"
                value={`+${available.income.toFixed(2)}`}
                icon={TrendingUp}
                colorClass="text-income"
                bgClass="card-income"
                delay={100}
                onClick={reorderMode ? undefined : handleIncomeClick}
                subtitle={available.salaryIncome > 0 && available.extraIncome > 0 ? "Nomina + extras" : available.salaryIncome > 0 ? "Nomina" : "Extras"}
              />
            </div>
            </SortableWidgetWrapper>
          );

          if (w.id === "expenses") return (
            <SortableWidgetWrapper key={w.id} id={w.id} reorderMode={reorderMode}>
            <div className={wrapperClass}>
              {reorderMode && <div className="text-xs text-primary text-center py-1 font-medium">Arrastrar para reordenar</div>}
              <MetricCard
                title="Gastos variables"
                value={`-${variableExpenses.toFixed(2)}`}
                icon={TrendingDown}
                colorClass="text-expense"
                bgClass="card-expense"
                delay={150}
                onClick={reorderMode ? undefined : handleExpensesClick}
                subtitle="Ver movimientos del mes"
              />
            </div>
            </SortableWidgetWrapper>
          );

          if (w.id === "savings") return (
            <SortableWidgetWrapper key={w.id} id={w.id} reorderMode={reorderMode}>
            <div className={wrapperClass}>
              {reorderMode && <div className="text-xs text-primary text-center py-1 font-medium">Arrastrar para reordenar</div>}
              <MetricCard
                title="Ahorro general"
                value={`+${savingsSummary.totalSaved.toFixed(2)}`}
                icon={PiggyBank}
                colorClass="text-savings"
                bgClass="card-savings"
                delay={200}
                onClick={reorderMode ? undefined : handleGeneralSavingsClick}
                subtitle={savingsSummary.totalTarget > 0 ? `${savingsSummary.overallProgress.toFixed(0)}% del objetivo` : "Toca para ver detalle"}
                disabled={!savingsBreakdownHasAny}
              />
            </div>
            </SortableWidgetWrapper>
          );

          if (w.id === "monthlySavings") return (
            <SortableWidgetWrapper key={w.id} id={w.id} reorderMode={reorderMode}>
            <div className={wrapperClass}>
              {reorderMode && <div className="text-xs text-primary text-center py-1 font-medium">Arrastrar para reordenar</div>}
              <MetricCard
                title="Ahorro del mes"
                value={`+${monthlySavings.totalForMonth.toFixed(2)}`}
                icon={CalendarCheck}
                colorClass="text-savings"
                bgClass="card-savings"
                delay={220}
                onClick={reorderMode ? undefined : handleMonthlySavingsClick}
                subtitle={monthlySavings.planned > 0 ? `Plan: ${monthlySavings.planned.toFixed(2)}` : "Confirmar ahorro del mes"}
              />
            </div>
            </SortableWidgetWrapper>
          );

          if (w.id === "obligations") return (
            <SortableWidgetWrapper key={w.id} id={w.id} reorderMode={reorderMode}>
            <div className={wrapperClass}>
              {reorderMode && <div className="text-xs text-primary text-center py-1 font-medium">Arrastrar para reordenar</div>}
              <MetricCard
                title="Gastos total"
                value={`-${totalObligations.toFixed(2)}`}
                icon={ListChecks}
                colorClass="text-warning"
                bgClass="bg-warning/10 border-warning/20"
                delay={250}
                subtitle="Variables + fijos + aplazados + provisiones"
              />
            </div>
            </SortableWidgetWrapper>
          );

          if (w.id === "income") return (
            <div key={w.id} className={wrapperClass}>
              <MetricCard
                title="Ingresos"
                value={`+${available.income.toFixed(2)}`}
                icon={TrendingUp}
                colorClass="text-income"
                bgClass="card-income"
                delay={100}
                onClick={handleIncomeClick}
                subtitle={available.salaryIncome > 0 && available.extraIncome > 0 ? "Nomina + extras" : available.salaryIncome > 0 ? "Nomina" : "Extras"}
              />
            </div>
          );

          if (w.id === "expenses") return (
            <div key={w.id} className={wrapperClass}>
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
          );

          if (w.id === "savings") return (
            <div key={w.id} className={wrapperClass}>
              <MetricCard
                title="Ahorro general"
                value={`+${savingsSummary.totalSaved.toFixed(2)}`}
                icon={PiggyBank}
                colorClass="text-savings"
                bgClass="card-savings"
                delay={200}
                onClick={handleGeneralSavingsClick}
                subtitle={savingsSummary.totalTarget > 0 ? `${savingsSummary.overallProgress.toFixed(0)}% del objetivo` : "Toca para ver detalle"}
                disabled={!savingsBreakdownHasAny}
              />
            </div>
          );

          if (w.id === "monthlySavings") return (
            <div key={w.id} className={wrapperClass}>
              <MetricCard
                title="Ahorro del mes"
                value={`+${monthlySavings.totalForMonth.toFixed(2)}`}
                icon={CalendarCheck}
                colorClass="text-savings"
                bgClass="card-savings"
                delay={220}
                onClick={handleMonthlySavingsClick}
                subtitle={monthlySavings.planned > 0 ? `Plan: ${monthlySavings.planned.toFixed(2)}` : "Confirmar ahorro del mes"}
              />
            </div>
          );

          if (w.id === "obligations") return (
            <div key={w.id} className={wrapperClass}>
              <MetricCard
                title="Gastos total"
                value={`-${totalObligations.toFixed(2)}`}
                icon={ListChecks}
                colorClass="text-warning"
                bgClass="bg-warning/10 border-warning/20"
                delay={250}
                subtitle="Variables + fijos + aplazados + provisiones"
              />
            </div>
          );

          if (w.id === "savingsPlan") return (
            <SortableWidgetWrapper key={w.id} id={w.id} reorderMode={reorderMode}>
            <div className={wrapperClass}>
              {reorderMode && <div className="text-xs text-primary text-center py-1 font-medium">Arrastrar para reordenar</div>}
              <PayrollStatusCard
                monthName={monthName}
                salaryEnabled={salaryEnabled}
                salaryType={salaryConfig?.type ?? "fixed"}
                salaryFixedAmount={salaryConfig?.fixedAmount ?? 0}
                salaryMovementExists={salaryMovementExists}
                salaryIncome={salaryIncome}
                salaryAccountName={salaryAccountName}
                salaryDay={salaryConfig?.day ?? 1}
                hasConfig={!!salaryConfig?.updatedAt}
              />
            </div>
            </SortableWidgetWrapper>
          );

          if (w.id === "detail") return (
            <SortableWidgetWrapper key={w.id} id={w.id} reorderMode={reorderMode}>
            <div className={wrapperClass}>
              {reorderMode && <div className="text-xs text-primary text-center py-1 font-medium">Arrastrar para reordenar</div>}
              {recentTransactions.length > 0 && (
                <Card className="overflow-hidden animate-fade-in" style={{ animationDelay: "350ms" }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold">Ultimos movimientos</h2>
                      <a href="/transactions" className="text-xs text-primary hover:underline">Ver todos →</a>
                    </div>
                    <div className="space-y-2">
                      {recentTransactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={cn("rounded-lg p-2", t.tipo === "Ingreso" ? "bg-income/10" : t.tipo === "Gasto" ? "bg-expense/10" : t.tipo === "Ahorro" ? "bg-savings/10" : "bg-muted")}>
                              {t.tipo === "Ingreso" ? <ArrowDownLeft className="h-4 w-4 text-income" /> : t.tipo === "Gasto" ? <ArrowUpRight className="h-4 w-4 text-expense" /> : <PiggyBank className="h-4 w-4 text-savings" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{t.concepto || (t.tipo === "Ingreso" ? "Ingreso" : t.tipo === "Gasto" ? "Gasto" : t.tipo === "Transferencia interna" ? "Transferencia interna" : t.tipo)}</p>
                              <p className="text-xs text-muted-foreground">{t.categoria} · {t.fecha}</p>
                            </div>
                          </div>
                          <p className={cn("text-sm font-semibold", t.tipo === "Ingreso" ? "text-income" : t.tipo === "Gasto" ? "text-expense" : "text-savings")}>
                            {t.tipo === "Ingreso" ? "+" : "-"}{t.importe.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            </SortableWidgetWrapper>
          );

          if (w.kind === "chart" && w.chartId) {
            const chart = dashboardConfig.charts.find((c) => c.id === w.chartId);
            if (!chart) return null;
            const sources: ChartDataSource[] = (chart as any).dataSources ?? [chart.dataSource];
            const cData = getChartData(sources, {
              transactions: transactions ?? [],
              categories: categories ?? [],
              fixedExpenses: fixedExpenses ?? [],
              futurePayments: futurePayments ?? [],
              deferredPayments: deferredPayments ?? [],
            });
            return (
              <SortableWidgetWrapper key={w.id} id={w.id} reorderMode={reorderMode}>
              <div className={wrapperClass}>
                {reorderMode && <div className="text-xs text-primary text-center py-1 font-medium">Arrastrar para reordenar</div>}
                <Card className="overflow-hidden animate-fade-in" style={{ borderColor: chart.accentColor + "30" }}>
                  <CardContent className="p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        {chart.name}
                      </h2>
                      <span className="text-xs text-muted-foreground capitalize">{chart.dataSource}</span>
                    </div>
                    <div className="h-64">
                      <ChartRenderer chart={chart} data={cData} />
                    </div>
                  </CardContent>
                </Card>
              </div>
              </SortableWidgetWrapper>
            );
          }

          return null;
        })}
      </div>
      </SortableContext>
      </DndContext>

      {dashboardConfig.charts.length === 0 && (
        <Card className="overflow-hidden animate-fade-in">
          <CardContent className="p-4 text-center py-8">
            <p className="text-sm text-muted-foreground">No hay graficos creados.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Usa el boton de personalizar para crear uno.
            </p>
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
        salaryConfigured={isSalaryConfigured || isVariableSalaryConfigured}
        salaryType={salaryConfig?.type}
        variableSalarySaved={isVariableSalaryConfigured}
        accounts={accounts ?? []}
        accountBalances={summary.accountBalances}
        accountTotalMoney={summary.accountTotalMoney}
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
        availableCapacity={capacidadAhorro}
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

interface PayrollStatusCardProps {
  monthName: string;
  salaryEnabled: boolean;
  salaryType: "fixed" | "variable";
  salaryFixedAmount: number;
  salaryMovementExists: boolean;
  salaryIncome: number;
  salaryAccountName: string | null;
  salaryDay: number;
  hasConfig: boolean;
}

function PayrollStatusCard({
  monthName,
  salaryEnabled,
  salaryType,
  salaryFixedAmount,
  salaryMovementExists,
  salaryIncome,
  salaryAccountName,
  salaryDay,
  hasConfig,
}: PayrollStatusCardProps) {
  if (!hasConfig) {
    return (
      <Card
        className="overflow-hidden animate-fade-in border-amber-200 bg-amber-50/50"
        style={{ animationDelay: "320ms" }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Tu nomina</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Configura tu nomina para ver el estado de tus ingresos mensuales.
          </p>
          <Button asChild size="sm" variant="outline" className="w-full">
            <a href="/more/salary">Configurar nomina</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!salaryEnabled) {
    return (
      <Card
        className="overflow-hidden animate-fade-in border-amber-200 bg-amber-50/50"
        style={{ animationDelay: "320ms" }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Tu nomina</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Tu nomina esta desactivada. Activala desde Ajustes &gt; Nomina.
          </p>
          <Button asChild size="sm" variant="outline" className="w-full">
            <a href="/more/salary">Activar nomina</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (salaryType === "variable" && !salaryMovementExists) {
    return (
      <Card
        className="overflow-hidden animate-fade-in border-amber-200 bg-amber-50/50"
        style={{ animationDelay: "320ms" }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Tu nomina</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Tu nomina variable esta configurada, pero falta introducir el
            importe de {monthName}.
          </p>
          <Button asChild size="sm" variant="outline" className="w-full">
            <a href="/more/salary">Introducir importe del mes</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!salaryMovementExists) {
    const displayAmount = salaryFixedAmount;
    return (
      <Card
        className="overflow-hidden animate-fade-in border-blue-200 bg-blue-50/50"
        style={{ animationDelay: "320ms" }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Tu nomina
            </h2>
            <span className="text-xs px-2 py-1 rounded-full bg-income/20 text-income font-medium">
              {salaryType === "fixed" ? "Fija" : "Variable"}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nomina mensual</span>
              <span className="font-medium">{displayAmount.toFixed(2)} €</span>
            </div>
            <div className="rounded-lg bg-amber-100/70 p-2 text-xs text-amber-900 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                La nomina de {monthName} aun no se ha ingresado
                {salaryType === "fixed"
                  ? `. Se ingresara automaticamente el dia ${salaryDay}.`
                  : "."}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayAmount = salaryIncome > 0 ? salaryIncome : salaryFixedAmount;
  return (
    <Card
      className="overflow-hidden animate-fade-in border-blue-200 bg-blue-50/50"
      style={{ animationDelay: "320ms" }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Tu nomina
          </h2>
          <span className="text-xs px-2 py-1 rounded-full bg-income/20 text-income font-medium">
            {salaryType === "fixed" ? "Fija" : "Variable"}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nomina mensual</span>
            <span className="font-medium">{displayAmount.toFixed(2)} €</span>
          </div>
          {salaryAccountName && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Cuenta de destino</span>
              <span className="font-medium">{salaryAccountName}</span>
            </div>
          )}
          <div className="rounded-lg bg-green-100/70 p-2 text-xs text-green-900 flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Nomina de {monthName} ya ingresada
              {salaryIncome > 0 ? ` (${salaryIncome.toFixed(2)} €)` : ""}.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
