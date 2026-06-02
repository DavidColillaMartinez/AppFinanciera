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
  useCreateFuturePayment,
  useUpdateFuturePayment,
} from "../hooks/use-future-payments";
import type { FuturePaymentRow } from "@/types/models";

const futurePaymentSchema = z.object({
  concepto: z.string().min(1, "El concepto es obligatorio"),
  categoria: z.string().min(1, "La categoria es obligatoria"),
  importeObjetivo: z.number().min(0, "El importe debe ser positivo"),
  fechaVencimiento: z.string().optional(),
  frecuencia: z.string().optional(),
  cuentaReserva: z.string().optional(),
  notas: z.string().optional(),
});

type FuturePaymentInput = z.infer<typeof futurePaymentSchema>;

const frequencyOptions = [
  { value: "Mensual", label: "Mensual" },
  { value: "Trimestral", label: "Trimestral" },
  { value: "Anual", label: "Anual" },
  { value: "Unico", label: "Unico" },
];

interface FuturePaymentFormProps {
  sheetId: string | null;
  initialData?: FuturePaymentRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FuturePaymentForm({
  sheetId,
  initialData,
  onSuccess,
  onCancel,
}: FuturePaymentFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createFuturePayment = useCreateFuturePayment(sheetId);
  const updateFuturePayment = useUpdateFuturePayment(sheetId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FuturePaymentInput>({
    resolver: zodResolver(futurePaymentSchema),
    defaultValues: initialData
      ? {
          concepto: initialData.concepto,
          categoria: initialData.categoria,
          importeObjetivo: initialData.importeObjetivo,
          fechaVencimiento: initialData.fechaVencimiento,
          frecuencia: initialData.frecuencia,
          cuentaReserva: initialData.cuentaReserva,
          notas: initialData.notas,
        }
      : {
          concepto: "",
          categoria: "",
          importeObjetivo: 0,
          fechaVencimiento: "",
          frecuencia: "Mensual",
          cuentaReserva: "",
          notas: "",
        },
  });

  async function onSubmit(data: FuturePaymentInput) {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateFuturePayment.mutateAsync({
          pagoId: initialData.pagoId,
          ...data,
        } as Parameters<typeof updateFuturePayment.mutateAsync>[0]);
      } else {
        await createFuturePayment.mutateAsync(
          data as Parameters<typeof createFuturePayment.mutateAsync>[0],
        );
      }
      reset();
      onSuccess?.();
    } catch (e) {
      console.error("Error saving future payment:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? "Editar pago futuro" : "Nuevo pago futuro"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto</Label>
            <Input
              id="concepto"
              placeholder="Ej: Viaje de vacaciones"
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
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                placeholder="Ej: Ocio"
                {...register("categoria")}
              />
              {errors.categoria && (
                <p className="text-xs text-destructive">
                  {errors.categoria.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="importeObjetivo">Importe objetivo</Label>
              <Input
                id="importeObjetivo"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("importeObjetivo", { valueAsNumber: true })}
              />
              {errors.importeObjetivo && (
                <p className="text-xs text-destructive">
                  {errors.importeObjetivo.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fechaVencimiento">Fecha vencimiento</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                {...register("fechaVencimiento")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frecuencia">Frecuencia</Label>
              <Select
                id="frecuencia"
                options={frequencyOptions}
                value={watch("frecuencia") ?? "Mensual"}
                onChange={(e) => setValue("frecuencia", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuentaReserva">Cuenta de reserva</Label>
            <Input
              id="cuentaReserva"
              placeholder="Opcional"
              {...register("cuentaReserva")}
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
