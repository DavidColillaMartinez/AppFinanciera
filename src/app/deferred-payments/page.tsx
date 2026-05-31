"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useDeferredPayments,
  useDeleteDeferredPayment,
} from "@/features/deferred-payments/hooks/use-deferred-payments";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { DeferredPaymentForm } from "@/features/deferred-payments/components/deferred-payment-form";
import { Pencil, Trash2, Plus, Scissors } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InstallmentPaymentRow } from "@/types/models";
import { cn } from "@/lib/utils";

const estadoLabels: Record<string, string> = {
  Activo: "Activo",
  Completado: "Completado",
  Cancelado: "Cancelado",
  Pausado: "Pausado",
};

export default function DeferredPaymentsPage() {
  const { sheetId } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] =
    useState<InstallmentPaymentRow | null>(null);

  const {
    data: payments,
    isLoading,
    isError,
    error,
  } = useDeferredPayments(sheetId);
  const deletePayment = useDeleteDeferredPayment(sheetId);

  const activePayments = (payments ?? []).filter(
    (p) => p.estado === "Activo",
  );
  const totalPendiente = activePayments.reduce(
    (acc, p) => acc + (p.importeTotal - p.importePagado),
    0,
  );
  const totalCuotas = activePayments.reduce(
    (acc, p) => acc + p.cuotaMensual,
    0,
  );

  function handleEdit(payment: InstallmentPaymentRow) {
    setEditingPayment(payment);
    setShowForm(true);
  }

  function handleDelete(aplazadoId: string) {
    if (confirm("¿Eliminar este pago aplazado?")) {
      deletePayment.mutate(aplazadoId);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingPayment(null);
  }

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pagos Aplazados</h1>
          <p className="text-sm text-muted-foreground">
            Compras y pagos en cuotas
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            setEditingPayment(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pendiente total
            </p>
            <p className="text-2xl font-bold tracking-tight text-expense">
              {totalPendiente.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Cuotas mensuales
            </p>
            <p className="text-2xl font-bold tracking-tight text-warning">
              {totalCuotas.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading && <LoadingState message="Cargando pagos aplazados..." />}

      {isError && (
        <ErrorState message={(error as Error)?.message ?? "Error al cargar"} />
      )}

      {!isLoading && !isError && (payments ?? []).length === 0 && (
        <EmptyState
          title="Sin pagos aplazados"
          description="Aqui apareceran tus compras a plazos."
          type="empty"
        />
      )}

      {!isLoading &&
        !isError &&
        payments &&
        payments.length > 0 && (
          <div className="space-y-2">
            {payments.map((payment) => {
              const progress =
                payment.importeTotal > 0
                  ? Math.min(
                      (payment.importePagado / payment.importeTotal) * 100,
                      100,
                    )
                  : 0;

              return (
                <Card
                  key={payment.aplazadoId}
                  className={cn(
                    "overflow-hidden transition-all hover:shadow-md",
                    payment.estado !== "Activo" && "opacity-60",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {payment.concepto}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                payment.estado === "Activo" && "text-income",
                                payment.estado === "Completado" &&
                                  "text-savings",
                                payment.estado === "Cancelado" &&
                                  "text-expense",
                              )}
                            >
                              {estadoLabels[payment.estado] ?? payment.estado}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {payment.categoria}
                            {payment.cuentaOrigen &&
                              ` · ${payment.cuentaOrigen}`}
                            {payment.fechaFin && ` · Fin: ${payment.fechaFin}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(payment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(payment.aplazadoId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-income">
                          {payment.importePagado.toFixed(2)} pagado
                        </span>
                        <span className="text-muted-foreground">
                          / {payment.importeTotal.toFixed(2)}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{progress.toFixed(1)}%</span>
                        <span>
                          Cuota: {payment.cuotaMensual.toFixed(2)}/mes
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPayment
                ? "Editar pago aplazado"
                : "Nuevo pago aplazado"}
            </DialogTitle>
          </DialogHeader>
          <DeferredPaymentForm
            sheetId={sheetId}
            initialData={editingPayment ?? undefined}
            onSuccess={closeForm}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
