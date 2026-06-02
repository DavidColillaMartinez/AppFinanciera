"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/stores/app-store";
import { useReserves } from "@/features/reserves/hooks/use-reserves";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { useFuturePayments } from "@/features/future-payments/hooks/use-future-payments";
import { useDeferredPayments } from "@/features/deferred-payments/hooks/use-deferred-payments";
import { useFixedExpenses } from "@/features/fixed-expenses/hooks/use-fixed-expenses";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { useTargetBalances } from "@/features/savings/hooks/use-savings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  PiggyBank,
  Target,
  Clock,
  CreditCard,
  TrendingUp,
  CalendarCheck,
} from "lucide-react";
import { generateMonthKey } from "@/lib/sheets/adapters";

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
  const { sheetId, monthlyIncome, incomeType } = useAppStore();
  const { data: reserves } = useReserves(sheetId);
  const { data: goals } = useGoals(sheetId);
  const { data: futures } = useFuturePayments(sheetId);
  const { data: deferred } = useDeferredPayments(sheetId);
  const { data: fixedExpenses } = useFixedExpenses(sheetId);

  const currentMonth = useMemo(() => generateMonthKey(new Date().toISOString()), []);
  const { summary } = useFinanceSummary({ monthKey: currentMonth });
  const { savings, monthlySavings, available } = summary;

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

  const activeReserves = (reserves ?? []).filter((r) => r.activo === "S");
  const activeGoals = (goals ?? []).filter((g) => g.estado === "Activo");
  const activeFutures = (futures ?? []).filter((f) => f.activo === "S");
  const activeDeferred = (deferred ?? []).filter((d) => d.estado === "Activo");

  const { data: balances } = useTargetBalances(sheetId, {
    reserves: activeReserves.map((r) => ({
      reservaId: r.reservaId,
      saldoActual: r.saldoActual,
    })),
    goals: activeGoals.map((g) => ({
      objetivoId: g.objetivoId,
      saldoActual: g.saldoActual,
    })),
    futurePayments: activeFutures.map((f) => ({
      pagoId: f.pagoId,
      saldoReservado: f.saldoReservado,
    })),
  });

  const balanceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of balances ?? []) {
      map.set(`${b.tipoDestino}::${b.destinoId}`, b.effectiveBalance);
    }
    return map;
  }, [balances]);

  function effectiveBalance(
    tipoDestino: "reserva" | "objetivo" | "pago_futuro",
    destinoId: string,
    manual: number,
  ): number {
    return balanceMap.get(`${tipoDestino}::${destinoId}`) ?? manual;
  }

  const hasAnyItems =
    activeReserves.length > 0 ||
    activeGoals.length > 0 ||
    activeFutures.length > 0 ||
    activeDeferred.length > 0;

  const totalSaved = savings.totalSaved;
  const totalTarget = savings.totalTarget;

  const allItems: SavingsItemProps[] = [
    ...activeReserves.map((r) => ({
      icon: PiggyBank,
      name: r.nombre,
      subtitle: r.tipo,
      saved: effectiveBalance("reserva", r.reservaId, r.saldoActual),
      target: r.importeObjetivo,
      monthlyNeeded: r.aporteMensualSugerido,
      colorClass: "text-savings",
      accentClass: "bg-savings/10",
    })),
    ...activeGoals.map((g) => ({
      icon: Target,
      name: g.nombre,
      subtitle: g.fechaObjetivo ? `Objetivo: ${g.fechaObjetivo}` : g.tipo,
      saved: effectiveBalance("objetivo", g.objetivoId, g.saldoActual),
      target: g.importeObjetivo,
      monthlyNeeded: g.aporteMensual,
      colorClass: "text-income",
      accentClass: "bg-income/10",
    })),
    ...activeFutures.map((f) => ({
      icon: Clock,
      name: f.concepto,
      subtitle: f.fechaVencimiento ? `Vence: ${f.fechaVencimiento}` : f.categoria,
      saved: effectiveBalance("pago_futuro", f.pagoId, f.saldoReservado),
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
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-card border border-border/50 p-2">
              <p className="text-muted-foreground uppercase tracking-wide">
                Mes en curso
              </p>
              <p className="text-sm font-semibold text-savings mt-0.5">
                +{monthlySavings.totalForMonth.toFixed(2)} €
              </p>
              <p className="text-xs text-muted-foreground">
                Plan: {monthlySavings.planned.toFixed(2)}
              </p>
            </div>
            <div className="rounded-md bg-card border border-border/50 p-2">
              <p className="text-muted-foreground uppercase tracking-wide">
                Disponible
              </p>
              <p
                className={cn(
                  "text-sm font-semibold mt-0.5",
                  available.available >= 0 ? "text-income" : "text-expense",
                )}
              >
                {available.available >= 0 ? "+" : ""}
                {available.available.toFixed(2)} €
              </p>
              <p className="text-xs text-muted-foreground">
                Plan sugerido: {suggestedSavings.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              className="flex-1 gap-2 bg-savings hover:bg-savings/90"
            >
              <Link href="/savings/monthly">
                <CalendarCheck className="h-4 w-4" />
                Confirmar ahorro del mes
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="flex-1 gap-2">
              <Link href="/savings">
                <PiggyBank className="h-4 w-4" />
                Aportar / Retirar
              </Link>
            </Button>
          </div>
          {incomeType === "variable" && (
            <p className="text-xs text-center text-muted-foreground">
              Con ingresos variables, registra el ahorro desde cada destino.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
