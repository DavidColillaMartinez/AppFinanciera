"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/states/empty-state";
import {
  Calculator,
  AlertTriangle,
  CalendarCheck,
  TrendingUp,
  Receipt,
  PiggyBank,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AvailableBalanceBreakdown } from "@/lib/finance/finance-engine";
import Link from "next/link";

interface DisponibleExplanationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  available: AvailableBalanceBreakdown;
  pendingFixedCount: number;
  savingsEmpty: boolean;
  salaryConfigured: boolean;
}

const TYPE_ICONS = {
  income: TrendingUp,
  expense: Receipt,
  saving: PiggyBank,
  provision: Clock,
  adjustment: Calculator,
} as const;

const TYPE_LABELS = {
  income: "Ingresos",
  expense: "Gastos",
  saving: "Ahorro",
  provision: "Provisiones",
  adjustment: "Ajustes",
} as const;

const TYPE_TEXT_CLASS = {
  income: "text-income",
  expense: "text-expense",
  saving: "text-savings",
  provision: "text-warning",
  adjustment: "text-muted-foreground",
} as const;

export function DisponibleExplanationModal({
  open,
  onOpenChange,
  available,
  pendingFixedCount,
  savingsEmpty,
  salaryConfigured,
}: DisponibleExplanationModalProps) {
  const hasData =
    available.income > 0 ||
    available.variableExpenses > 0 ||
    available.fixedExpensesConfirmed > 0 ||
    available.fixedExpensesPending > 0 ||
    available.deferredPayments > 0 ||
    available.futurePaymentProvisions > 0 ||
    available.plannedSavings > 0;

  const grouped = useMemo(() => {
    const buckets: Record<keyof typeof TYPE_LABELS, typeof available.explanation> = {
      income: [],
      expense: [],
      saving: [],
      provision: [],
      adjustment: [],
    };
    for (const line of available.explanation) {
      buckets[line.type].push(line);
    }
    return buckets;
  }, [available.explanation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Detalle del Disponible
          </DialogTitle>
          <DialogDescription>
            Cómo se calcula el importe que aún puedes gastar este mes.
          </DialogDescription>
        </DialogHeader>

        <Card
          className={cn(
            "border-2",
            available.available >= 0
              ? "card-income border-income/30"
              : "card-expense border-expense/30",
          )}
        >
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Resultado
            </p>
            <p
              className={cn(
                "text-3xl font-bold tracking-tight",
                available.available >= 0 ? "text-income" : "text-expense",
              )}
            >
              {available.available >= 0 ? "+" : ""}
              {available.available.toFixed(2)} €
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {available.available >= 0
                ? "Puedes gastar este importe sin tocar obligaciones ni ahorro planificado."
                : "Estas en negativo: cubre primero las obligaciones confirmadas."}
            </p>
          </CardContent>
        </Card>

        {!salaryConfigured && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-medium text-foreground">
                No has configurado la nómina.
              </p>
              <p className="text-muted-foreground">
                El Disponible no incluye el sueldo hasta que lo hagas.
              </p>
              <Link
                href="/more/salary"
                className="text-primary font-medium hover:underline"
              >
                Configurar nómina →
              </Link>
            </div>
          </div>
        )}

        {pendingFixedCount > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-medium text-foreground">
                Tienes {pendingFixedCount} gasto
                {pendingFixedCount === 1 ? "" : "s"} fijo
                {pendingFixedCount === 1 ? "" : "s"} pendiente
                {pendingFixedCount === 1 ? "" : "s"} de confirmar.
              </p>
              <p className="text-muted-foreground">
                Afectan al Disponible aunque todavía no tengan movimiento.
              </p>
              <Link
                href="/fixed-expenses/confirm"
                className="text-primary font-medium hover:underline"
              >
                Revisar pendientes →
              </Link>
            </div>
          </div>
        )}

        {!hasData ? (
          <EmptyState
            title="Sin datos del mes"
            description="Empieza añadiendo ingresos, gastos o configurando tu nómina."
            type="empty"
          />
        ) : (
          <div className="space-y-3">
            {(Object.keys(grouped) as Array<keyof typeof grouped>).map((bucket) => {
              const lines = grouped[bucket];
              if (lines.length === 0) return null;
              const Icon = TYPE_ICONS[bucket];
              return (
                <div key={bucket} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", TYPE_TEXT_CLASS[bucket])} />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {TYPE_LABELS[bucket]}
                    </p>
                  </div>
                  <div className="space-y-1 rounded-lg border border-border/50 bg-card p-2">
                    {lines.map((line, idx) => (
                      <div
                        key={`${line.label}-${idx}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span
                          className={cn(
                            "truncate",
                            line.label.startsWith("  ") &&
                              "pl-3 text-muted-foreground text-xs",
                          )}
                        >
                          {line.label.replace(/^\s+/, "")}
                        </span>
                        <span
                          className={cn(
                            "font-mono font-semibold tabular-nums ml-2 shrink-0",
                            line.amount >= 0 ? "text-income" : "text-expense",
                          )}
                        >
                          {line.amount >= 0 ? "+" : ""}
                          {line.amount.toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-border/50 pt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            El Disponible no descuenta el ahorro ya ejecutado (se refleja en
            tus reservas, objetivos y pagos futuros).
          </p>
          {savingsEmpty && (
            <Button asChild size="sm" variant="outline" className="w-full gap-2">
              <Link href="/savings/monthly">
                <CalendarCheck className="h-4 w-4" />
                Confirmar ahorro del mes
              </Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
