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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionType } from "@/constants/enums";
import { useState } from "react";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "../hooks/use-transactions";
import type { TransactionRow, CategoryRow, AccountRow } from "@/types/models";

const transactionTypes = [
  { value: TransactionType.INGRESO, label: "Ingreso" },
  { value: TransactionType.GASTO, label: "Gasto" },
  { value: TransactionType.AHORRO, label: "Ahorro" },
  {
    value: TransactionType.TRANSFERENCIA_INTERNA,
    label: "Transferencia interna",
  },
];

interface TransactionFormProps {
  sheetId: string | null;
  categories: CategoryRow[];
  accounts: AccountRow[];
  initialData?: TransactionRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({
  sheetId,
  categories,
  accounts,
  initialData,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTransaction = useCreateTransaction(sheetId);
  const updateTransaction = useUpdateTransaction(sheetId);

  const defaultValues: TransactionCreateInput = initialData
    ? {
        fecha: initialData.fecha,
        concepto: initialData.concepto,
        tipo: initialData.tipo,
        categoria: initialData.categoria,
        importe: initialData.importe,
        metodo: initialData.metodo,
        cuentaOrigen: initialData.cuentaOrigen,
        cuentaDestino: initialData.cuentaDestino,
        notas: initialData.notas,
        reservaId: initialData.reservaId,
      }
    : {
        fecha: new Date().toISOString().split("T")[0],
        concepto: "",
        tipo: TransactionType.GASTO,
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
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateTransaction.mutateAsync({
          ...data,
          id: initialData.id,
          tipo: data.tipo as TransactionRow["tipo"],
        } as Parameters<typeof updateTransaction.mutateAsync>[0]);
      } else {
        await createTransaction.mutateAsync(
          data as unknown as Parameters<typeof createTransaction.mutateAsync>[0],
        );
      }
      reset(defaultValues);
      onSuccess?.();
    } catch (e) {
      console.error("Error saving transaction:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? "Editar movimiento" : "Nuevo movimiento"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" {...register("fecha")} />
              {errors.fecha && (
                <p className="text-xs text-destructive">
                  {errors.fecha.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                id="tipo"
                options={transactionTypes}
                {...register("tipo")}
              />
              {errors.tipo && (
                <p className="text-xs text-destructive">
                  {errors.tipo.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto</Label>
            <Input
              id="concepto"
              placeholder="Descripcion del movimiento"
              {...register("concepto")}
            />
            {errors.concepto && (
              <p className="text-xs text-destructive">
                {errors.concepto.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              id="categoria"
              options={categoryOptions}
              value={watch("categoria") ?? ""}
              onChange={(e) => setValue("categoria", e.target.value)}
            />
            {errors.categoria && (
              <p className="text-xs text-destructive">
                {errors.categoria.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="importe">Importe</Label>
            <Input
              id="importe"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("importe", { valueAsNumber: true })}
            />
            {errors.importe && (
              <p className="text-xs text-destructive">
                {errors.importe.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="metodo">Metodo de pago</Label>
              <Input
                id="metodo"
                placeholder="Opcional"
                {...register("metodo")}
              />
            </div>

            {(selectedType === "Gasto" ||
              selectedType === "Ahorro" ||
              selectedType === "Transferencia interna") && (
              <div className="space-y-2">
                <Label htmlFor="cuentaOrigen">Cuenta origen</Label>
                <Select
                  id="cuentaOrigen"
                  options={accountOptions}
                  value={watch("cuentaOrigen") ?? ""}
                  onChange={(e) => setValue("cuentaOrigen", e.target.value)}
                />
              </div>
            )}
          </div>

          {(selectedType === "Ingreso" ||
            selectedType === "Transferencia interna") && (
            <div className="space-y-2">
              <Label htmlFor="cuentaDestino">Cuenta destino</Label>
              <Select
                id="cuentaDestino"
                options={accountOptions}
                value={watch("cuentaDestino") ?? ""}
                onChange={(e) => setValue("cuentaDestino", e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Input id="notas" placeholder="Opcional" {...register("notas")} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : isEditing
                  ? "Actualizar"
                  : "Guardar"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
