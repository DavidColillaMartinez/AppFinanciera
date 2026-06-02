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
  useCreateReserveMovement,
  useUpdateReserveMovement,
} from "../hooks/use-reserve-movements";
import type { ReserveMovementRow } from "@/types/models";
import { TipoMovimientoReserva } from "@/constants/enums";

const reserveMovementSchema = z.object({
  tipoMovimiento: z.enum([
    TipoMovimientoReserva.APORTE,
    TipoMovimientoReserva.RETIRADA,
  ] as const),
  importe: z.number().min(0.01, "El importe debe ser positivo"),
  cuentaOrigen: z.string().optional(),
  cuentaDestino: z.string().optional(),
  notas: z.string().optional(),
});

type ReserveMovementInput = z.infer<typeof reserveMovementSchema>;

const movementTypes = [
  {
    value: TipoMovimientoReserva.APORTE,
    label: "Aporte (entrada)",
  },
  {
    value: TipoMovimientoReserva.RETIRADA,
    label: "Retirada (salida)",
  },
];

interface ReserveMovementFormProps {
  sheetId: string | null;
  reservaId: string;
  initialData?: ReserveMovementRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReserveMovementForm({
  sheetId,
  reservaId,
  initialData,
  onSuccess,
  onCancel,
}: ReserveMovementFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMovement = useCreateReserveMovement(sheetId);
  const updateMovement = useUpdateReserveMovement(sheetId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReserveMovementInput>({
    resolver: zodResolver(reserveMovementSchema),
    defaultValues: initialData
      ? {
          tipoMovimiento:
            initialData.tipoMovimiento === TipoMovimientoReserva.RETIRADA
              ? TipoMovimientoReserva.RETIRADA
              : TipoMovimientoReserva.APORTE,
          importe: initialData.importe,
          cuentaOrigen: initialData.cuentaOrigen,
          cuentaDestino: initialData.cuentaDestino,
          notas: initialData.notas,
        }
      : {
          tipoMovimiento: TipoMovimientoReserva.APORTE,
          importe: 0,
          cuentaOrigen: "",
          cuentaDestino: "",
          notas: "",
        },
  });

  async function onSubmit(data: ReserveMovementInput) {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateMovement.mutateAsync({
          id: initialData.id,
          ...data,
        } as Parameters<typeof updateMovement.mutateAsync>[0]);
      } else {
        await createMovement.mutateAsync({
          reservaId,
          ...data,
        } as Parameters<typeof createMovement.mutateAsync>[0]);
      }
      reset();
      onSuccess?.();
    } catch (e) {
      console.error("Error saving reserve movement:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing
            ? "Editar movimiento"
            : "Nuevo movimiento de reserva"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tipoMovimiento">Tipo</Label>
              <Select
                id="tipoMovimiento"
                options={movementTypes}
                value={watch("tipoMovimiento") ?? TipoMovimientoReserva.APORTE}
                onChange={(e) =>
                  setValue(
                    "tipoMovimiento",
                    e.target.value as ReserveMovementInput["tipoMovimiento"],
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="importe">Importe</Label>
              <Input
                id="importe"
                type="number"
                step="0.01"
                min="0.01"
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cuentaOrigen">Cuenta origen</Label>
              <Input
                id="cuentaOrigen"
                placeholder="Opcional"
                {...register("cuentaOrigen")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuentaDestino">Cuenta destino</Label>
              <Input
                id="cuentaDestino"
                placeholder="Opcional"
                {...register("cuentaDestino")}
              />
            </div>
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
