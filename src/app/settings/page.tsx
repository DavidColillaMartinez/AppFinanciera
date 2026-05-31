"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CategoryForm } from "@/features/categories/components/category-form";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useConfig } from "@/features/config/hooks/use-config";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { PlusIcon } from "lucide-react";

const CURRENCIES = [
  { value: "EUR", label: "Euro (EUR)" },
  { value: "USD", label: "Dolar (USD)" },
  { value: "GBP", label: "Libra (GBP)" },
  { value: "JPY", label: "Yen (JPY)" },
  { value: "MXN", label: "Peso Mexicano (MXN)" },
  { value: "ARS", label: "Peso Argentino (ARS)" },
];

export default function SettingsPage() {
  const { sheetId } = useAppStore();
  const [activeTab, setActiveTab] = useState<"categorias" | "preferencias">(
    "categorias",
  );
  const [showForm, setShowForm] = useState(false);

  const {
    data: categories,
    isLoading: loadingCategories,
    isError: errorCategories,
    error: categoriesError,
  } = useCategories(sheetId);

  const { data: accounts } = useAccounts(sheetId);

  const { data: config, isLoading: loadingConfig } = useConfig(sheetId);

  const filteredCategories = categories ?? [];

  const accountOptions = (accounts ?? []).map((a) => ({
    value: a.cuentaId,
    label: a.nombre,
  }));

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
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Nueva
            </Button>
          </div>

          {showForm && (
            <CategoryForm
              sheetId={sheetId}
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          )}

          {loadingCategories && (
            <LoadingState message="Cargando categorias..." />
          )}

          {errorCategories && (
            <ErrorState
              message={(categoriesError as Error)?.message ?? "Error al cargar"}
            />
          )}

          {!loadingCategories &&
            !errorCategories &&
            filteredCategories.length === 0 && (
              <EmptyState
                title="Sin categorias"
                description="Añade categorias para organizar tus movimientos."
                type="empty"
              />
            )}

          {!loadingCategories &&
            !errorCategories &&
            filteredCategories.length > 0 && (
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
      )}

      {activeTab === "preferencias" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-base font-semibold">
                Preferencias generales
              </h2>

              {loadingConfig ? (
                <LoadingState message="Cargando..." />
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda principal</Label>
                    <Select
                      id="currency"
                      options={CURRENCIES}
                      value={config?.MONEDA ?? "EUR"}
                      onChange={(e) => {
                        console.log("Currency changed:", e.target.value);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultAccount">
                      Cuenta predeterminada
                    </Label>
                    <Select
                      id="defaultAccount"
                      options={[
                        { value: "", label: "Ninguna" },
                        ...accountOptions,
                      ]}
                      value={config?.CUENTA_DEFAULT ?? ""}
                      onChange={(e) => {
                        console.log("Account changed:", e.target.value);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sheetId">ID de spreadsheet</Label>
                    <Input
                      id="sheetId"
                      value={sheetId ?? ""}
                      disabled
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Conecta tu hoja de calculo en la pagina de onboarding.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
