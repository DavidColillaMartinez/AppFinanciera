"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  transactionCreateSchema,
  transactionUpdateSchema,
  type TransactionCreateInput,
} from "@/schemas/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionType } from "@/constants/enums";
import { PAYMENT_METHOD_OPTIONS, PaymentMethod } from "@/constants/payment-methods";
import { useState } from "react";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "../hooks/use-transactions";
import type { TransactionRow, CategoryRow, AccountRow } from "@/types/models";
import { useToast } from "@/components/ui/toast";
import { FormField } from "@/components/forms/form-field";
import { cn } from "@/lib/utils";

const transactionTypes = [
  { value: TransactionType.INGRESO, label: "Ingreso" },
  { value: TransactionType.GASTO, label: "Gasto" },
  { value: TransactionType.AHORRO, label: "Ahorro" },
  { value: TransactionType.TRANSFERENCIA_INTERNA, label: "Transferencia" },
];

interface TransactionFormProps {
  sheetId: string | null;
  categories: CategoryRow[];
  accounts: AccountRow[];
  initialData?: TransactionRow;
  defaultType?: TransactionType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({
  sheetId,
  categories,
  accounts,
  initialData,
  defaultType,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const isEditing = !!initialData?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { success, error: showError } = useToast();
  const createTransaction = useCreateTransaction(sheetId);
  const updateTransaction = useUpdateTransaction(sheetId);

  const defaultValues: TransactionCreateInput = initialData && isEditing
    ? {
        fecha: initialData.fecha,
        concepto: initialData.concepto,
        tipo: initialData.tipo,
        categoria: initialData.categoria,
        importe: initialData.importe,
        metodo: initialData.metodo || "",
        cuentaOrigen: initialData.cuentaOrigen,
        cuentaDestino: initialData.cuentaDestino,
        notas: initialData.notas,
        reservaId: initialData.reservaId,
      }
    : {
        fecha: new Date().toISOString().split("T")[0],
        concepto: "",
        tipo: defaultType ?? TransactionType.GASTO,
        categoria: "",
        importe: 0,
        metodo: "",
        cuentaOrigen: "",
        cuentaDestino: "",
        notas: "",
        reservaId: "",
      };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      isEditing ? transactionUpdateSchema : transactionCreateSchema,
    ),
    defaultValues,
  });

  const selectedType = watch("tipo");
  const showPaymentMethod = selectedType !== TransactionType.INGRESO;
  const showCuentaOrigen = selectedType !== TransactionType.INGRESO;
  const showCuentaDestino = selectedType === TransactionType.TRANSFERENCIA_INTERNA;

  const categoryOptions = [
    { value: "", label: "Sin categoria" },
    ...categories.map((c) => ({ value: c.nombre, label: c.nombre })),
  ];

  const accountOptions = [
    { value: "", label: "Sin cuenta" },
    ...accounts.map((a) => ({
      value: a.nombre,
      label: `${a.nombre} (${a.tipo})`,
    })),
  ];

  async function onSubmit(data: Record<string, unknown>) {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateTransaction.mutateAsync({
          ...data,
          id: initialData.id,
          tipo: data.tipo as TransactionRow["tipo"],
        } as Parameters<typeof updateTransaction.mutateAsync>[0]);
        success("Movimiento actualizado correctamente");
      } else {
        await createTransaction.mutateAsync(
          data as unknown as Parameters<typeof createTransaction.mutateAsync>[0],
        );
        success("Movimiento creado correctamente");
      }
      reset(defaultValues);
      onSuccess?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al guardar";
      setSubmitError(message);
      showError("Error al guardar el movimiento");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-base">
          {isEditing ? "Editar movimiento" : "Nuevo movimiento"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {submitError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {submitError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha" htmlFor="fecha" error={errors.fecha}>
              <Input id="fecha" type="date" className="h-11" {...register("fecha")} />
            </FormField>

            <FormField label="Tipo" htmlFor="tipo" error={errors.tipo}>
              <Select
                id="tipo"
                options={transactionTypes}
                value={watch("tipo") ?? TransactionType.GASTO}
                onChange={(e) => setValue("tipo", e.target.value as TransactionType)}
                className="h-11"
              />
            </FormField>
          </div>

          <FormField label="Concepto" htmlFor="concepto" error={errors.concepto} required>
            <Input
              id="concepto"
              placeholder="Descripcion del movimiento"
              className="h-11"
              {...register("concepto")}
            />
          </FormField>

          <FormField label="Categoria" htmlFor="categoria" error={errors.categoria} required>
            <Select
              id="categoria"
              options={categoryOptions}
              value={watch("categoria") ?? ""}
              onChange={(e) => setValue("categoria", e.target.value)}
              className="h-11"
            />
          </FormField>

          <FormField label="Importe (€)" htmlFor="importe" error={errors.importe} required>
            <Input
              id="importe"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="h-11"
              {...register("importe", { valueAsNumber: true })}
            />
          </FormField>

          <div className={cn("grid gap-4", showPaymentMethod || showCuentaOrigen ? "grid-cols-2" : "grid-cols-1")}>
            {showPaymentMethod && (
              <FormField label="Metodo de pago" htmlFor="metodo" error={errors.metodo}>
                <Select
                  id="metodo"
                  options={PAYMENT_METHOD_OPTIONS}
                  value={watch("metodo") ?? ""}
                  onChange={(e) => setValue("metodo", e.target.value)}
                  className="h-11"
                />
              </FormField>
            )}

            {showCuentaOrigen && (
              <FormField label="Cuenta origen" htmlFor="cuentaOrigen" error={errors.cuentaOrigen}>
                <Select
                  id="cuentaOrigen"
                  options={accountOptions}
                  value={watch("cuentaOrigen") ?? ""}
                  onChange={(e) => setValue("cuentaOrigen", e.target.value)}
                  className="h-11"
                />
              </FormField>
            )}
          </div>

          {showCuentaDestino && (
            <FormField label="Cuenta destino" htmlFor="cuentaDestino" error={errors.cuentaDestino}>
              <Select
                id="cuentaDestino"
                options={accountOptions}
                value={watch("cuentaDestino") ?? ""}
                onChange={(e) => setValue("cuentaDestino", e.target.value)}
                className="h-11"
              />
            </FormField>
          )}

          <FormField label="Notas" htmlFor="notas" error={errors.notas}>
            <Input
              id="notas"
              placeholder="Opcional"
              className="h-11"
              {...register("notas")}
            />
          </FormField>

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-background border-t pt-4 -mx-4 px-4">
            <Button type="submit" className="flex-1 h-11" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : isEditing
                  ? "Actualizar"
                  : "Guardar"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="h-11">
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}