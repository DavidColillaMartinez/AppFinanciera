"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import {
  useCreateDeferredPayment,
  useUpdateDeferredPayment,
} from "../hooks/use-deferred-payments";
import type { InstallmentPaymentRow } from "@/types/models";

const deferredPaymentSchema = z.object({
  concepto: z.string().min(1, "El concepto es obligatorio"),
  importeTotal: z.number().min(0, "El importe debe ser positivo"),
  cuotaMensual: z.number().min(0).optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  categoria: z.string().optional(),
  cuentaOrigen: z.string().optional(),
  notas: z.string().optional(),
});

type DeferredPaymentInput = z.infer<typeof deferredPaymentSchema>;

interface DeferredPaymentFormProps {
  sheetId: string | null;
  initialData?: InstallmentPaymentRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DeferredPaymentForm({
  sheetId,
  initialData,
  onSuccess,
  onCancel,
}: DeferredPaymentFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createDeferredPayment = useCreateDeferredPayment(sheetId);
  const updateDeferredPayment = useUpdateDeferredPayment(sheetId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DeferredPaymentInput>({
    resolver: zodResolver(deferredPaymentSchema),
    defaultValues: initialData
      ? {
          concepto: initialData.concepto,
          importeTotal: initialData.importeTotal,
          cuotaMensual: initialData.cuotaMensual,
          fechaInicio: initialData.fechaInicio,
          fechaFin: initialData.fechaFin,
          categoria: initialData.categoria,
          cuentaOrigen: initialData.cuentaOrigen,
          notas: initialData.notas,
        }
      : {
          concepto: "",
          importeTotal: 0,
          cuotaMensual: 0,
          fechaInicio: "",
          fechaFin: "",
          categoria: "",
          cuentaOrigen: "",
          notas: "",
        },
  });

  async function onSubmit(data: DeferredPaymentInput) {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateDeferredPayment.mutateAsync({
          aplazadoId: initialData.aplazadoId,
          ...data,
        } as Parameters<typeof updateDeferredPayment.mutateAsync>[0]);
      } else {
        await createDeferredPayment.mutateAsync(
          data as Parameters<typeof createDeferredPayment.mutateAsync>[0],
        );
      }
      reset();
      onSuccess?.();
    } catch (e) {
      console.error("Error saving deferred payment:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? "Editar pago aplazado" : "Nuevo pago aplazado"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto</Label>
            <Input
              id="concepto"
              placeholder="Ej: Compra a plazos"
              {...register("concepto")}
            />
            {errors.concepto && (
              <p className="text-xs text-destructive">
                {errors.concepto.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="importeTotal">Importe total</Label>
              <Input
                id="importeTotal"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("importeTotal", { valueAsNumber: true })}
              />
              {errors.importeTotal && (
                <p className="text-xs text-destructive">
                  {errors.importeTotal.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuotaMensual">Cuota mensual</Label>
              <Input
                id="cuotaMensual"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("cuotaMensual", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                {...register("fechaInicio")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha fin</Label>
              <Input id="fechaFin" type="date" {...register("fechaFin")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              placeholder="Opcional"
              {...register("categoria")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuentaOrigen">Cuenta origen</Label>
            <Input
              id="cuentaOrigen"
              placeholder="Opcional"
              {...register("cuentaOrigen")}
            />
          </div>

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
