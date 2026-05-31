"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  categoryCreateSchema,
  type CategoryCreateInput,
} from "@/schemas/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryType } from "@/constants/enums";
import { useState } from "react";
import { useCreateCategory } from "../hooks/use-categories";

const categoryTypes = [
  { value: CategoryType.INGRESO, label: "Ingreso" },
  { value: CategoryType.GASTO, label: "Gasto" },
];

interface CategoryFormProps {
  sheetId: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({
  sheetId,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCategory = useCreateCategory(sheetId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryCreateInput>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: {
      nombre: "",
      presupuestoMensual: 0,
      tipoHabitual: CategoryType.GASTO,
      grupo: "",
      color: "#3B82F6",
      icono: "",
      orden: 0,
      notas: "",
    },
  });

  async function onSubmit(data: CategoryCreateInput) {
    setIsSubmitting(true);
    try {
      await createCategory.mutateAsync(
        data as Parameters<typeof createCategory.mutateAsync>[0],
      );
      reset();
      onSuccess?.();
    } catch (e) {
      console.error("Error creating category:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nueva categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="Nombre de la categoria"
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-xs text-destructive">
                {errors.nombre.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoHabitual">Tipo</Label>
            <Select
              id="tipoHabitual"
              options={categoryTypes}
              {...register("tipoHabitual")}
            />
            {errors.tipoHabitual && (
              <p className="text-xs text-destructive">
                {errors.tipoHabitual.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="presupuestoMensual">Presupuesto mensual</Label>
            <Input
              id="presupuestoMensual"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("presupuestoMensual", { valueAsNumber: true })}
            />
            {errors.presupuestoMensual && (
              <p className="text-xs text-destructive">
                {errors.presupuestoMensual.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="grupo">Grupo</Label>
            <Input id="grupo" placeholder="Opcional" {...register("grupo")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input id="color" type="color" {...register("color")} />
            {errors.color && (
              <p className="text-xs text-destructive">{errors.color.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="icono">Icono</Label>
            <Input id="icono" placeholder="Opcional" {...register("icono")} />
          </div>

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
