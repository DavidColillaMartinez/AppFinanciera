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
import { useCreateReserve, useUpdateReserve } from "../hooks/use-reserves";
import type { ReserveRow } from "@/types/models";
import { ReserveType, Priority } from "@/constants/enums";

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

interface ReserveFormProps {
  sheetId: string | null;
  initialData?: ReserveRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReserveForm({
  sheetId,
  initialData,
  onSuccess,
  onCancel,
}: ReserveFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createReserve = useCreateReserve(sheetId);
  const updateReserve = useUpdateReserve(sheetId);

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
          notas: "",
        },
  });

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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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
