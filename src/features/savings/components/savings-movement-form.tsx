"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import {
  useCreateSavingsContribution,
  useCreateSavingsWithdrawal,
} from "@/features/savings/hooks/use-savings";
import { TipoMovimientoReserva } from "@/constants/enums";
import { generateMonthKey } from "@/lib/sheets/adapters";

const savingsMovementSchema = z.object({
  tipoMovimiento: z.enum([
    TipoMovimientoReserva.APORTE,
    TipoMovimientoReserva.RETIRADA,
  ]),
  importe: z.number().min(0.01, "El importe debe ser positivo"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  cuentaOrigen: z.string().optional(),
  cuentaDestino: z.string().optional(),
  notas: z.string().optional(),
});

type SavingsMovementInput = z.infer<typeof savingsMovementSchema>;

interface SavingsMovementFormProps {
  sheetId: string | null;
  tipoDestino: "reserva" | "objetivo" | "pago_futuro";
  destinoId: string;
  reservaId: string;
  destinoNombre: string;
  suggestedAmount?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SavingsMovementForm({
  sheetId,
  tipoDestino,
  destinoId,
  reservaId,
  destinoNombre,
  suggestedAmount,
  onSuccess,
  onCancel,
}: SavingsMovementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createContribution = useCreateSavingsContribution(sheetId);
  const createWithdrawal = useCreateSavingsWithdrawal(sheetId);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SavingsMovementInput>({
    resolver: zodResolver(savingsMovementSchema),
    defaultValues: {
      tipoMovimiento: TipoMovimientoReserva.APORTE,
      importe: suggestedAmount ?? 0,
      fecha: new Date().toISOString().split("T")[0],
      cuentaOrigen: "",
      cuentaDestino: "",
      notas: "",
    },
  });

  const tipo = watch("tipoMovimiento");

  async function onSubmit(data: SavingsMovementInput) {
    setIsSubmitting(true);
    try {
      if (data.tipoMovimiento === TipoMovimientoReserva.APORTE) {
        await createContribution.mutateAsync({
          tipoDestino,
          destinoId,
          reservaId,
          importe: data.importe,
          fecha: data.fecha,
          cuentaOrigen: data.cuentaOrigen,
          cuentaDestino: data.cuentaDestino,
          notas: data.notas,
        });
      } else {
        await createWithdrawal.mutateAsync({
          tipoDestino,
          destinoId,
          reservaId,
          importe: data.importe,
          fecha: data.fecha,
          cuentaOrigen: data.cuentaOrigen,
          cuentaDestino: data.cuentaDestino,
          notas: data.notas,
        });
      }
      reset();
      onSuccess?.();
    } catch (e) {
      console.error("Error saving movement:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{destinoNombre}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tipoMovimiento">Tipo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={tipo === TipoMovimientoReserva.APORTE ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setValue("tipoMovimiento", TipoMovimientoReserva.APORTE)}
                >
                  Aporte
                </Button>
                <Button
                  type="button"
                  variant={tipo === TipoMovimientoReserva.RETIRADA ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setValue("tipoMovimiento", TipoMovimientoReserva.RETIRADA)}
                >
                  Retirada
                </Button>
              </div>
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

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" {...register("fecha")} />
            {errors.fecha && (
              <p className="text-xs text-destructive">{errors.fecha.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <Input id="notas" placeholder="Opcional" {...register("notas")} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : tipo === TipoMovimientoReserva.APORTE
                  ? "Registrar aporte"
                  : "Registrar retirada"}
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

export { generateMonthKey };
