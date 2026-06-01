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
import { Select } from "@/components/ui/select";
import { Settings, ArrowUp, ArrowDown, RotateCcw, BarChart3, PieChart, TrendingUp } from "lucide-react";

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

interface DashboardCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardCustomizer({
  open,
  onOpenChange,
}: DashboardCustomizerProps) {
  const { dashboardConfig, toggleWidget, moveWidget, resetDashboardConfig, setDashboardConfig } =
    useAppStore();

  const [activeSection, setActiveSection] = useState<"widgets" | "chart">("widgets");

  const widgets = dashboardConfig.widgets;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Personalizar Dashboard
          </DialogTitle>
          <DialogDescription>
            Configura los widgets y graficos que quieres ver.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={activeSection === "widgets" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("widgets")}
          >
            Widgets
          </Button>
          <Button
            variant={activeSection === "chart" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("chart")}
          >
            Tipo de Grafico
          </Button>
        </div>

        {activeSection === "widgets" && (
          <div className="space-y-3 py-4">
            {widgets.map((widget, index) => (
              <div
                key={widget.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={widget.visible}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                  <Label className="text-sm font-medium cursor-pointer"
                    onClick={() => toggleWidget(widget.id)}>
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
          </div>
        )}

        {activeSection === "chart" && (
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Selecciona que datos quieres ver en el grafico:
            </p>
            {CHART_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setDashboardConfig({ chartType: type.value as "categories" | "expenses" | "savings" })}
                  className={`w-full flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                    dashboardConfig.chartType === type.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-between pt-2 border-t">
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
            Listo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
