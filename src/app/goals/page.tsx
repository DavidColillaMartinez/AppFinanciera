"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useReserves, useDeleteReserve } from "@/features/reserves/hooks/use-reserves";
import { useGoals, useDeleteGoal } from "@/features/goals/hooks/use-goals";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { ReserveForm } from "@/features/reserves/components/reserve-form";
import { GoalForm } from "@/features/goals/components/goal-form";
import { ReserveMovements } from "@/features/reserve-movements/components/reserve-movements-list";
import { Pencil, Trash2, Plus, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReserveRow } from "@/types/models";
import type { GoalRow } from "@/types/models";

export default function GoalsPage() {
  const { sheetId } = useAppStore();
  const [activeTab, setActiveTab] = useState<"reservas" | "objetivos">(
    "reservas",
  );

  const [showReserveForm, setShowReserveForm] = useState(false);
  const [editingReserve, setEditingReserve] = useState<ReserveRow | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalRow | null>(null);
  const [viewingMovements, setViewingMovements] = useState<{ id: string; nombre: string } | null>(null);

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
  const deleteReserve = useDeleteReserve(sheetId);
  const deleteGoal = useDeleteGoal(sheetId);

  const isLoading = activeTab === "reservas" ? loadingReserves : loadingGoals;
  const isError = activeTab === "reservas" ? errorReserves : errorGoals;
  const errorMsg = (
    activeTab === "reservas" ? reservesError : goalsError
  ) as Error | null;

  function handleEditReserve(reserve: ReserveRow) {
    setEditingReserve(reserve);
    setShowReserveForm(true);
  }

  function handleEditGoal(goal: GoalRow) {
    setEditingGoal(goal);
    setShowGoalForm(true);
  }

  function handleDeleteReserve(reservaId: string) {
    if (confirm("¿Eliminar esta reserva?")) {
      deleteReserve.mutate(reservaId);
    }
  }

  function handleDeleteGoal(objetivoId: string) {
    if (confirm("¿Eliminar este objetivo?")) {
      deleteGoal.mutate(objetivoId);
    }
  }

  function closeReserveForm() {
    setShowReserveForm(false);
    setEditingReserve(null);
  }

  function closeGoalForm() {
    setShowGoalForm(false);
    setEditingGoal(null);
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Reservas y Objetivos
        </h1>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            if (activeTab === "reservas") {
              setEditingReserve(null);
              setShowReserveForm(true);
            } else {
              setEditingGoal(null);
              setShowGoalForm(true);
            }
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("reservas")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "reservas"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Reservas
        </button>
        <button
          onClick={() => setActiveTab("objetivos")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "objetivos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Objetivos
        </button>
      </div>

      {isLoading && <LoadingState message="Cargando..." />}

      {isError && (
        <ErrorState message={errorMsg?.message ?? "Error al cargar"} />
      )}

      {!isLoading &&
        !isError &&
        activeTab === "reservas" &&
        (reserves ?? []).length === 0 && (
          <EmptyState
            title="Sin reservas"
            description="Aqui apareceran tus reservas de emergencia."
            type="empty"
          />
        )}

      {!isLoading &&
        !isError &&
        activeTab === "objetivos" &&
        (goals ?? []).length === 0 && (
          <EmptyState
            title="Sin objetivos"
            description="Aqui apareceran tus objetivos de ahorro."
            type="empty"
          />
        )}

      {!isLoading &&
        !isError &&
        activeTab === "reservas" &&
        reserves &&
        reserves.length > 0 && (
          <div className="space-y-2">
            {reserves.map((reserve) => {
              const progress =
                reserve.importeObjetivo > 0
                  ? (reserve.saldoActual / reserve.importeObjetivo) * 100
                  : 0;

              return (
                <Card key={reserve.reservaId}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {reserve.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reserve.tipo}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{reserve.prioridad}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditReserve(reserve)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteReserve(reserve.reservaId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{reserve.saldoActual.toFixed(2)}</span>
                        <span className="text-muted-foreground">
                          / {reserve.importeObjetivo.toFixed(2)}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {progress.toFixed(1)}% · Aporte sugerido:{" "}
                          {reserve.aporteMensualSugerido.toFixed(2)}/mes
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() =>
                            setViewingMovements({
                              id: reserve.reservaId,
                              nombre: reserve.nombre,
                            })
                          }
                        >
                          <History className="h-3 w-3" />
                          Mov.
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      {!isLoading &&
        !isError &&
        activeTab === "objetivos" &&
        goals &&
        goals.length > 0 && (
          <div className="space-y-2">
            {goals.map((goal) => {
              const progress =
                goal.importeObjetivo > 0
                  ? (goal.saldoActual / goal.importeObjetivo) * 100
                  : 0;

              return (
                <Card key={goal.objetivoId}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{goal.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {goal.fechaObjetivo &&
                              `Fecha objetivo: ${goal.fechaObjetivo} · `}
                            {goal.tipo}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{goal.estado}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditGoal(goal)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteGoal(goal.objetivoId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{goal.saldoActual.toFixed(2)}</span>
                        <span className="text-muted-foreground">
                          / {goal.importeObjetivo.toFixed(2)}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {progress.toFixed(1)}% del objetivo
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
            onSuccess={closeReserveForm}
            onCancel={closeReserveForm}
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
            onSuccess={closeGoalForm}
            onCancel={closeGoalForm}
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
    </div>
  );
}
