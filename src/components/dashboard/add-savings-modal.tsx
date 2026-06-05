"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/states/empty-state";
import {
  PiggyBank,
  Target,
  Clock,
  CalendarCheck,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirmMonthlyPlannedSaving } from "@/features/savings/hooks/use-savings";
import type { MonthlySavingsPlanItem } from "@/lib/finance/finance-engine";
import { TipoDestinoReserva } from "@/constants/enums";

const TYPE_ICONS = {
  [TipoDestinoReserva.RESERVA]: PiggyBank,
  [TipoDestinoReserva.OBJETIVO]: Target,
  [TipoDestinoReserva.PAGO_FUTURO]: Clock,
} as const;

const TYPE_LABELS = {
  [TipoDestinoReserva.RESERVA]: "Reserva",
  [TipoDestinoReserva.OBJETIVO]: "Objetivo",
  [TipoDestinoReserva.PAGO_FUTURO]: "Pago futuro",
} as const;

const PRIORITY_CLASS: Record<string, string> = {
  Alta: "bg-red-100 text-red-700",
  Media: "bg-amber-100 text-amber-700",
  Baja: "bg-blue-100 text-blue-700",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  ok: "OK",
  tight: "Ajustado",
  difficult: "Difícil",
  impossible: "Inviable",
};

const DIFFICULTY_CLASS: Record<string, string> = {
  ok: "bg-green-100 text-green-700",
  tight: "bg-amber-100 text-amber-700",
  difficult: "bg-orange-100 text-orange-700",
  impossible: "bg-red-100 text-red-700",
};

interface AddSavingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetId: string | null;
  monthKey: string;
  monthName: string;
  items: MonthlySavingsPlanItem[];
  availableCapacity: number;
  onSuccess?: () => void;
}

export function AddSavingsModal({
  open,
  onOpenChange,
  sheetId,
  monthKey,
  monthName,
  items,
  availableCapacity,
  onSuccess,
}: AddSavingsModalProps) {
  const { success, error: showError } = useToast();
  const confirmMutation = useConfirmMonthlyPlannedSaving(sheetId);

  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [submittingAll, setSubmittingAll] = useState(false);

  const eligible = useMemo(
    () => items.filter((i) => !i.isCompleted),
    [items],
  );

  const keyOf = (i: MonthlySavingsPlanItem) => `${i.targetType}::${i.targetId}`;

  const valueFor = (i: MonthlySavingsPlanItem): number => {
    const raw = amounts[keyOf(i)];
    if (raw !== undefined && raw !== "") {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) return n;
    }
    return i.recommendedAmount;
  };

  const totalPlanned = eligible.reduce((acc, i) => acc + valueFor(i), 0);
  const totalConfirmed = eligible.reduce(
    (acc, i) => acc + i.confirmedThisMonth,
    0,
  );
  const pendingCount = eligible.filter(
    (i) => i.confirmedThisMonth < valueFor(i) && valueFor(i) > 0,
  ).length;

  const handleConfirm = async (i: MonthlySavingsPlanItem) => {
    const k = keyOf(i);
    const amount = valueFor(i);
    if (!(amount > 0)) {
      showError(`Importe no válido para "${i.name}".`);
      return;
    }
    setSubmittingKey(k);
    try {
      const r = await confirmMutation.mutateAsync({
        monthKey,
        tipoDestino: i.targetType,
        destinoId: i.targetId,
        reservaId: i.targetId,
        importe: amount,
        notas: `Aporte directo (${monthKey})`,
      });
      success(
        r.created
          ? `Aporte confirmado para "${i.name}".`
          : `Aporte actualizado para "${i.name}".`,
      );
      onSuccess?.();
    } catch (e) {
      showError(`Error al confirmar: ${(e as Error).message}`);
    } finally {
      setSubmittingKey(null);
    }
  };

  const handleConfirmAll = async () => {
    const targets = eligible.filter(
      (i) => i.confirmedThisMonth < valueFor(i) && valueFor(i) > 0,
    );
    if (targets.length === 0) return;
    setSubmittingAll(true);
    let ok = 0;
    let fail = 0;
    for (const i of targets) {
      const amount = valueFor(i);
      if (!(amount > 0)) {
        fail++;
        continue;
      }
      try {
        await confirmMutation.mutateAsync({
          monthKey,
          tipoDestino: i.targetType,
          destinoId: i.targetId,
          reservaId: i.targetId,
          importe: amount,
          notas: `Aporte directo (${monthKey})`,
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setSubmittingAll(false);
    success(`Resumen: ${ok} confirmados, ${fail} fallidos.`);
    if (ok > 0) onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-savings" />
            Añadir ahorros
          </DialogTitle>
          <DialogDescription>
            {monthName} &middot; capacidad estimada: {availableCapacity.toFixed(2)} €
          </DialogDescription>
        </DialogHeader>

        {eligible.length === 0 ? (
          <div className="space-y-3">
            <EmptyState
              title="Sin ahorros activos"
              description="No tienes ahorros activos para este mes. Crea una reserva, un objetivo o un pago futuro para empezar."
              type="empty"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link href="/savings?tab=objetivos">
                  <Target className="h-4 w-4" />
                  Crear objetivo
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link href="/savings?tab=reservas">
                  <PiggyBank className="h-4 w-4" />
                  Crear reserva
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link href="/savings?tab=futuros">
                  <Clock className="h-4 w-4" />
                  Crear pago futuro
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Card>
              <CardContent className="p-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-amber-800 font-medium">
                    Pendientes
                  </p>
                  <p className="text-lg font-bold text-amber-900">{pendingCount}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-green-800 font-medium">
                    Plan vs confirmado
                  </p>
                  <p className="text-sm font-bold text-green-900">
                    {totalConfirmed.toFixed(0)} / {totalPlanned.toFixed(0)} €
                  </p>
                </div>
              </CardContent>
            </Card>

            {pendingCount > 0 && (
              <Button
                onClick={handleConfirmAll}
                disabled={submittingAll}
                className="w-full gap-2"
                size="sm"
              >
                <CalendarCheck className="h-4 w-4" />
                {submittingAll
                  ? "Confirmando..."
                  : `Confirmar todos los pendientes (${pendingCount})`}
              </Button>
            )}

            <div className="space-y-2">
              {eligible.map((i) => {
                const k = keyOf(i);
                const Icon = TYPE_ICONS[i.targetType] ?? PiggyBank;
                const typeLabel = TYPE_LABELS[i.targetType] ?? "Ahorro";
                const value = valueFor(i);
                const isSubmitting = submittingKey === k;
                const alreadyConfirmed = i.confirmedThisMonth >= value && value > 0;
                return (
                  <Card
                    key={k}
                    className={cn(
                      "overflow-hidden",
                      alreadyConfirmed && "border-green-200",
                    )}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div className="rounded p-1.5 bg-savings/10 shrink-0">
                            <Icon className="h-3.5 w-3.5 text-savings" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{i.name}</p>
                            <div className="flex items-center gap-1 flex-wrap mt-0.5">
                              <Badge variant="outline" className="text-[10px]">
                                {typeLabel}
                              </Badge>
                              {i.priority !== "—" && (
                                <span
                                  className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                    PRIORITY_CLASS[i.priority] ?? "bg-muted",
                                  )}
                                >
                                  {i.priority}
                                </span>
                              )}
                              <span
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                  DIFFICULTY_CLASS[i.difficulty] ?? "bg-muted",
                                )}
                              >
                                {DIFFICULTY_LABEL[i.difficulty] ?? i.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        {i.currentSaved.toFixed(0)} / {i.targetAmount.toFixed(0)} € &middot; {i.reason}
                      </p>

                      <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          <label
                            htmlFor={`amount-${k}`}
                            className="text-[10px] text-muted-foreground"
                          >
                            Importe (€)
                          </label>
                          <Input
                            id={`amount-${k}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={
                              amounts[k] !== undefined
                                ? amounts[k]
                                : i.recommendedAmount.toString()
                            }
                            onChange={(e) =>
                              setAmounts((p) => ({ ...p, [k]: e.target.value }))
                            }
                            disabled={isSubmitting}
                            className="h-8"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(i)}
                          disabled={isSubmitting || value <= 0}
                          className="gap-1"
                        >
                          {isSubmitting
                            ? "..."
                            : alreadyConfirmed
                              ? "Actualizar"
                              : "Confirmar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {availableCapacity <= 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-amber-800">
                  Este mes no tienes capacidad libre. Revisa el plan o reduce el
                  importe recomendado.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
