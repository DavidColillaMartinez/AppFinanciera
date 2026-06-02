"use client";

import { useState } from "react";
import { useReserveMovements, useDeleteReserveMovement } from "@/features/reserve-movements/hooks/use-reserve-movements";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReserveMovementForm } from "@/features/reserve-movements/components/reserve-movement-form";
import { Pencil, Trash2, Plus, ArrowDownLeft, ArrowUpRight, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReserveMovementRow } from "@/types/models";
import { TipoMovimientoReserva } from "@/constants/enums";
import { cn } from "@/lib/utils";

interface ReserveMovementsProps {
  reservaId: string;
  reservaNombre: string;
  onClose: () => void;
}

export function ReserveMovements({
  reservaId,
  reservaNombre,
  onClose,
}: ReserveMovementsProps) {
  const { sheetId } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingMovement, setEditingMovement] =
    useState<ReserveMovementRow | null>(null);

  const {
    data: movements,
    isLoading,
    isError,
    error,
  } = useReserveMovements(sheetId, reservaId);
  const deleteMovement = useDeleteReserveMovement(sheetId);

  function handleEdit(movement: ReserveMovementRow) {
    setEditingMovement(movement);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (confirm("¿Eliminar este movimiento?")) {
      deleteMovement.mutate(id);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingMovement(null);
  }

  const totalAportaciones = (movements ?? [])
    .filter((m) => m.tipoMovimiento === TipoMovimientoReserva.APORTE)
    .reduce((acc, m) => acc + m.importe, 0);

  const totalDisposiciones = (movements ?? [])
    .filter((m) => m.tipoMovimiento === TipoMovimientoReserva.RETIRADA)
    .reduce((acc, m) => acc + m.importe, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{reservaNombre}</h2>
          <p className="text-sm text-muted-foreground">Movimientos de reserva</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Movimiento
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-income/10 p-2">
                <ArrowDownLeft className="h-4 w-4 text-income" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Aportaciones
                </p>
                <p className="text-lg font-bold text-income">
                  +{totalAportaciones.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-expense/10 p-2">
                <ArrowUpRight className="h-4 w-4 text-expense" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Disposiciones
                </p>
                <p className="text-lg font-bold text-expense">
                  -{totalDisposiciones.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && <LoadingState message="Cargando movimientos..." />}

      {isError && (
        <ErrorState message={(error as Error)?.message ?? "Error al cargar"} />
      )}

      {!isLoading && !isError && (movements ?? []).length === 0 && (
        <EmptyState
          title="Sin movimientos"
          description="Esta reserva aun no tiene movimientos."
          type="empty"
        />
      )}

      {!isLoading &&
        !isError &&
        movements &&
        movements.length > 0 && (
          <div className="space-y-2">
            {movements.map((movement) => (
              <Card
                key={movement.id}
                className="overflow-hidden transition-all hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "rounded-lg p-2",
                          movement.tipoMovimiento ===
                            TipoMovimientoReserva.APORTE
                            ? "bg-income/10"
                            : "bg-expense/10",
                        )}
                      >
                        {movement.tipoMovimiento ===
                        TipoMovimientoReserva.APORTE ? (
                          <ArrowDownLeft className="h-4 w-4 text-income" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-expense" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {movement.tipoMovimiento ===
                            TipoMovimientoReserva.APORTE
                              ? "Aporte"
                              : "Retirada"}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {movement.fecha}
                          </Badge>
                        </div>
                        {(movement.cuentaOrigen || movement.cuentaDestino) && (
                          <p className="text-xs text-muted-foreground">
                            {movement.cuentaOrigen &&
                              `Desde: ${movement.cuentaOrigen}`}
                            {movement.cuentaOrigen &&
                              movement.cuentaDestino &&
                              " → "}
                            {movement.cuentaDestino &&
                              `Hacia: ${movement.cuentaDestino}`}
                          </p>
                        )}
                        {movement.notas && (
                          <p className="text-xs text-muted-foreground italic">
                            {movement.notas}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-lg font-bold",
                          movement.tipoMovimiento ===
                            TipoMovimientoReserva.APORTE
                            ? "text-income"
                            : "text-expense",
                        )}
                      >
                        {movement.tipoMovimiento ===
                        TipoMovimientoReserva.APORTE
                          ? "+"
                          : "-"}
                        {movement.importe.toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(movement)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(movement.id)}
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMovement
                ? "Editar movimiento"
                : "Nuevo movimiento de reserva"}
            </DialogTitle>
          </DialogHeader>
          <ReserveMovementForm
            sheetId={sheetId}
            reservaId={reservaId}
            initialData={editingMovement ?? undefined}
            onSuccess={closeForm}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
