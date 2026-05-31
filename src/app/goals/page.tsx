"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useReserves } from "@/features/reserves/hooks/use-reserves";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";

export default function GoalsPage() {
  const { sheetId } = useAppStore();
  const [activeTab, setActiveTab] = useState<"reservas" | "objetivos">(
    "reservas",
  );

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

  const isLoading = activeTab === "reservas" ? loadingReserves : loadingGoals;
  const isError = activeTab === "reservas" ? errorReserves : errorGoals;
  const errorMsg = (
    activeTab === "reservas" ? reservesError : goalsError
  ) as Error | null;

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Reservas y Objetivos
        </h1>
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
                        <Badge variant="outline">{reserve.prioridad}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{reserve.saldoActual.toFixed(2)}</span>
                        <span className="text-muted-foreground">
                          / {reserve.importeObjetivo.toFixed(2)}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {progress.toFixed(1)}% · Aporte sugerido:{" "}
                        {reserve.aporteMensualSugerido.toFixed(2)}/mes
                      </p>
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
                        <Badge variant="outline">{goal.estado}</Badge>
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
    </div>
  );
}
