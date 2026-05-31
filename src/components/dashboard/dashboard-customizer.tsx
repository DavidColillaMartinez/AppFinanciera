"use client";

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
import { Settings, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";

const WIDGET_LABELS: Record<string, string> = {
  balance: "Balance mensual",
  savings: "Tasa de ahorro",
  income: "Ingresos",
  expenses: "Gastos",
  chart: "Gráfico de gastos",
  detail: "Detalle de gastos",
};

interface DashboardCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardCustomizer({
  open,
  onOpenChange,
}: DashboardCustomizerProps) {
  const { dashboardConfig, toggleWidget, moveWidget, resetDashboardConfig } =
    useAppStore();

  const widgets = dashboardConfig.widgets;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Personalizar dashboard
          </DialogTitle>
          <DialogDescription>
            Muestra u oculta widgets y organiza su orden.
          </DialogDescription>
        </DialogHeader>

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

        <div className="flex justify-between">
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
