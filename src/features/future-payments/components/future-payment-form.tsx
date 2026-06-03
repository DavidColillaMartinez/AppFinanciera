"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo } from "react";
import {
  useCreateFuturePayment,
  useUpdateFuturePayment,
} from "../hooks/use-future-payments";
import type { FuturePaymentRow } from "@/types/models";
import { GenericStatus, Priority } from "@/constants/enums";
import { SavingsDifficultyBadge, estimateRequiredMonthly } from "@/components/savings/difficulty-badge";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { Clock, CalendarDays } from "lucide-react";

const futurePaymentSchema = z.object({
  concepto: z.string().min(1, "El concepto es obligatorio"),
  categoria: z.string().min(1, "La categoria es obligatoria"),
  importeObjetivo: z.number().min(0, "El importe debe ser positivo"),
  fechaVencimiento: z.string().optional(),
  frecuencia: z.string().optional(),
  cuentaReserva: z.string().optional(),
  prioridad: z.enum([Priority.ALTA, Priority.MEDIA, Priority.BAJA]).optional(),
  estado: z.enum([GenericStatus.ACTIVO, GenericStatus.PAUSADO, GenericStatus.COMPLETADO, GenericStatus.CANCELADO]).optional(),
  fechaInicio: z.string().optional(),
  notas: z.string().optional(),
});

type FuturePaymentInput = z.infer<typeof futurePaymentSchema>;

const frequencyOptions = [
  { value: "Mensual", label: "Mensual" },
  { value: "Trimestral", label: "Trimestral" },
  { value: "Anual", label: "Anual" },
  { value: "Unico", label: "Unico" },
];

const priorities = [
  { value: Priority.ALTA, label: "Alta" },
  { value: Priority.MEDIA, label: "Media" },
  { value: Priority.BAJA, label: "Baja" },
];

const estadoOptions = [
  { value: GenericStatus.ACTIVO, label: "Activo" },
  { value: GenericStatus.PAUSADO, label: "Pausado" },
  { value: GenericStatus.COMPLETADO, label: "Completado" },
];

interface FuturePaymentFormProps {
  sheetId: string | null;
  initialData?: FuturePaymentRow;
  onSuccess?: () => void;
  onCancel?: () => void;
  availableCapacity?: number;
}

export function FuturePaymentForm({
  sheetId,
  initialData,
  onSuccess,
  onCancel,
  availableCapacity: externalCapacity,
}: FuturePaymentFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createFuturePayment = useCreateFuturePayment(sheetId);
  const updateFuturePayment = useUpdateFuturePayment(sheetId);
  const { summary } = useFinanceSummary({});
  const today = new Date().toISOString().split("T")[0];

  const capacidadAhorro = useMemo(() => {
    if (externalCapacity !== undefined) return externalCapacity;
    const a = summary.available;
    const obligaciones = a.variableExpenses + a.fixedExpensesConfirmed + a.fixedExpensesPending + a.deferredPayments + a.futurePaymentProvisions;
    return Math.max(0, a.income - obligaciones);
  }, [summary, externalCapacity]);

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
          prioridad: initialData.prioridad,
          estado: initialData.estado,
          fechaInicio: initialData.fechaInicio,
          notas: initialData.notas,
        }
      : {
          concepto: "",
          categoria: "",
          importeObjetivo: 0,
          fechaVencimiento: "",
          frecuencia: "Mensual",
          cuentaReserva: "",
          prioridad: Priority.MEDIA,
          estado: GenericStatus.ACTIVO,
          fechaInicio: today,
          notas: "",
        },
  });

  const importeObjetivoVal = watch("importeObjetivo");
  const fechaVencimientoVal = watch("fechaVencimiento");
  const fechaInicioVal = watch("fechaInicio");

  const requiredMonthly = useMemo(
    () => estimateRequiredMonthly(importeObjetivoVal, 0, fechaVencimientoVal ?? ""),
    [importeObjetivoVal, fechaVencimientoVal],
  );

  const monthsRemaining = useMemo(() => {
    if (!fechaVencimientoVal) return 0;
    const now = new Date();
    const target = new Date(fechaVencimientoVal as string);
    return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth());
  }, [fechaVencimientoVal]);

  const futureStart = Boolean(
    fechaInicioVal && fechaInicioVal.slice(0, 7) > today.slice(0, 7),
  );

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
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select
                id="prioridad"
                options={priorities}
                value={watch("prioridad") ?? Priority.MEDIA}
                onChange={(e) =>
                  setValue("prioridad", e.target.value as FuturePaymentInput["prioridad"])
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                id="estado"
                options={estadoOptions}
                value={watch("estado") ?? GenericStatus.ACTIVO}
                onChange={(e) =>
                  setValue("estado", e.target.value as FuturePaymentInput["estado"])
                }
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
              <Label htmlFor="fechaVencimiento">Fecha vencimiento</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                {...register("fechaVencimiento")}
              />
            </div>
          </div>

          {fechaVencimientoVal && monthsRemaining > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg bg-muted/50 p-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {monthsRemaining} mes{monthsRemaining !== 1 ? "es" : ""} restante
                {monthsRemaining !== 1 ? "s" : ""}.
                {requiredMonthly > 0 && (
                  <> Aporte necesario: <strong>{requiredMonthly.toFixed(2)} €/mes</strong>.</>
                )}
              </span>
            </div>
          )}

          {requiredMonthly > 0 && capacidadAhorro > 0 && (
            <SavingsDifficultyBadge
              requiredMonthly={requiredMonthly}
              availableCapacity={capacidadAhorro}
            />
          )}

          {futureStart && (
            <div className="flex items-center gap-2 text-xs text-amber-700 rounded-lg bg-amber-50 border border-amber-200 p-2">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span>
                Este pago comienza en {fechaInicioVal}. No se incluira en el plan mensual hasta entonces.
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="frecuencia">Frecuencia</Label>
            <Select
              id="frecuencia"
              options={frequencyOptions}
              value={watch("frecuencia") ?? "Mensual"}
              onChange={(e) => setValue("frecuencia", e.target.value)}
            />
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
