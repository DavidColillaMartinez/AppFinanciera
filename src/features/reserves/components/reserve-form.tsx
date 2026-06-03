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
import { useCreateReserve, useUpdateReserve } from "../hooks/use-reserves";
import type { ReserveRow } from "@/types/models";
import { ReserveType, Priority, GenericStatus } from "@/constants/enums";
import { SavingsDifficultyBadge, estimateRequiredMonthly } from "@/components/savings/difficulty-badge";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { Clock, CalendarDays } from "lucide-react";

const reserveCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  tipo: z.enum([
    ReserveType.IMPREVISTOS,
    ReserveType.EMERGENCIA,
    ReserveType.PAGO_FUTURO,
    ReserveType.OBJETIVO,
    ReserveType.OTRO,
  ]),
  importeObjetivo: z.number().min(0, "El importe debe ser positivo"),
  saldoActual: z.number().min(0).optional(),
  aporteMensualSugerido: z.number().min(0).optional(),
  cuentaFisica: z.string().optional(),
  prioridad: z.enum([Priority.ALTA, Priority.MEDIA, Priority.BAJA]).optional(),
  estado: z.enum([GenericStatus.ACTIVO, GenericStatus.PAUSADO, GenericStatus.COMPLETADO, GenericStatus.CANCELADO]).optional(),
  fechaInicio: z.string().optional(),
  fechaObjetivo: z.string().optional(),
  notas: z.string().optional(),
});

type ReserveCreateInput = z.infer<typeof reserveCreateSchema>;

const reserveTypes = [
  { value: ReserveType.EMERGENCIA, label: "Emergencia" },
  { value: ReserveType.IMPREVISTOS, label: "Imprevistos" },
  { value: ReserveType.PAGO_FUTURO, label: "Pago futuro" },
  { value: ReserveType.OBJETIVO, label: "Objetivo" },
  { value: ReserveType.OTRO, label: "Otro" },
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

interface ReserveFormProps {
  sheetId: string | null;
  initialData?: ReserveRow;
  onSuccess?: () => void;
  onCancel?: () => void;
  availableCapacity?: number;
}

export function ReserveForm({
  sheetId,
  initialData,
  onSuccess,
  onCancel,
  availableCapacity: externalCapacity,
}: ReserveFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createReserve = useCreateReserve(sheetId);
  const updateReserve = useUpdateReserve(sheetId);
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
  } = useForm<ReserveCreateInput>({
    resolver: zodResolver(reserveCreateSchema),
    defaultValues: initialData
      ? {
          nombre: initialData.nombre,
          tipo: initialData.tipo,
          importeObjetivo: initialData.importeObjetivo,
          saldoActual: initialData.saldoActual,
          aporteMensualSugerido: initialData.aporteMensualSugerido,
          cuentaFisica: initialData.cuentaFisica,
          prioridad: initialData.prioridad,
          estado: initialData.estado,
          fechaInicio: initialData.fechaInicio,
          fechaObjetivo: initialData.fechaObjetivo,
          notas: initialData.notas,
        }
      : {
          nombre: "",
          tipo: ReserveType.EMERGENCIA,
          importeObjetivo: 0,
          saldoActual: 0,
          aporteMensualSugerido: 0,
          cuentaFisica: "",
          prioridad: Priority.MEDIA,
          estado: GenericStatus.ACTIVO,
          fechaInicio: today,
          fechaObjetivo: "",
          notas: "",
        },
  });

  const importeObjetivoVal = watch("importeObjetivo");
  const saldoActualVal = watch("saldoActual") ?? 0;
  const fechaObjetivoVal = watch("fechaObjetivo");
  const fechaInicioVal = watch("fechaInicio");

  const requiredMonthly = useMemo(
    () => estimateRequiredMonthly(importeObjetivoVal, saldoActualVal, fechaObjetivoVal ?? ""),
    [importeObjetivoVal, saldoActualVal, fechaObjetivoVal],
  );

  const monthsRemaining = useMemo(() => {
    if (!fechaObjetivoVal) return 0;
    const now = new Date();
    const target = new Date(fechaObjetivoVal as string);
    return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth());
  }, [fechaObjetivoVal]);

  const futureStart = Boolean(
    fechaInicioVal && fechaInicioVal.slice(0, 7) > today.slice(0, 7),
  );

  async function onSubmit(data: ReserveCreateInput) {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateReserve.mutateAsync({
          reservaId: initialData.reservaId,
          ...data,
        } as Parameters<typeof updateReserve.mutateAsync>[0]);
      } else {
        await createReserve.mutateAsync(data as Parameters<typeof createReserve.mutateAsync>[0]);
      }
      reset();
      onSuccess?.();
    } catch (e) {
      console.error("Error saving reserve:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? "Editar reserva" : "Nueva reserva"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="Nombre de la reserva"
              className="h-11"
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                id="tipo"
                options={reserveTypes}
                value={watch("tipo") ?? ReserveType.EMERGENCIA}
                onChange={(e) =>
                  setValue("tipo", e.target.value as ReserveCreateInput["tipo"])
                }
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select
                id="prioridad"
                options={priorities}
                value={watch("prioridad") ?? Priority.MEDIA}
                onChange={(e) =>
                  setValue("prioridad", e.target.value as ReserveCreateInput["prioridad"])
                }
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                id="estado"
                options={estadoOptions}
                value={watch("estado") ?? GenericStatus.ACTIVO}
                onChange={(e) =>
                  setValue("estado", e.target.value as ReserveCreateInput["estado"])
                }
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                className="h-11"
                {...register("fechaInicio")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaObjetivo">Fecha objetivo</Label>
              <Input
                id="fechaObjetivo"
                type="date"
                className="h-11"
                {...register("fechaObjetivo")}
              />
            </div>
          </div>

          {fechaObjetivoVal && monthsRemaining > 0 && (
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
                Esta reserva comienza en {fechaInicioVal}. No se incluira en el plan mensual hasta entonces.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="importeObjetivo">Importe objetivo</Label>
              <Input
                id="importeObjetivo"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="h-11"
                {...register("importeObjetivo", { valueAsNumber: true })}
              />
              {errors.importeObjetivo && (
                <p className="text-xs text-destructive">
                  {errors.importeObjetivo.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="saldoActual">Saldo actual</Label>
              <Input
                id="saldoActual"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="h-11"
                {...register("saldoActual", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="aporteMensualSugerido">Aporte mensual sugerido</Label>
              <Input
                id="aporteMensualSugerido"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="h-11"
                {...register("aporteMensualSugerido", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuentaFisica">Cuenta fisica</Label>
              <Input
                id="cuentaFisica"
                placeholder="Opcional"
                className="h-11"
                {...register("cuentaFisica")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Input
              id="notas"
              placeholder="Opcional"
              className="h-11"
              {...register("notas")}
            />
          </div>

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
