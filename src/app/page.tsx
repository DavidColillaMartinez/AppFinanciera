"use client";

import { useState, useMemo } from "react";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useFixedExpenses } from "@/features/fixed-expenses/hooks/use-fixed-expenses";
import { useFuturePayments } from "@/features/future-payments/hooks/use-future-payments";
import { useDeferredPayments } from "@/features/deferred-payments/hooks/use-deferred-payments";
import { useAppStore } from "@/stores/app-store";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { TransactionType } from "@/constants/enums";
import { cn } from "@/lib/utils";
import {
  calculateExpensesByCategory,
} from "@/lib/finance/calculations";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

export default function VistaMesPage() {
  const { sheetId } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);

  const {
    data: transactions,
    isLoading,
    isError,
    error,
  } = useTransactions(sheetId, selectedMonth);
  const { data: categories } = useCategories(sheetId);
  const { data: fixedExpenses } = useFixedExpenses(sheetId);
  const { data: futurePayments } = useFuturePayments(sheetId);
  const { data: deferredPayments } = useDeferredPayments(sheetId);

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

  const savings = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.tipo === "Ahorro")
        .reduce((acc, t) => acc + t.importe, 0),
    [filteredTransactions],
  );

  const balance = income - expenses - savings;

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

  const pagosRestantes = fixedMonthly + deferredMonthly + futureMonthly;
  const disponible = balance - pagosRestantes;

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

  if (isLoading) return <LoadingState message="Cargando vista del mes..." />;
  if (isError)
    return (
      <ErrorState message={(error as Error)?.message ?? "Error al cargar"} />
    );

  return (
    <div className="px-4 py-6 space-y-5 pb-32">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">
            {monthName} {year}
          </h1>
          <p className="text-sm text-muted-foreground">Vista del mes</p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="space-y-3">
        <MetricCard
          title="Disponible"
          value={`${disponible >= 0 ? "+" : ""}${disponible.toFixed(2)}`}
          icon={Wallet}
          colorClass={disponible >= 0 ? "text-income" : "text-expense"}
          bgClass={disponible >= 0 ? "card-income" : "card-expense"}
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
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Ahorro"
            value={`+${savings.toFixed(2)}`}
            icon={PiggyBank}
            colorClass="text-savings"
            bgClass="card-savings"
            delay={200}
          />
          <MetricCard
            title="Pagos Restantes"
            value={`-${pagosRestantes.toFixed(2)}`}
            icon={Clock}
            colorClass="text-warning"
            bgClass="bg-warning/10 border-warning/20"
            delay={250}
          />
        </div>
      </div>

      {expensesByCategory.length > 0 && (
        <Card className="overflow-hidden animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-4">Gastos por categoría</h2>
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

      {recentTransactions.length > 0 && (
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
            accounts={[]}
            initialData={
              selectedType
                ? {
                    id: "",
                    fecha: new Date().toISOString().split("T")[0],
                    mesClave: selectedMonth,
                    concepto: "",
                    tipo: selectedType,
                    categoria: "",
                    importe: 0,
                    metodo: "",
                    cuentaOrigen: "",
                    cuentaDestino: "",
                    notas: "",
                    reservaId: "",
                    createdAt: "",
                    updatedAt: "",
                    deletedAt: "",
                  }
                : undefined
            }
            onSuccess={() => {
              setShowTransactionForm(false);
              setSelectedType(null);
            }}
            onCancel={() => {
              setShowTransactionForm(false);
              setSelectedType(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
