"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/stores/app-store";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { useReserves, useDeleteReserve, useUpdateReserve } from "@/features/reserves/hooks/use-reserves";
import { useGoals, useDeleteGoal, useUpdateGoal } from "@/features/goals/hooks/use-goals";
import { useFuturePayments, useDeleteFuturePayment, useUpdateFuturePayment } from "@/features/future-payments/hooks/use-future-payments";
import { useDeferredPayments, useDeleteDeferredPayment } from "@/features/deferred-payments/hooks/use-deferred-payments";
import { useFixedExpenses, useDeleteFixedExpense } from "@/features/fixed-expenses/hooks/use-fixed-expenses";
import { useTargetBalances } from "@/features/savings/hooks/use-savings";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { ReserveForm } from "@/features/reserves/components/reserve-form";
import { GoalForm } from "@/features/goals/components/goal-form";
import { FuturePaymentForm } from "@/features/future-payments/components/future-payment-form";
import { DeferredPaymentForm } from "@/features/deferred-payments/components/deferred-payment-form";
import { FixedExpenseForm } from "@/features/fixed-expenses/components/fixed-expense-form";
import { ReserveMovements } from "@/features/reserve-movements/components/reserve-movements-list";
import { SavingsMovementForm } from "@/features/savings/components/savings-movement-form";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Plus, History, ArrowDownLeft, CalendarCheck, Pause, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReserveRow } from "@/types/models";
import type { GoalRow } from "@/types/models";
import type { FuturePaymentRow } from "@/types/models";
import type { InstallmentPaymentRow } from "@/types/models";
import type { FixedExpenseRow } from "@/types/models";

type Tab = "reservas" | "objetivos" | "futuros" | "aplazados" | "fijos";

export default function SavingsPage() {
  const { sheetId } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>("reservas");

  const [showReserveForm, setShowReserveForm] = useState(false);
  const [editingReserve, setEditingReserve] = useState<ReserveRow | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalRow | null>(null);
  const [showFutureForm, setShowFutureForm] = useState(false);
  const [editingFuture, setEditingFuture] = useState<FuturePaymentRow | null>(null);
  const [showDeferredForm, setShowDeferredForm] = useState(false);
  const [editingDeferred, setEditingDeferred] = useState<InstallmentPaymentRow | null>(null);
  const [showFixedForm, setShowFixedForm] = useState(false);
  const [editingFixed, setEditingFixed] = useState<FixedExpenseRow | null>(null);
  const [viewingMovements, setViewingMovements] = useState<{ id: string; nombre: string } | null>(null);
  const [contributeTarget, setContributeTarget] = useState<{
    tipoDestino: "reserva" | "objetivo" | "pago_futuro";
    destinoId: string;
    reservaId: string;
    nombre: string;
  } | null>(null);

  const {
    data: reserves,
    isLoading: loadingReserves,
    isError: errorReserves,
    error: reservesError,
  } = useReserves(sheetId);
  const {
    data: goals,
    isLoading: loadingGoals,
    isError: errorGoals,
    error: goalsError,
  } = useGoals(sheetId);
  const {
    data: futures,
    isLoading: loadingFutures,
    isError: errorFutures,
    error: futuresError,
  } = useFuturePayments(sheetId);
  const {
    data: deferred,
    isLoading: loadingDeferred,
    isError: errorDeferred,
    error: deferredError,
  } = useDeferredPayments(sheetId);
  const {
    data: fixed,
    isLoading: loadingFixed,
    isError: errorFixed,
    error: fixedError,
  } = useFixedExpenses(sheetId);

  const deleteReserve = useDeleteReserve(sheetId);
  const deleteGoal = useDeleteGoal(sheetId);
  const deleteFuture = useDeleteFuturePayment(sheetId);
  const deleteDeferred = useDeleteDeferredPayment(sheetId);
  const deleteFixed = useDeleteFixedExpense(sheetId);
  const updateReserve = useUpdateReserve(sheetId);
  const updateGoal = useUpdateGoal(sheetId);
  const updateFuture = useUpdateFuturePayment(sheetId);

  const activeReserves = (reserves ?? []).filter((r) => r.estado !== "Cancelado");
  const activeGoals = (goals ?? []).filter((g) => g.estado !== "Cancelado");
  const activeFutures = (futures ?? []).filter((f) => f.estado !== "Cancelado");

  async function handleTogglePause(
    type: "reserve" | "goal" | "future",
    item: { estado: string; nombre: string; tipo?: string } & Record<string, any>,
  ) {
    const nuevoEstado = item.estado === "Activo" ? "Pausado" : "Activo";
    try {
      if (type === "reserve") {
        await updateReserve.mutateAsync({
          reservaId: item.reservaId,
          nombre: item.nombre,
          tipo: item.tipo ?? "Otro",
          importeObjetivo: item.importeObjetivo ?? 0,
          estado: nuevoEstado,
        });
      } else if (type === "goal") {
        await updateGoal.mutateAsync({
          objetivoId: item.objetivoId,
          nombre: item.nombre,
          tipo: item.tipo ?? "Otro",
          importeObjetivo: item.importeObjetivo ?? 0,
          estado: nuevoEstado,
        });
      } else {
        await updateFuture.mutateAsync({
          pagoId: item.pagoId,
          concepto: item.concepto ?? item.nombre,
          categoria: item.categoria ?? "",
          importeObjetivo: item.importeObjetivo ?? 0,
          estado: nuevoEstado,
        });
      }
    } catch (e) {
      console.error("Error toggling state:", e);
    }
  }

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

  const tabs: { id: Tab; label: string }[] = [
    { id: "reservas", label: "Reservas" },
    { id: "objetivos", label: "Objetivos" },
    { id: "futuros", label: "Futuros" },
    { id: "aplazados", label: "Aplazados" },
    { id: "fijos", label: "Fijos" },
  ];

  function handleAdd() {
    switch (activeTab) {
      case "reservas":
        setEditingReserve(null);
        setShowReserveForm(true);
        break;
      case "objetivos":
        setEditingGoal(null);
        setShowGoalForm(true);
        break;
      case "futuros":
        setEditingFuture(null);
        setShowFutureForm(true);
        break;
      case "aplazados":
        setEditingDeferred(null);
        setShowDeferredForm(true);
        break;
      case "fijos":
        setEditingFixed(null);
        setShowFixedForm(true);
        break;
    }
  }

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ahorros</h1>
          <p className="text-sm text-muted-foreground">
            Planificación financiera futura
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href="/savings/monthly">
              <CalendarCheck className="h-4 w-4" />
              Mes
            </Link>
          </Button>
          <Button size="sm" className="gap-2" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Nuevo
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-green-50 border border-green-200 p-2 text-center">
          <p className="text-xs text-green-700 font-medium">Activos</p>
          <p className="text-lg font-bold text-green-800">
            {activeTab === "reservas"
              ? (reserves ?? []).filter((r) => r.estado === "Activo").length
              : activeTab === "objetivos"
                ? (goals ?? []).filter((g) => g.estado === "Activo").length
                : activeTab === "futuros"
                  ? (futures ?? []).filter((f) => f.estado === "Activo").length
                  : 0}
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-center">
          <p className="text-xs text-amber-700 font-medium">Pausados</p>
          <p className="text-lg font-bold text-amber-800">
            {activeTab === "reservas"
              ? (reserves ?? []).filter((r) => r.estado === "Pausado").length
              : activeTab === "objetivos"
                ? (goals ?? []).filter((g) => g.estado === "Pausado").length
                : activeTab === "futuros"
                  ? (futures ?? []).filter((f) => f.estado === "Pausado").length
                  : 0}
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-center">
          <p className="text-xs text-blue-700 font-medium">Completados</p>
          <p className="text-lg font-bold text-blue-800">
            {activeTab === "reservas"
              ? (reserves ?? []).filter((r) => r.estado === "Completado").length
              : activeTab === "objetivos"
                ? (goals ?? []).filter((g) => g.estado === "Completado").length
                : activeTab === "futuros"
                  ? (futures ?? []).filter((f) => f.estado === "Completado").length
                  : 0}
          </p>
        </div>
      </div>

      {activeTab === "reservas" && (
        <>
          {loadingReserves && <LoadingState message="Cargando reservas..." />}
          {errorReserves && (
            <ErrorState message={(reservesError as Error)?.message ?? "Error al cargar"} />
          )}
          {!loadingReserves && !errorReserves && (reserves ?? []).length === 0 && (
            <EmptyState
              title="Sin reservas"
              description="Crea tu primera reserva de emergencia."
              type="empty"
            />
          )}
          {!loadingReserves && !errorReserves && reserves && reserves.length > 0 && (
            <div className="space-y-2">
              {reserves.map((reserve) => {
                const saved = effectiveBalance("reserva", reserve.reservaId, reserve.saldoActual);
                const progress =
                  reserve.importeObjetivo > 0
                    ? Math.min((saved / reserve.importeObjetivo) * 100, 100)
                    : 0;
                return (
                  <Card key={reserve.reservaId} className="overflow-hidden transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{reserve.nombre}</p>
                            <p className="text-xs text-muted-foreground">{reserve.tipo}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {reserve.estado !== "Activo" && (
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                reserve.estado === "Pausado" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700",
                              )}>
                                {reserve.estado}
                              </span>
                            )}
                            <Badge variant="outline">{reserve.prioridad}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleTogglePause("reserve", reserve as any)}
                              title={reserve.estado === "Activo" ? "Pausar" : "Reactivar"}
                            >
                              {reserve.estado === "Activo" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setViewingMovements({
                                  id: reserve.reservaId,
                                  nombre: reserve.nombre,
                                })
                              }
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingReserve(reserve);
                                setShowReserveForm(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                if (confirm("¿Eliminar esta reserva?")) {
                                  deleteReserve.mutate(reserve.reservaId);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{saved.toFixed(2)}</span>
                          <span className="text-muted-foreground">
                            / {reserve.importeObjetivo.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {progress.toFixed(1)}% · Aporte: {reserve.aporteMensualSugerido.toFixed(2)}/mes
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={() =>
                              setContributeTarget({
                                tipoDestino: "reserva",
                                destinoId: reserve.reservaId,
                                reservaId: reserve.reservaId,
                                nombre: reserve.nombre,
                              })
                            }
                          >
                            <ArrowDownLeft className="h-3 w-3" />
                            Aportar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "objetivos" && (
        <>
          {loadingGoals && <LoadingState message="Cargando objetivos..." />}
          {errorGoals && (
            <ErrorState message={(goalsError as Error)?.message ?? "Error al cargar"} />
          )}
          {!loadingGoals && !errorGoals && (goals ?? []).length === 0 && (
            <EmptyState
              title="Sin objetivos"
              description="Crea tu primer objetivo de ahorro."
              type="empty"
            />
          )}
          {!loadingGoals && !errorGoals && goals && goals.length > 0 && (
            <div className="space-y-2">
              {goals.map((goal) => {
                const saved = effectiveBalance("objetivo", goal.objetivoId, goal.saldoActual);
                const progress =
                  goal.importeObjetivo > 0
                    ? Math.min((saved / goal.importeObjetivo) * 100, 100)
                    : 0;
                return (
                  <Card key={goal.objetivoId} className="overflow-hidden transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{goal.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {goal.fechaObjetivo && `Fecha: ${goal.fechaObjetivo} · `}
                              {goal.tipo}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{goal.estado}</Badge>
                            {goal.estado !== "Completado" && goal.estado !== "Cancelado" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleTogglePause("goal", goal as any)}
                                title={goal.estado === "Activo" ? "Pausar" : "Reactivar"}
                              >
                                {goal.estado === "Activo" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingGoal(goal);
                                setShowGoalForm(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                if (confirm("¿Eliminar este objetivo?")) {
                                  deleteGoal.mutate(goal.objetivoId);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{saved.toFixed(2)}</span>
                          <span className="text-muted-foreground">
                            / {goal.importeObjetivo.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {progress.toFixed(1)}% del objetivo
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={() =>
                              setContributeTarget({
                                tipoDestino: "objetivo",
                                destinoId: goal.objetivoId,
                                reservaId: goal.objetivoId,
                                nombre: goal.nombre,
                              })
                            }
                          >
                            <ArrowDownLeft className="h-3 w-3" />
                            Aportar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "futuros" && (
        <>
          {loadingFutures && <LoadingState message="Cargando pagos futuros..." />}
          {errorFutures && (
            <ErrorState message={(futuresError as Error)?.message ?? "Error al cargar"} />
          )}
          {!loadingFutures && !errorFutures && (futures ?? []).length === 0 && (
            <EmptyState
              title="Sin pagos futuros"
              description="Planifica tus pagos futuros."
              type="empty"
            />
          )}
          {!loadingFutures && !errorFutures && futures && futures.length > 0 && (
            <div className="space-y-2">
              {futures.map((payment) => {
                const saved = effectiveBalance(
                  "pago_futuro",
                  payment.pagoId,
                  payment.saldoReservado,
                );
                const progress =
                  payment.importeObjetivo > 0
                    ? Math.min((saved / payment.importeObjetivo) * 100, 100)
                    : 0;
                return (
                  <Card key={payment.pagoId} className="overflow-hidden transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{payment.concepto}</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.categoria}
                              {payment.fechaVencimiento && ` · Vence: ${payment.fechaVencimiento}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {payment.estado && payment.estado !== "Activo" && (
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                payment.estado === "Pausado" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700",
                              )}>
                                {payment.estado}
                              </span>
                            )}
                            {payment.estado !== "Completado" && payment.estado !== "Cancelado" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleTogglePause("future", payment as any)}
                                title={payment.estado === "Activo" ? "Pausar" : "Reactivar"}
                              >
                                {payment.estado === "Activo" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingFuture(payment);
                                setShowFutureForm(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                if (confirm("¿Eliminar este pago futuro?")) {
                                  deleteFuture.mutate(payment.pagoId);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{saved.toFixed(2)}</span>
                          <span className="text-muted-foreground">
                            / {payment.importeObjetivo.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {progress.toFixed(1)}% · Aporte: {payment.aporteMensual.toFixed(2)}/mes
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={() =>
                              setContributeTarget({
                                tipoDestino: "pago_futuro",
                                destinoId: payment.pagoId,
                                reservaId: payment.pagoId,
                                nombre: payment.concepto,
                              })
                            }
                          >
                            <ArrowDownLeft className="h-3 w-3" />
                            Aportar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "aplazados" && (
        <>
          {loadingDeferred && <LoadingState message="Cargando pagos aplazados..." />}
          {errorDeferred && (
            <ErrorState message={(deferredError as Error)?.message ?? "Error al cargar"} />
          )}
          {!loadingDeferred && !errorDeferred && (deferred ?? []).length === 0 && (
            <EmptyState
              title="Sin pagos aplazados"
              description="Gestiona tus compras a plazos."
              type="empty"
            />
          )}
          {!loadingDeferred && !errorDeferred && deferred && deferred.length > 0 && (
            <div className="space-y-2">
              {deferred.map((payment) => {
                const progress =
                  payment.importeTotal > 0
                    ? (payment.importePagado / payment.importeTotal) * 100
                    : 0;
                return (
                  <Card key={payment.aplazadoId} className="overflow-hidden transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{payment.concepto}</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.categoria}
                              {payment.fechaFin && ` · Fin: ${payment.fechaFin}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{payment.estado}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingDeferred(payment);
                                setShowDeferredForm(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                if (confirm("¿Eliminar este pago aplazado?")) {
                                  deleteDeferred.mutate(payment.aplazadoId);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{payment.importePagado.toFixed(2)} pagado</span>
                          <span className="text-muted-foreground">
                            / {payment.importeTotal.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {progress.toFixed(1)}% · Cuota: {payment.cuotaMensual.toFixed(2)}/mes
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "fijos" && (
        <>
          {loadingFixed && <LoadingState message="Cargando gastos fijos..." />}
          {errorFixed && (
            <ErrorState message={(fixedError as Error)?.message ?? "Error al cargar"} />
          )}
          {!loadingFixed && !errorFixed && (fixed ?? []).length === 0 && (
            <EmptyState
              title="Sin gastos fijos"
              description="Añade tus gastos recurrentes."
              type="empty"
            />
          )}
          {!loadingFixed && !errorFixed && fixed && fixed.length > 0 && (
            <div className="space-y-2">
              {fixed.map((expense) => (
                <Card key={expense.fijoId} className="overflow-hidden transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{expense.concepto}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.categoria} · {expense.frecuencia}
                          {expense.diaCargo && ` · Día ${expense.diaCargo}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-expense">
                          {expense.importe.toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingFixed(expense);
                            setShowFixedForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (confirm("¿Eliminar este gasto fijo?")) {
                              deleteFixed.mutate(expense.fijoId);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={showReserveForm} onOpenChange={setShowReserveForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingReserve ? "Editar reserva" : "Nueva reserva"}
            </DialogTitle>
          </DialogHeader>
          <ReserveForm
            sheetId={sheetId}
            initialData={editingReserve ?? undefined}
            onSuccess={() => {
              setShowReserveForm(false);
              setEditingReserve(null);
            }}
            onCancel={() => {
              setShowReserveForm(false);
              setEditingReserve(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showGoalForm} onOpenChange={setShowGoalForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Editar objetivo" : "Nuevo objetivo"}
            </DialogTitle>
          </DialogHeader>
          <GoalForm
            sheetId={sheetId}
            initialData={editingGoal ?? undefined}
            onSuccess={() => {
              setShowGoalForm(false);
              setEditingGoal(null);
            }}
            onCancel={() => {
              setShowGoalForm(false);
              setEditingGoal(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showFutureForm} onOpenChange={setShowFutureForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFuture ? "Editar pago futuro" : "Nuevo pago futuro"}
            </DialogTitle>
          </DialogHeader>
          <FuturePaymentForm
            sheetId={sheetId}
            initialData={editingFuture ?? undefined}
            onSuccess={() => {
              setShowFutureForm(false);
              setEditingFuture(null);
            }}
            onCancel={() => {
              setShowFutureForm(false);
              setEditingFuture(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDeferredForm} onOpenChange={setShowDeferredForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDeferred ? "Editar pago aplazado" : "Nuevo pago aplazado"}
            </DialogTitle>
          </DialogHeader>
          <DeferredPaymentForm
            sheetId={sheetId}
            initialData={editingDeferred ?? undefined}
            onSuccess={() => {
              setShowDeferredForm(false);
              setEditingDeferred(null);
            }}
            onCancel={() => {
              setShowDeferredForm(false);
              setEditingDeferred(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showFixedForm} onOpenChange={setShowFixedForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFixed ? "Editar gasto fijo" : "Nuevo gasto fijo"}
            </DialogTitle>
          </DialogHeader>
          <FixedExpenseForm
            sheetId={sheetId}
            initialData={editingFixed ?? undefined}
            onSuccess={() => {
              setShowFixedForm(false);
              setEditingFixed(null);
            }}
            onCancel={() => {
              setShowFixedForm(false);
              setEditingFixed(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewingMovements}
        onOpenChange={(open) => !open && setViewingMovements(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Movimientos de reserva</DialogTitle>
          </DialogHeader>
          {viewingMovements && (
            <ReserveMovements
              reservaId={viewingMovements.id}
              reservaNombre={viewingMovements.nombre}
              onClose={() => setViewingMovements(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!contributeTarget}
        onOpenChange={(open) => !open && setContributeTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo movimiento</DialogTitle>
          </DialogHeader>
          {contributeTarget && (
            <SavingsMovementForm
              sheetId={sheetId}
              tipoDestino={contributeTarget.tipoDestino}
              destinoId={contributeTarget.destinoId}
              reservaId={contributeTarget.reservaId}
              destinoNombre={contributeTarget.nombre}
              onSuccess={() => setContributeTarget(null)}
              onCancel={() => setContributeTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
