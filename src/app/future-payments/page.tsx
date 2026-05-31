"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useFuturePayments,
  useDeleteFuturePayment,
} from "@/features/future-payments/hooks/use-future-payments";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { FuturePaymentForm } from "@/features/future-payments/components/future-payment-form";
import { Pencil, Trash2, Plus, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FuturePaymentRow } from "@/types/models";
import { cn } from "@/lib/utils";

export default function FuturePaymentsPage() {
  const { sheetId } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<FuturePaymentRow | null>(
    null,
  );

  const {
    data: payments,
    isLoading,
    isError,
    error,
  } = useFuturePayments(sheetId);
  const deletePayment = useDeleteFuturePayment(sheetId);

  const totalObjetivo = (payments ?? []).reduce(
    (acc, p) => acc + p.importeObjetivo,
    0,
  );
  const totalReservado = (payments ?? []).reduce(
    (acc, p) => acc + p.saldoReservado,
    0,
  );

  function handleEdit(payment: FuturePaymentRow) {
    setEditingPayment(payment);
    setShowForm(true);
  }

  function handleDelete(pagoId: string) {
    if (confirm("¿Eliminar este pago futuro?")) {
      deletePayment.mutate(pagoId);
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
          <h1 className="text-2xl font-bold tracking-tight">Pagos Futuros</h1>
          <p className="text-sm text-muted-foreground">
            Objetivos de ahorro para pagos pendientes
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
              Total objetivo
            </p>
            <p className="text-2xl font-bold tracking-tight text-savings">
              {totalObjetivo.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Reservado
            </p>
            <p className="text-2xl font-bold tracking-tight text-income">
              {totalReservado.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading && <LoadingState message="Cargando pagos futuros..." />}

      {isError && (
        <ErrorState message={(error as Error)?.message ?? "Error al cargar"} />
      )}

      {!isLoading && !isError && (payments ?? []).length === 0 && (
        <EmptyState
          title="Sin pagos futuros"
          description="Aqui apareceran tus objetivos de ahorro para pagos."
          type="empty"
        />
      )}

      {!isLoading && !isError && payments && payments.length > 0 && (
        <div className="space-y-2">
          {payments.map((payment) => {
            const progress =
              payment.importeObjetivo > 0
                ? Math.min(
                    (payment.saldoReservado / payment.importeObjetivo) * 100,
                    100,
                  )
                : 0;

            return (
              <Card
                key={payment.pagoId}
                className="overflow-hidden transition-all hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {payment.concepto}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {payment.frecuencia}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {payment.categoria}
                          {payment.fechaVencimiento &&
                            ` · Vence: ${payment.fechaVencimiento}`}
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
                          onClick={() => handleDelete(payment.pagoId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{payment.saldoReservado.toFixed(2)}</span>
                      <span className="text-muted-foreground">
                        / {payment.importeObjetivo.toFixed(2)}
                      </span>
                    </div>
                    <Progress
                      value={progress}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress.toFixed(1)}%</span>
                      {payment.aporteMensual > 0 && (
                        <span>
                          Aporte: {payment.aporteMensual.toFixed(2)}/mes
                        </span>
                      )}
                      {payment.mesesRestantes > 0 && (
                        <span>{payment.mesesRestantes} meses restantes</span>
                      )}
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
              {editingPayment ? "Editar pago futuro" : "Nuevo pago futuro"}
            </DialogTitle>
          </DialogHeader>
          <FuturePaymentForm
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
