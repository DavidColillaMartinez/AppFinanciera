"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryForm } from "@/features/categories/components/category-form";
import {
  useCategories,
  useDeleteCategory,
  useUpdateCategory,
} from "@/features/categories/hooks/use-categories";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { PlusIcon, PencilIcon, TrashIcon, Tag } from "lucide-react";
import type { CategoryRow } from "@/types/models";

export default function SettingsPage() {
  const { sheetId } = useAppStore();
  const [activeTab, setActiveTab] = useState<"categorias" | "preferencias">(
    "categorias",
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    data: categories,
    isLoading,
    isError,
    error,
  } = useCategories(sheetId);
  const deleteCategory = useDeleteCategory(sheetId);

  const editingCategory = editingId
    ? (categories ?? []).find((c) => c.categoriaId === editingId)
    : null;

  async function handleDelete(categoriaId: string) {
    if (!confirm("Desactivar esta categoria?")) return;
    try {
      await deleteCategory.mutateAsync(categoriaId);
    } catch (e) {
      console.error("Error:", e);
    }
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("categorias")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "categorias"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Categorias
        </button>
        <button
          onClick={() => setActiveTab("preferencias")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "preferencias"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Preferencias
        </button>
      </div>

      {activeTab === "categorias" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingId(null);
                setShowForm(!showForm);
              }}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Nueva
            </Button>
          </div>

          {showForm && !editingId && (
            <CategoryForm
              sheetId={sheetId}
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          )}

          {editingId && editingCategory && (
            <CategoryForm
              sheetId={sheetId}
              initialData={editingCategory}
              onSuccess={() => {
                setEditingId(null);
                setShowForm(false);
              }}
              onCancel={() => setEditingId(null)}
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
                    Las categorias te ayudan a organizar tus movimientos.
                    <br />
                    Empieza creando algunas como: Comida, Transporte, Ocio, Nomina...
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setShowForm(true);
                  }}
                  className="gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Crear primera categoria
                </Button>
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
      )}

      {activeTab === "preferencias" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-base font-semibold">Informacion</h2>
              <p className="text-sm text-muted-foreground">
                La configuracion de moneda y cuenta predeterminada se guardara
                en tu Google Sheet cuando este disponible.
              </p>
              <p className="text-sm text-muted-foreground">
                Version de la app: 1.0.0
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
