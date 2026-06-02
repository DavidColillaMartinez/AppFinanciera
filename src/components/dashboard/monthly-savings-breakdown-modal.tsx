"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";
import {
  CalendarCheck,
  PiggyBank,
  Target,
  Clock,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonthlySavingsBreakdown } from "@/lib/finance/finance-engine";
import type { ReserveMovementRow } from "@/types/models";
import { TipoDestinoReserva, TipoMovimientoReserva } from "@/constants/enums";
import Link from "next/link";

interface MonthlySavingsBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthKey: string;
  monthName: string;
  breakdown: MonthlySavingsBreakdown;
  targetNameById: (tipoDestino: string, destinoId: string) => string | null;
}

const TYPE_LABEL: Record<string, string> = {
  [TipoDestinoReserva.RESERVA]: "Reservas",
  [TipoDestinoReserva.OBJETIVO]: "Objetivos",
  [TipoDestinoReserva.PAGO_FUTURO]: "Pagos futuros",
  general: "General",
};

const TYPE_ICON: Record<string, typeof PiggyBank> = {
  [TipoDestinoReserva.RESERVA]: PiggyBank,
  [TipoDestinoReserva.OBJETIVO]: Target,
  [TipoDestinoReserva.PAGO_FUTURO]: Clock,
  general: Inbox,
};

const TYPE_COLOR: Record<string, string> = {
  [TipoDestinoReserva.RESERVA]: "text-savings",
  [TipoDestinoReserva.OBJETIVO]: "text-income",
  [TipoDestinoReserva.PAGO_FUTURO]: "text-warning",
  general: "text-muted-foreground",
};

const TYPE_BG: Record<string, string> = {
  [TipoDestinoReserva.RESERVA]: "bg-savings/10",
  [TipoDestinoReserva.OBJETIVO]: "bg-income/10",
  [TipoDestinoReserva.PAGO_FUTURO]: "bg-warning/10",
  general: "bg-muted",
};

export function MonthlySavingsBreakdownModal({
  open,
  onOpenChange,
  monthKey,
  monthName,
  breakdown,
  targetNameById,
}: MonthlySavingsBreakdownModalProps) {
  const { totalForMonth, planned, byDestination, reserveMovements } = breakdown;
  const execution = planned > 0 ? Math.min((totalForMonth / planned) * 100, 100) : 0;
  const hasAny = totalForMonth > 0 || planned > 0;

  const entriesByType: Record<string, ReserveMovementRow[]> = {
    [TipoDestinoReserva.RESERVA]: [],
    [TipoDestinoReserva.OBJETIVO]: [],
    [TipoDestinoReserva.PAGO_FUTURO]: [],
    general: [],
  };
  for (const m of reserveMovements) {
    if (m.tipoMovimiento !== TipoMovimientoReserva.APORTE) continue;
    const key = m.tipoDestino ?? "general";
    if (!entriesByType[key]) entriesByType[key] = [];
    entriesByType[key].push(m);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-savings" />
            Ahorro del mes
          </DialogTitle>
          <DialogDescription>
            {monthName} &middot; claves: {monthKey}
          </DialogDescription>
        </DialogHeader>

        {!hasAny ? (
          <EmptyState
            title="Sin ahorro este mes"
            description="Confirma el ahorro planificado o haz un aporte puntual."
            type="empty"
            action={{
              label: "Ir a confirmar ahorro mensual",
              onClick: () => window.location.assign("/savings/monthly"),
            }}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-savings/30 bg-savings/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Confirmado este mes
                </p>
                {planned > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {execution.toFixed(0)}% del plan
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-savings">
                {totalForMonth.toFixed(2)} €
              </p>
              {planned > 0 && (
                <>
                  <Progress value={execution} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Plan: {planned.toFixed(2)} €. Faltan{" "}
                    {Math.max(0, planned - totalForMonth).toFixed(2)} € para
                    alcanzar el plan.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              {Object.entries(byDestination).map(([key, value]) => {
                if (value <= 0) return null;
                const Icon = TYPE_ICON[key] ?? Inbox;
                const color = TYPE_COLOR[key] ?? "text-muted-foreground";
                const bg = TYPE_BG[key] ?? "bg-muted";
                const label = TYPE_LABEL[key] ?? key;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={cn("rounded p-1.5 shrink-0", bg)}>
                        <Icon className={cn("h-3.5 w-3.5", color)} />
                      </div>
                      <p className="text-sm font-medium">{label}</p>
                    </div>
                    <p className={cn("text-sm font-semibold tabular-nums", color)}>
                      +{value.toFixed(2)} €
                    </p>
                  </div>
                );
              })}
            </div>

            {reserveMovements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Movimientos del mes
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {reserveMovements.map((m) => {
                    const isAporte = m.tipoMovimiento === TipoMovimientoReserva.APORTE;
                    const name =
                      m.tipoDestino && m.destinoId
                        ? targetNameById(m.tipoDestino, m.destinoId) ?? "Sin nombre"
                        : "Ahorro general";
                    const key = m.tipoDestino ?? "general";
                    const color = TYPE_COLOR[key] ?? "text-muted-foreground";
                    const Icon = TYPE_ICON[key] ?? Inbox;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
                          <p className="truncate">{name}</p>
                        </div>
                        <p
                          className={cn(
                            "font-semibold tabular-nums",
                            isAporte ? "text-savings" : "text-expense",
                          )}
                        >
                          {isAporte ? "+" : "-"}
                          {m.importe.toFixed(2)} €
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Button asChild size="sm" className="flex-1 gap-2 bg-savings hover:bg-savings/90">
                <Link href="/savings/monthly">
                  <CalendarCheck className="h-4 w-4" />
                  Confirmar ahorro del mes
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href="/savings">
                  Aportar / Retirar
                </Link>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
