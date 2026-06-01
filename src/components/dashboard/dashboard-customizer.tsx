"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  BarChart3,
  PieChart,
  TrendingUp,
  LayoutGrid,
  Palette,
  Gauge,
} from "lucide-react";

const WIDGET_LABELS: Record<string, string> = {
  balance: "Balance mensual",
  savings: "Tasa de ahorro",
  income: "Ingresos",
  expenses: "Gastos",
  chart: "Grafico de gastos",
  detail: "Detalle de movimientos",
  savingsPlan: "Plan de ahorro",
};

const CHART_TYPES = [
  { value: "categories", label: "Por categorias", icon: PieChart },
  { value: "expenses", label: "Gastos fijos", icon: BarChart3 },
  { value: "savings", label: "Ahorros", icon: TrendingUp },
];

const WIDGET_COLORS = [
  { id: "blue", label: "Azul", class: "bg-blue-500" },
  { id: "green", label: "Verde", class: "bg-emerald-500" },
  { id: "purple", label: "Morado", class: "bg-purple-500" },
  { id: "pink", label: "Rosa", class: "bg-pink-500" },
  { id: "orange", label: "Naranja", class: "bg-orange-500" },
  { id: "teal", label: "Teal", class: "bg-teal-500" },
];

interface DashboardCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardCustomizer({
  open,
  onOpenChange,
}: DashboardCustomizerProps) {
  const {
    dashboardConfig,
    toggleWidget,
    moveWidget,
    resetDashboardConfig,
    setDashboardConfig,
  } = useAppStore();

  const widgets = dashboardConfig.widgets;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Personalizar Dashboard
          </DialogTitle>
          <DialogDescription>
            Configura los widgets, graficos y apariencia de tu dashboard.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="widgets" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="widgets" className="gap-1.5 text-xs">
              <LayoutGrid className="h-3.5 w-3.5" />
              Widgets
            </TabsTrigger>
            <TabsTrigger value="chart" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              Grafico
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 text-xs">
              <Palette className="h-3.5 w-3.5" />
              Estilo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="widgets" className="space-y-3 py-4">
            <p className="text-xs text-muted-foreground mb-2">
              Activa o desactiva widgets y reordenalos arrastrando
            </p>
            {widgets.map((widget, index) => (
              <div
                key={widget.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3 transition-all",
                  widget.visible
                    ? "border-primary/30 bg-primary/5"
                    : "border-transparent opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={widget.visible}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                  <Label
                    className="text-sm font-medium cursor-pointer"
                    onClick={() => toggleWidget(widget.id)}
                  >
                    {WIDGET_LABELS[widget.id] ?? widget.id}
                  </Label>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => moveWidget(widget.id, "up")}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === widgets.length - 1}
                    onClick={() => moveWidget(widget.id, "down")}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="chart" className="space-y-3 py-4">
            <p className="text-xs text-muted-foreground mb-3">
              Selecciona que datos quieres ver en el grafico circular
            </p>
            <div className="space-y-2">
              {CHART_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() =>
                      setDashboardConfig({
                        chartType: type.value as "categories" | "expenses" | "savings",
                      })
                    }
                    className={`w-full flex items-center gap-3 rounded-lg border p-4 transition-all ${
                      dashboardConfig.chartType === type.value
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "hover:bg-muted border-transparent"
                    }`}
                  >
                    <div
                      className={cn(
                        "rounded-lg p-2",
                        dashboardConfig.chartType === type.value
                          ? "bg-primary/20"
                          : "bg-muted"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          dashboardConfig.chartType === type.value
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {type.value === "categories"
                          ? "Muestra gastos por categoria"
                          : type.value === "expenses"
                            ? "Muestra tus gastos fijos mensuales"
                            : "Muestra tus movimientos de ahorro"}
                      </p>
                    </div>
                    {dashboardConfig.chartType === type.value && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 py-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Color de acento
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Elige un color para remarcar elementos importantes
                </p>
                <div className="flex gap-2">
                  {WIDGET_COLORS.map((color) => (
                    <button
                      key={color.id}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all ring-2 ring-offset-2",
                        color.class,
                        color.id === "blue" ? "ring-blue-500" : `ring-${color.id}`
                      )}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-sm font-medium mb-2 block">Intensidad</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Que tan marcados quieres los colores de los widgets
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    Suave
                  </Button>
                  <Button variant="default" size="sm" className="flex-1 text-xs">
                    Normal
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    Intenso
                  </Button>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-sm font-medium mb-2 block">
                  Mostrar selector de mes
                </Label>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Permite cambiar entre meses en el dashboard
                  </p>
                  <Switch
                    checked={dashboardConfig.monthSelectorVisible}
                    onCheckedChange={(checked) =>
                      setDashboardConfig({ monthSelectorVisible: checked })
                    }
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-sm font-medium mb-2 block">Animaciones</Label>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Animaciones suaves al cargar los widgets
                  </p>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetDashboardConfig}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Aplicar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}