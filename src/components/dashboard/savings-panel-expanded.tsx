"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/stores/app-store";
import { useReserves } from "@/features/reserves/hooks/use-reserves";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { useFuturePayments } from "@/features/future-payments/hooks/use-future-payments";
import { useDeferredPayments } from "@/features/deferred-payments/hooks/use-deferred-payments";
import { useFixedExpenses } from "@/features/fixed-expenses/hooks/use-fixed-expenses";
import { useCreateTransaction } from "@/features/transactions/hooks/use-transactions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  PiggyBank,
  Target,
  Clock,
  CreditCard,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface SavingsItemProps {
  icon: typeof PiggyBank;
  name: string;
  subtitle: string;
  saved: number;
  target: number;
  monthlyNeeded: number;
  colorClass: string;
  accentClass: string;
}

function SavingsItem({
  icon: Icon,
  name,
  subtitle,
  saved,
  target,
  monthlyNeeded,
  colorClass,
  accentClass,
}: SavingsItemProps) {
  const progress = target > 0 ? (saved / target) * 100 : 0;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
      <div className={cn("rounded-lg p-2 shrink-0", accentClass)}>
        <Icon className={cn("h-4 w-4", colorClass)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium truncate">{name}</p>
          <span className="text-xs text-muted-foreground ml-2 shrink-0">
            {monthlyNeeded > 0 ? `${monthlyNeeded.toFixed(2)}/mes` : ""}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={cn("font-semibold", colorClass)}>
            {saved.toFixed(2)}
          </span>
          <span className="text-muted-foreground">
            / {target.toFixed(2)} €
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {progress.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

export function SavingsPanelExpanded() {
  const { sheetId, monthlySavingsAddedMonths, addMonthlySavingsMonth, monthlyIncome, incomeType } = useAppStore();
  const { data: reserves } = useReserves(sheetId);
  const { data: goals } = useGoals(sheetId);
  const { data: futures } = useFuturePayments(sheetId);
  const { data: deferred } = useDeferredPayments(sheetId);
  const { data: fixedExpenses } = useFixedExpenses(sheetId);
  const createTransaction = useCreateTransaction(sheetId);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const alreadyAdded = monthlySavingsAddedMonths.includes(currentMonth);

  const totalExpensesWithFixed = useMemo(() => {
    const fixedMonthly = (fixedExpenses ?? []).reduce((acc, exp) => {
      if (exp.frecuencia === "Mensual") return acc + exp.importe;
      if (exp.frecuencia === "Trimestral") return acc + exp.importe / 3;
      if (exp.frecuencia === "Anual") return acc + exp.importe / 12;
      return acc;
    }, 0);
    return fixedMonthly;
  }, [fixedExpenses]);

  const suggestedSavings = useMemo(() => {
    if (monthlyIncome === 0) return 0;
    const net = monthlyIncome - totalExpensesWithFixed;
    return Math.max(0, net * 0.2);
  }, [monthlyIncome, totalExpensesWithFixed]);

  async function handleAddMonthlySavings() {
    if (!sheetId || alreadyAdded || suggestedSavings <= 0) return;

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await createTransaction.mutateAsync({
        fecha: today,
        concepto: "Ahorro del mes",
        tipo: "Ahorro",
        categoria: "Ahorro general",
        importe: suggestedSavings,
        metodo: "",
        cuentaOrigen: "",
        cuentaDestino: "",
        notas: "Ahorro propuesto segun plan de ahorro",
        reservaId: "",
      });
      addMonthlySavingsMonth(currentMonth);
    } catch (e) {
      console.error("Error adding monthly savings:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeReserves = (reserves ?? []).filter((r) => r.activo === "S");
  const activeGoals = (goals ?? []).filter((g) => g.estado === "Activo");
  const activeFutures = (futures ?? []).filter((f) => f.activo === "S");
  const activeDeferred = (deferred ?? []).filter((d) => d.estado === "Activo");

  const hasAnyItems =
    activeReserves.length > 0 ||
    activeGoals.length > 0 ||
    activeFutures.length > 0 ||
    activeDeferred.length > 0;

  const totalSaved =
    activeReserves.reduce((acc, r) => acc + r.saldoActual, 0) +
    activeGoals.reduce((acc, g) => acc + g.saldoActual, 0) +
    activeFutures.reduce((acc, f) => acc + f.saldoReservado, 0);

  const totalTarget =
    activeReserves.reduce((acc, r) => acc + r.importeObjetivo, 0) +
    activeGoals.reduce((acc, g) => acc + g.importeObjetivo, 0) +
    activeFutures.reduce((acc, f) => acc + f.importeObjetivo, 0);

  const allItems: SavingsItemProps[] = [
    ...activeReserves.map((r) => ({
      icon: PiggyBank,
      name: r.nombre,
      subtitle: r.tipo,
      saved: r.saldoActual,
      target: r.importeObjetivo,
      monthlyNeeded: r.aporteMensualSugerido,
      colorClass: "text-savings",
      accentClass: "bg-savings/10",
    })),
    ...activeGoals.map((g) => ({
      icon: Target,
      name: g.nombre,
      subtitle: g.fechaObjetivo ? `Objetivo: ${g.fechaObjetivo}` : g.tipo,
      saved: g.saldoActual,
      target: g.importeObjetivo,
      monthlyNeeded: g.aporteMensual,
      colorClass: "text-income",
      accentClass: "bg-income/10",
    })),
    ...activeFutures.map((f) => ({
      icon: Clock,
      name: f.concepto,
      subtitle: f.fechaVencimiento ? `Vence: ${f.fechaVencimiento}` : f.categoria,
      saved: f.saldoReservado,
      target: f.importeObjetivo,
      monthlyNeeded: f.aporteMensual,
      colorClass: "text-warning",
      accentClass: "bg-warning/10",
    })),
    ...activeDeferred.map((d) => ({
      icon: CreditCard,
      name: d.concepto,
      subtitle: d.fechaFin ? `Fin: ${d.fechaFin}` : d.categoria,
      saved: d.importePagado,
      target: d.importeTotal,
      monthlyNeeded: d.cuotaMensual,
      colorClass: "text-muted-foreground",
      accentClass: "bg-muted",
    })),
  ];

  return (
    <Card className="overflow-hidden animate-fade-in border-savings/30 bg-savings/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-savings" />
            <h2 className="text-sm font-semibold">Control de ahorros</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              Total: <span className="font-semibold text-savings">{totalSaved.toFixed(2)}</span>
              {totalTarget > 0 && (
                <span className="text-muted-foreground"> / {totalTarget.toFixed(2)} €</span>
              )}
            </span>
          </div>
        </div>

        {!hasAnyItems ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <PiggyBank className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No hay reservas, objetivos ni pagos futuros activos.</p>
            <p className="text-xs mt-1">Crealos en la pantalla de Ahorros.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allItems.map((item, idx) => (
              <SavingsItem key={idx} {...item} />
            ))}
          </div>
        )}

        <div className="border-t border-border/50 pt-3 space-y-2">
          {incomeType === "fixed" && monthlyIncome > 0 && !alreadyAdded && suggestedSavings > 0 && (
            <Button
              onClick={handleAddMonthlySavings}
              disabled={isSubmitting}
              size="sm"
              className="w-full gap-2 bg-savings hover:bg-savings/90"
            >
              <PiggyBank className="h-4 w-4" />
              {isSubmitting
                ? "Guardando..."
                : `Añadir ahorro del mes (+${suggestedSavings.toFixed(2)} €)`}
            </Button>
          )}
          {alreadyAdded && (
            <div className="flex items-center gap-2 justify-center py-2 text-sm text-savings">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Ahorro del mes completado</span>
            </div>
          )}
          {incomeType === "variable" && (
            <p className="text-xs text-center text-muted-foreground">
              Con ingresos variables, añade el ahorro manualmente desde el botón +.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}