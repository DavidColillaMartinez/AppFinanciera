"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  transactionCreateSchema,
  type TransactionCreateInput,
} from "@/schemas/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionType } from "@/constants/enums";
import { useState } from "react";
import { useCreateTransaction } from "../hooks/use-transactions";

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
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({
  sheetId,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTransaction = useCreateTransaction(sheetId);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionCreateInput>({
    resolver: zodResolver(transactionCreateSchema),
    defaultValues: {
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
    },
  });

  const selectedType = watch("tipo");

  async function onSubmit(data: TransactionCreateInput) {
    setIsSubmitting(true);
    try {
      await createTransaction.mutateAsync(
        data as Parameters<typeof createTransaction.mutateAsync>[0],
      );
      reset();
      onSuccess?.();
    } catch (e) {
      console.error("Error creating transaction:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuevo movimiento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" {...register("fecha")} />
            {errors.fecha && (
              <p className="text-xs text-destructive">{errors.fecha.message}</p>
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
              <p className="text-xs text-destructive">{errors.tipo.message}</p>
            )}
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
            <Input
              id="categoria"
              placeholder="Nombre de la categoria"
              {...register("categoria")}
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

          <div className="space-y-2">
            <Label htmlFor="metodo">Metodo de pago</Label>
            <Input id="metodo" placeholder="Opcional" {...register("metodo")} />
          </div>

          {(selectedType === "Gasto" ||
            selectedType === "Ahorro" ||
            selectedType === "Transferencia interna") && (
            <div className="space-y-2">
              <Label htmlFor="cuentaOrigen">Cuenta origen</Label>
              <Input
                id="cuentaOrigen"
                placeholder="Nombre de la cuenta"
                {...register("cuentaOrigen")}
              />
            </div>
          )}

          {(selectedType === "Ingreso" ||
            selectedType === "Transferencia interna") && (
            <div className="space-y-2">
              <Label htmlFor="cuentaDestino">Cuenta destino</Label>
              <Input
                id="cuentaDestino"
                placeholder="Nombre de la cuenta"
                {...register("cuentaDestino")}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Input id="notas" placeholder="Opcional" {...register("notas")} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
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
