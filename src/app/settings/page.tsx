"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryForm } from "@/features/categories/components/category-form";
import {
  useCategories,
  useDeleteCategory,
  useSeedDefaultCategories,
  checkDuplicateCategory,
} from "@/features/categories/hooks/use-categories";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { PlusIcon, PencilIcon, TrashIcon, Tag, Sparkles, Settings } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { CategoryRow } from "@/types/models";

export default function SettingsPage() {
  const { sheetId } = useAppStore();
  const { success, error: showError } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    data: categories,
    isLoading,
    isError,
    error,
  } = useCategories(sheetId);
  const deleteCategory = useDeleteCategory(sheetId);
  const seedCategories = useSeedDefaultCategories(sheetId);

  const editingCategory = editingId
    ? (categories ?? []).find((c) => c.categoriaId === editingId)
    : null;

  async function handleDelete(categoriaId: string) {
    if (!confirm("Desactivar esta categoria?")) return;
    try {
      await deleteCategory.mutateAsync(categoriaId);
      success("Categoria desactivada correctamente");
    } catch (e) {
      showError("Error al desactivar la categoria");
    }
  }

  async function handleSeedCategories() {
    if (!confirm("Crear categorias predefinidas? Esto no duplicara categorias existentes.")) return;

    try {
      const result = await seedCategories.mutateAsync(categories ?? []);
      if (result.skipped) {
        success("Ya tienes categorias creadas");
      } else {
        success(`${result.created} categorias creadas correctamente`);
      }
    } catch (e) {
      showError("Error al crear las categorias predefinidas");
    }
  }

  function handleCategoryValidation(name: string, excludeId?: string) {
    if (!name.trim()) {
      setValidationError("El nombre no puede estar vacio");
      return false;
    }
    if (checkDuplicateCategory(categories ?? [], name, excludeId)) {
      setValidationError("Ya existe una categoria con ese nombre");
      return false;
    }
    setValidationError(null);
    return true;
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
        <a
          href="/settings/preferencias"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Preferencias
        </a>
      </div>

      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedCategories}
            disabled={seedCategories.isPending}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Crear categorias predefinidas
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
              setValidationError(null);
            }}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Nueva
          </Button>
        </div>

        {validationError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {validationError}
          </div>
        )}

        {showForm && !editingId && (
          <CategoryForm
            sheetId={sheetId}
            onSuccess={() => {
              setShowForm(false);
              setValidationError(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setValidationError(null);
            }}
            onValidate={handleCategoryValidation}
          />
        )}

        {editingId && editingCategory && (
          <CategoryForm
            sheetId={sheetId}
            initialData={editingCategory}
            onSuccess={() => {
              setEditingId(null);
              setShowForm(false);
              setValidationError(null);
            }}
            onCancel={() => {
              setEditingId(null);
              setValidationError(null);
            }}
            onValidate={handleCategoryValidation}
          />
        )}

        {isLoading && <LoadingState message="Cargando categorias..." />}

        {isError && (
          <ErrorState
            message={(error as Error)?.message ?? "Error al cargar"}
          />
        )}

        {!isLoading && !isError && (categories ?? []).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Tag className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Sin categorias</h3>
                <p className="text-sm text-muted-foreground">
                  Crea categorias para organizar tus movimientos.
                  <br />
                  Puedes usar las predefinidas o crear las tuyas propias.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSeedCategories}
                  disabled={seedCategories.isPending}
                  variant="outline"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Usar categorias predefinidas
                </Button>
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setShowForm(true);
                  }}
                  className="gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Crear mi primera categoria
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && (categories ?? []).length > 0 && (
          <div className="space-y-2">
            {(categories ?? []).map((cat) => (
              <div
                key={cat.categoriaId}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  {cat.color && (
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{cat.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.grupo && `${cat.grupo} · `}
                      Presupuesto: {Number(cat.presupuestoMensual).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      cat.tipoHabitual === "Ingreso" ? "success" : "outline"
                    }
                  >
                    {cat.tipoHabitual}
                  </Badge>
                  <button
                    onClick={() => {
                      setEditingId(cat.categoriaId);
                      setShowForm(false);
                      setValidationError(null);
                    }}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <PencilIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.categoriaId)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}