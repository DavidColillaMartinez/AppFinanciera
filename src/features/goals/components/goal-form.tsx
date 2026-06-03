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
import { useCreateGoal, useUpdateGoal } from "../hooks/use-goals";
import type { GoalRow } from "@/types/models";
import { GoalType, Priority, GenericStatus } from "@/constants/enums";
import { SavingsDifficultyBadge, DifficultyTag, estimateRequiredMonthly } from "@/components/savings/difficulty-badge";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { Clock, CalendarDays } from "lucide-react";

const goalCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  tipo: z.enum([
    GoalType.SEGURIDAD,
    GoalType.VACACIONES,
    GoalType.EMERGENCIA,
    GoalType.VEHICULO,
    GoalType.HOGAR,
    GoalType.OTRO,
  ]),
  importeObjetivo: z.number().min(0, "El importe debe ser positivo"),
  fechaInicio: z.string().optional(),
  fechaObjetivo: z.string().optional(),
  prioridad: z.enum([Priority.ALTA, Priority.MEDIA, Priority.BAJA]).optional(),
  estado: z.enum([GenericStatus.ACTIVO, GenericStatus.PAUSADO, GenericStatus.COMPLETADO, GenericStatus.CANCELADO]).optional(),
  cuentaAhorro: z.string().optional(),
  notas: z.string().optional(),
});

type GoalCreateInput = z.infer<typeof goalCreateSchema>;

const goalTypes = [
  { value: GoalType.SEGURIDAD, label: "Seguridad" },
  { value: GoalType.VACACIONES, label: "Vacaciones" },
  { value: GoalType.EMERGENCIA, label: "Emergencia" },
  { value: GoalType.VEHICULO, label: "Vehiculo" },
  { value: GoalType.HOGAR, label: "Hogar" },
  { value: GoalType.OTRO, label: "Otro" },
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

interface GoalFormProps {
  sheetId: string | null;
  initialData?: GoalRow;
  onSuccess?: () => void;
  onCancel?: () => void;
  availableCapacity?: number;
}

export function GoalForm({
  sheetId,
  initialData,
  onSuccess,
  onCancel,
  availableCapacity: externalCapacity,
}: GoalFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createGoal = useCreateGoal(sheetId);
  const updateGoal = useUpdateGoal(sheetId);
  const { summary } = useFinanceSummary({});
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

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
  } = useForm<GoalCreateInput>({
    resolver: zodResolver(goalCreateSchema),
    defaultValues: initialData
      ? {
          nombre: initialData.nombre,
          tipo: initialData.tipo,
          importeObjetivo: initialData.importeObjetivo,
          fechaInicio: initialData.fechaInicio,
          fechaObjetivo: initialData.fechaObjetivo,
          prioridad: initialData.prioridad,
          estado: initialData.estado,
          cuentaAhorro: initialData.cuentaAhorro,
          notas: initialData.notas,
        }
      : {
          nombre: "",
          tipo: GoalType.VACACIONES,
          importeObjetivo: 0,
          fechaInicio: today,
          fechaObjetivo: "",
          prioridad: Priority.MEDIA,
          estado: GenericStatus.ACTIVO,
          cuentaAhorro: "",
          notas: "",
        },
  });

  const importeObjetivoVal = watch("importeObjetivo");
  const fechaObjetivoVal = watch("fechaObjetivo");
  const fechaInicioVal = watch("fechaInicio");

  const requiredMonthly = useMemo(
    () => estimateRequiredMonthly(importeObjetivoVal, 0, fechaObjetivoVal ?? ""),
    [importeObjetivoVal, fechaObjetivoVal],
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

  async function onSubmit(data: GoalCreateInput) {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateGoal.mutateAsync({
          objetivoId: initialData.objetivoId,
          ...data,
        } as Parameters<typeof updateGoal.mutateAsync>[0]);
      } else {
        await createGoal.mutateAsync(data as Parameters<typeof createGoal.mutateAsync>[0]);
      }
      reset();
      onSuccess?.();
    } catch (e) {
      console.error("Error saving goal:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? "Editar objetivo" : "Nuevo objetivo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="Nombre del objetivo"
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
                options={goalTypes}
                value={watch("tipo") ?? GoalType.VACACIONES}
                onChange={(e) =>
                  setValue("tipo", e.target.value as GoalCreateInput["tipo"])
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select
                id="prioridad"
                options={priorities}
                value={watch("prioridad") ?? Priority.MEDIA}
                onChange={(e) =>
                  setValue("prioridad", e.target.value as GoalCreateInput["prioridad"])
                }
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
                  setValue("estado", e.target.value as GoalCreateInput["estado"])
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                {...register("fechaInicio")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label htmlFor="fechaObjetivo">Fecha objetivo</Label>
              <Input
                id="fechaObjetivo"
                type="date"
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
                {requiredMonthly > 0 && capacidadAhorro > 0 && (
                  <> <DifficultyTag requiredMonthly={requiredMonthly} availableCapacity={capacidadAhorro} /></>
                )}
              </span>
            </div>
          )}

          {!fechaObjetivoVal && importeObjetivoVal > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg bg-muted/50 p-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                Sin fecha objetivo. La app usara prioridad y capacidad disponible para sugerir el aporte mensual.
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
                Este objetivo comienza en {fechaInicioVal}. No se incluira en el plan mensual hasta entonces.
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cuentaAhorro">Cuenta de ahorro</Label>
            <Input
              id="cuentaAhorro"
              placeholder="Opcional"
              {...register("cuentaAhorro")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Input
              id="notas"
              placeholder="Opcional"
              {...register("notas")}
            />
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
