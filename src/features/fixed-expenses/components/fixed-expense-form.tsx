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
import { useCreateFixedExpense, useUpdateFixedExpense } from "../hooks/use-fixed-expenses";
import type { FixedExpenseRow } from "@/types/models";
import { Frequency } from "@/constants/enums";

const fixedExpenseSchema = z.object({
  concepto: z.string().min(1, "El concepto es obligatorio"),
  categoria: z.string().min(1, "La categoria es obligatoria"),
  importe: z.number().min(0, "El importe debe ser positivo"),
  frecuencia: z.enum([
    Frequency.MENSUAL,
    Frequency.ANUAL,
    Frequency.TRIMESTRAL,
    Frequency.UNICO,
  ]),
  diaCargo: z.number().min(1).max(31).optional(),
  cuentaOrigen: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  notas: z.string().optional(),
});

type FixedExpenseInput = z.infer<typeof fixedExpenseSchema>;

const frequencyOptions = [
  { value: Frequency.MENSUAL, label: "Mensual" },
  { value: Frequency.ANUAL, label: "Anual" },
  { value: Frequency.TRIMESTRAL, label: "Trimestral" },
  { value: Frequency.UNICO, label: "Unico" },
];

interface FixedExpenseFormProps {
  sheetId: string | null;
  initialData?: FixedExpenseRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FixedExpenseForm({
  sheetId,
  initialData,
  onSuccess,
  onCancel,
}: FixedExpenseFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createFixedExpense = useCreateFixedExpense(sheetId);
  const updateFixedExpense = useUpdateFixedExpense(sheetId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FixedExpenseInput>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: initialData
      ? {
          concepto: initialData.concepto,
          categoria: initialData.categoria,
          importe: initialData.importe,
          frecuencia: initialData.frecuencia,
          diaCargo: initialData.diaCargo,
          cuentaOrigen: initialData.cuentaOrigen,
          fechaInicio: initialData.fechaInicio,
          fechaFin: initialData.fechaFin,
          notas: initialData.notas,
        }
      : {
          concepto: "",
          categoria: "",
          importe: 0,
          frecuencia: Frequency.MENSUAL,
          diaCargo: 1,
          cuentaOrigen: "",
          fechaInicio: "",
          fechaFin: "",
          notas: "",
        },
  });

  async function onSubmit(data: FixedExpenseInput) {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateFixedExpense.mutateAsync({
          fijoId: initialData.fijoId,
          ...data,
        } as Parameters<typeof updateFixedExpense.mutateAsync>[0]);
      } else {
        await createFixedExpense.mutateAsync(
          data as Parameters<typeof createFixedExpense.mutateAsync>[0],
        );
      }
      reset();
      onSuccess?.();
    } catch (e) {
      console.error("Error saving fixed expense:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? "Editar gasto fijo" : "Nuevo gasto fijo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto</Label>
            <Input
              id="concepto"
              placeholder="Nombre del gasto"
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
                placeholder="Ej: Servicios"
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="frecuencia">Frecuencia</Label>
              <Select
                id="frecuencia"
                options={frequencyOptions}
                value={watch("frecuencia") ?? Frequency.MENSUAL}
                onChange={(e) =>
                  setValue("frecuencia", e.target.value as FixedExpenseInput["frecuencia"])
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diaCargo">Dia de cargo</Label>
              <Input
                id="diaCargo"
                type="number"
                min="1"
                max="31"
                placeholder="1"
                {...register("diaCargo", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuentaOrigen">Cuenta origen</Label>
            <Input
              id="cuentaOrigen"
              placeholder="Opcional"
              {...register("cuentaOrigen")}
            />
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
