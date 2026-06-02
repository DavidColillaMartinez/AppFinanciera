"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFixedExpenses, useDeleteFixedExpense } from "@/features/fixed-expenses/hooks/use-fixed-expenses";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { FixedExpenseForm } from "@/features/fixed-expenses/components/fixed-expense-form";
import { Pencil, Trash2, Plus, Calendar, ChevronRight, CalendarCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FixedExpenseRow } from "@/types/models";
import { Frequency } from "@/constants/enums";

const frequencyLabels: Record<string, string> = {
  [Frequency.MENSUAL]: "Mensual",
  [Frequency.ANUAL]: "Anual",
  [Frequency.TRIMESTRAL]: "Trimestral",
  [Frequency.UNICO]: "Unico",
};

export default function FixedExpensesPage() {
  const { sheetId } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpenseRow | null>(null);

  const {
    data: expenses,
    isLoading,
    isError,
    error,
  } = useFixedExpenses(sheetId);
  const deleteExpense = useDeleteFixedExpense(sheetId);

  const totalMensual = (expenses ?? []).reduce((acc, exp) => {
    switch (exp.frecuencia) {
      case Frequency.MENSUAL:
        return acc + exp.importe;
      case Frequency.TRIMESTRAL:
        return acc + exp.importe / 3;
      case Frequency.ANUAL:
        return acc + exp.importe / 12;
      default:
        return acc;
    }
  }, 0);

  function handleEdit(expense: FixedExpenseRow) {
    setEditingExpense(expense);
    setShowForm(true);
  }

  function handleDelete(fijoId: string) {
    if (confirm("¿Eliminar este gasto fijo?")) {
      deleteExpense.mutate(fijoId);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingExpense(null);
  }

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos Fijos</h1>
          <p className="text-sm text-muted-foreground">
            Gastos recurrentes mensuales
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            setEditingExpense(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total mensual estimado
              </p>
              <p className="text-3xl font-bold tracking-tight text-expense">
                {totalMensual.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl bg-expense/10 p-3">
              <Calendar className="h-6 w-6 text-expense" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-0">
          <Link
            href="/fixed-expenses/confirm"
            className="flex items-center justify-between p-4 active:bg-muted/50"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/10 p-3">
                <CalendarCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Confirmar gastos del mes</p>
                <p className="text-xs text-muted-foreground">
                  Revisa y confirma los gastos fijos que corresponden a este mes
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      {isLoading && <LoadingState message="Cargando gastos fijos..." />}

      {isError && (
        <ErrorState message={(error as Error)?.message ?? "Error al cargar"} />
      )}

      {!isLoading &&
        !isError &&
        (expenses ?? []).length === 0 && (
          <EmptyState
            title="Sin gastos fijos"
            description="Aqui apareceran tus gastos recurrentes."
            type="empty"
          />
        )}

      {!isLoading &&
        !isError &&
        expenses &&
        expenses.length > 0 && (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <Card
                key={expense.fijoId}
                className="overflow-hidden transition-all hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{expense.concepto}</p>
                        <Badge variant="outline" className="text-xs">
                          {frequencyLabels[expense.frecuencia] ?? expense.frecuencia}
                        </Badge>
                        {expense.fechaFin && (
                          <Badge
                            variant="outline"
                            className="text-xs text-warning"
                          >
                            Fin: {expense.fechaFin}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {expense.categoria}
                        {expense.cuentaOrigen && ` · ${expense.cuentaOrigen}`}
                        {expense.diaCargo && ` · Dia ${expense.diaCargo}`}
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
                        onClick={() => handleEdit(expense)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(expense.fijoId)}
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
              {editingExpense ? "Editar gasto fijo" : "Nuevo gasto fijo"}
            </DialogTitle>
          </DialogHeader>
          <FixedExpenseForm
            sheetId={sheetId}
            initialData={editingExpense ?? undefined}
            onSuccess={closeForm}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
