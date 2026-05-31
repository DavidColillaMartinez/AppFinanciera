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
import { useCreateCategory, useUpdateCategory } from "../hooks/use-categories";
import type { CategoryRow } from "@/types/models";

const categoryTypes = [
  { value: CategoryType.INGRESO, label: "Ingreso" },
  { value: CategoryType.GASTO, label: "Gasto" },
];

interface CategoryFormProps {
  sheetId: string | null;
  initialData?: CategoryRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({
  sheetId,
  initialData,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createCategory = useCreateCategory(sheetId);
  const updateCategory = useUpdateCategory(sheetId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryCreateInput>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: initialData
      ? {
          nombre: initialData.nombre,
          presupuestoMensual: initialData.presupuestoMensual,
          tipoHabitual: initialData.tipoHabitual,
          grupo: initialData.grupo,
          color: initialData.color,
          icono: initialData.icono,
          orden: initialData.orden,
          notas: initialData.notas,
        }
      : {
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
    setSubmitError(null);
    try {
      if (isEditing && initialData) {
        await updateCategory.mutateAsync({
          ...data,
          categoriaId: initialData.categoriaId,
        } as Parameters<typeof updateCategory.mutateAsync>[0]);
      } else {
        await createCategory.mutateAsync(
          data as Parameters<typeof createCategory.mutateAsync>[0],
        );
      }
      reset();
      onSuccess?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al guardar";
      setSubmitError(message);
      console.error("Error saving category:", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? "Editar categoria" : "Nueva categoria"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submitError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {submitError}
          </div>
        )}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tipoHabitual">Tipo</Label>
              <Select
                id="tipoHabitual"
                options={categoryTypes}
                value={watch("tipoHabitual") ?? CategoryType.GASTO}
                onChange={(e) =>
                  setValue("tipoHabitual", e.target.value as CategoryType)
                }
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="grupo">Grupo</Label>
              <Input id="grupo" placeholder="Opcional" {...register("grupo")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                type="color"
                id="color"
                className="h-10"
                {...register("color")}
              />
              {errors.color && (
                <p className="text-xs text-destructive">
                  {errors.color.message}
                </p>
              )}
            </div>
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
