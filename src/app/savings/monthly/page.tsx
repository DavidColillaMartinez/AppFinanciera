"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/stores/app-store";
import { useReserves } from "@/features/reserves/hooks/use-reserves";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { useFuturePayments } from "@/features/future-payments/hooks/use-future-payments";
import {
  useConfirmMonthlyPlannedSaving,
  useUnconfirmMonthlyPlannedSaving,
  usePlannedMonthlyTargets,
  type PlannedTargetWithStatus,
} from "@/features/savings/hooks/use-savings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { generateMonthKey } from "@/lib/sheets/adapters";
import { TipoDestinoReserva } from "@/constants/enums";
import { ChevronLeft, CalendarCheck, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MonthlySavingsPage() {
  const { sheetId } = useAppStore();
  const { success, error: showError } = useToast();

  const currentMonth = useMemo(() => generateMonthKey(new Date().toISOString()), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submittingAll, setSubmittingAll] = useState(false);

  const { data: reserves, isLoading: lR } = useReserves(sheetId);
  const { data: goals, isLoading: lG } = useGoals(sheetId);
  const { data: futures, isLoading: lF } = useFuturePayments(sheetId);

  const { targets, isLoading: lP, isError: eP, error: pError } =
    usePlannedMonthlyTargets(sheetId, selectedMonth, {
      reserves: reserves ?? [],
      goals: goals ?? [],
      futurePayments: futures ?? [],
    });

  const confirmOne = useConfirmMonthlyPlannedSaving(sheetId);
  const unconfirmOne = useUnconfirmMonthlyPlannedSaving(sheetId);

  function key(t: PlannedTargetWithStatus) {
    return `${t.tipoDestino}::${t.destinoId}`;
  }

  function getAmount(t: PlannedTargetWithStatus): number {
    const raw = amounts[key(t)];
    if (raw !== undefined && raw !== "") {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) return n;
    }
    return t.effectiveAmount;
  }

  function setAmount(t: PlannedTargetWithStatus, value: string) {
    setAmounts((prev) => ({ ...prev, [key(t)]: value }));
  }

  async function handleConfirm(t: PlannedTargetWithStatus) {
    const amount = getAmount(t);
    if (!(amount > 0)) {
      showError(`Importe invalido para "${t.nombre}".`);
      return;
    }
    const k = key(t);
    setSubmittingId(k);
    try {
      const r = await confirmOne.mutateAsync({
        monthKey: selectedMonth,
        tipoDestino: t.tipoDestino,
        destinoId: t.destinoId,
        reservaId: t.reservaId,
        importe: amount,
        notas: `Ahorro mensual planificado (${selectedMonth})`,
      });
      success(
        r.created
          ? `Aporte mensual confirmado para "${t.nombre}".`
          : `Aporte mensual actualizado para "${t.nombre}".`,
      );
    } catch (e) {
      showError(`Error al confirmar: ${(e as Error).message}`);
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleUnconfirm(t: PlannedTargetWithStatus) {
    if (!confirm(`¿Desconfirmar el aporte mensual de "${t.nombre}" en ${selectedMonth}?`)) {
      return;
    }
    const k = key(t);
    setSubmittingId(k);
    try {
      const r = await unconfirmOne.mutateAsync({
        monthKey: selectedMonth,
        tipoDestino: t.tipoDestino,
        destinoId: t.destinoId,
      });
      if (r.removed) {
        success(`Aporte mensual desconfirmado para "${t.nombre}".`);
      } else {
        success(`"${t.nombre}" no tenia un aporte confirmado para este mes.`);
      }
    } catch (e) {
      showError(`Error al desconfirmar: ${(e as Error).message}`);
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleConfirmAll() {
    const pending = targets.filter((t) => !t.confirmed);
    if (pending.length === 0) return;
    setSubmittingAll(true);
    let ok = 0;
    let fail = 0;
    for (const t of pending) {
      const amount = getAmount(t);
      if (!(amount > 0)) {
        fail++;
        continue;
      }
      try {
        await confirmOne.mutateAsync({
          monthKey: selectedMonth,
          tipoDestino: t.tipoDestino,
          destinoId: t.destinoId,
          reservaId: t.reservaId,
          importe: amount,
          notas: `Ahorro mensual planificado (${selectedMonth})`,
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setSubmittingAll(false);
    success(`Resumen: ${ok} confirmados, ${fail} fallidos.`);
  }

  const isLoading = lR || lG || lF || lP;
  const isError = eP;
  const errorMsg = pError as Error | null;

  if (!sheetId) {
    return (
      <div className="px-4 py-6 pb-24 space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/savings" className="p-2 -ml-2 rounded-lg hover:bg-muted">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Ahorro del mes</h1>
        </div>
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Conecta una hoja de Google antes de confirmar el ahorro del mes.
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPlanned = targets.reduce((acc, t) => acc + getAmount(t), 0);
  const totalConfirmed = targets
    .filter((t) => t.confirmed)
    .reduce((acc, t) => acc + t.existingAmount, 0);
  const pendingCount = targets.filter((t) => !t.confirmed).length;

  return (
    <div className="px-4 py-6 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/savings" className="p-2 -ml-2 rounded-lg hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ahorro del mes</h1>
          <p className="text-sm text-muted-foreground">
            Confirma el aporte mensual para cada destino.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="month">
              Mes
            </label>
            <Input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setAmounts({});
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-0.5">
              <p className="text-xs uppercase tracking-wide text-amber-800 font-medium">
                Pendientes
              </p>
              <p className="text-2xl font-bold text-amber-900">{pendingCount}</p>
              <p className="text-xs text-amber-700">
                {(totalPlanned - totalConfirmed).toFixed(2)} €
              </p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-0.5">
              <p className="text-xs uppercase tracking-wide text-green-800 font-medium">
                Confirmados
              </p>
              <p className="text-2xl font-bold text-green-900">
                {targets.length - pendingCount}
              </p>
              <p className="text-xs text-green-700">{totalConfirmed.toFixed(2)} €</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && <LoadingState message="Cargando..." />}
      {isError && (
        <ErrorState message={errorMsg?.message ?? "Error al cargar"} />
      )}

      {!isLoading && !isError && targets.length === 0 && (
        <EmptyState
          title="Sin aportes planificados"
          description="Crea reservas, objetivos o pagos futuros con aporte mensual para verlos aqui."
          type="empty"
        />
      )}

      {pendingCount > 0 && (
        <Button
          onClick={handleConfirmAll}
          disabled={submittingAll}
          className="w-full gap-2"
          size="lg"
        >
          <CalendarCheck className="h-5 w-5" />
          {submittingAll
            ? "Confirmando..."
            : `Confirmar todos los pendientes (${pendingCount})`}
        </Button>
      )}

      {targets.length > 0 && (
        <div className="space-y-2">
          {targets.map((t) => {
            const k = key(t);
            const isSubmittingThis = submittingId === k;
            return (
              <Card
                key={k}
                className={cn(
                  "overflow-hidden",
                  t.confirmed && "border-green-200",
                )}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{t.nombre}</p>
                        <Badge variant="outline" className="text-xs">
                          {t.tipoLabel}
                        </Badge>
                        {t.tipoDestino === TipoDestinoReserva.RESERVA && (
                          <Badge variant="outline" className="text-xs">
                            Reserva
                          </Badge>
                        )}
                        {t.tipoDestino === TipoDestinoReserva.OBJETIVO && (
                          <Badge variant="outline" className="text-xs">
                            Objetivo
                          </Badge>
                        )}
                        {t.tipoDestino === TipoDestinoReserva.PAGO_FUTURO && (
                          <Badge variant="outline" className="text-xs">
                            Pago futuro
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Plan sugerido: {t.monthlyRecommended.toFixed(2)} €
                      </p>
                    </div>
                    {t.confirmed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    ) : null}
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <label
                        className="text-xs text-muted-foreground"
                        htmlFor={`amount-${k}`}
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
                            : t.effectiveAmount.toString()
                        }
                        onChange={(e) => setAmount(t, e.target.value)}
                        disabled={isSubmittingThis}
                      />
                    </div>
                    {t.confirmed ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnconfirm(t)}
                        disabled={isSubmittingThis}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(t)}
                        disabled={isSubmittingThis}
                        className="gap-2"
                      >
                        <CalendarCheck className="h-4 w-4" />
                        {isSubmittingThis ? "..." : "Confirmar"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {targets.length > 0 && (
        <Card className="border-blue-100">
          <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
            <p>
              Cada destino con aporte mensual se confirma con un ID
              deterministico{" "}
              <span className="font-mono">LEDGER-MONTHLY-YYYY-MM-tipoDestino-destinoId</span>{" "}
              para evitar duplicados.
            </p>
            <p>
              Si confirmas dos veces, la fila se actualiza en vez de duplicarse.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
