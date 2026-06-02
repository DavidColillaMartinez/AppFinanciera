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
  { value: CategoryType.AHORRO, label: "Ahorro" },
];

interface CategoryFormProps {
  sheetId: string | null;
  initialData?: CategoryRow;
  onSuccess?: () => void;
  onCancel?: () => void;
  onValidate?: (name: string, excludeId?: string) => boolean;
}

export function CategoryForm({
  sheetId,
  initialData,
  onSuccess,
  onCancel,
  onValidate,
}: CategoryFormProps) {
  const isEditing = !!initialData?.categoriaId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
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
    setSubmitError(null);
    setLocalError(null);

    if (onValidate && !onValidate(data.nombre, initialData?.categoriaId)) {
      return;
    }

    setIsSubmitting(true);
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(submitError || localError) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {localError || submitError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="Nombre de la categoria"
              className="h-11"
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
                className="h-11"
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
                className="h-11"
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
              <Input
                id="grupo"
                placeholder="Opcional"
                className="h-11"
                {...register("grupo")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                type="color"
                id="color"
                className="h-11"
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
            <Input
              id="icono"
              placeholder="Opcional"
              className="h-11"
              {...register("icono")}
            />
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
