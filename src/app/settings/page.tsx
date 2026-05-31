"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryForm } from "@/features/categories/components/category-form";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { PlusIcon } from "lucide-react";

export default function SettingsPage() {
  const { sheetId } = useAppStore();
  const [showForm, setShowForm] = useState(false);

  const {
    data: categories,
    isLoading,
    isError,
    error,
  } = useCategories(sheetId);

  const filteredCategories = categories ?? [];

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Nueva
        </Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-base font-semibold mb-3">Categorias</h2>

            {showForm && (
              <div className="mb-4">
                <CategoryForm
                  sheetId={sheetId}
                  onSuccess={() => setShowForm(false)}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            )}

            <div className="space-y-2">
              {isLoading && <LoadingState message="Cargando categorias..." />}

              {isError && (
                <ErrorState
                  message={(error as Error)?.message ?? "Error al cargar"}
                />
              )}

              {!isLoading && !isError && filteredCategories.length === 0 && (
                <EmptyState
                  title="Sin categorias"
                  description="Añade categorias para organizar tus movimientos."
                  type="empty"
                />
              )}

              {!isLoading && !isError && filteredCategories.length > 0 && (
                <div className="space-y-2">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.categoriaId}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {cat.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{cat.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {cat.grupo && `${cat.grupo} · `}
                            Presupuesto:{" "}
                            {Number(cat.presupuestoMensual).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          cat.tipoHabitual === "Ingreso" ? "success" : "outline"
                        }
                      >
                        {cat.tipoHabitual}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
