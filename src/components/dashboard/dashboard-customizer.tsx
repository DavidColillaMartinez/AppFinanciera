"use client";

import { useState } from "react";
import { useAppStore, type ChartType, type ChartDataSource, type DashboardChart } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  X,
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

const CHART_TYPES: { value: ChartType; label: string; icon: typeof BarChart3 }[] = [
  { value: "bar", label: "Barras", icon: BarChart3 },
  { value: "pie", label: "Circular", icon: PieChart },
  { value: "area", label: "Area", icon: TrendingUp },
  { value: "line", label: "Lineas", icon: TrendingUp },
];

const DATA_SOURCES: { value: ChartDataSource; label: string }[] = [
  { value: "categories", label: "Gastos por categoria" },
  { value: "expenses", label: "Gastos fijos" },
  { value: "savings", label: "Ahorros" },
  { value: "income", label: "Ingresos" },
  { value: "total", label: "Total de gastos" },
  { value: "fixed", label: "Gastos fijos mensuales" },
  { value: "deferred", label: "Pagos aplazados" },
  { value: "future", label: "Pagos futuros" },
];

const CHART_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

interface DashboardCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ChartEditorStep = "list" | "name" | "style";

interface ChartEditorState {
  step: ChartEditorStep;
  editingChartId: string | null;
  name: string;
  type: ChartType;
  dataSource: ChartDataSource;
  accentColor: string;
  animations: boolean;
  showLabels: boolean;
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
    addChart,
    updateChart,
    removeChart,
  } = useAppStore();

  const widgets = dashboardConfig.widgets;

  const [editor, setEditor] = useState<ChartEditorState>({
    step: "list",
    editingChartId: null,
    name: "",
    type: "pie",
    dataSource: "categories",
    accentColor: CHART_COLORS[0],
    animations: true,
    showLabels: false,
  });

  function resetEditor() {
    setEditor({
      step: "list",
      editingChartId: null,
      name: "",
      type: "pie",
      dataSource: "categories",
      accentColor: CHART_COLORS[0],
      animations: true,
      showLabels: false,
    });
  }

  function handleAddChart() {
    setEditor({
      step: "name",
      editingChartId: null,
      name: "",
      type: "pie",
      dataSource: "categories",
      accentColor: CHART_COLORS[0],
      animations: true,
      showLabels: false,
    });
  }

  function handleEditChart(chart: DashboardChart) {
    setEditor({
      step: "style",
      editingChartId: chart.id,
      name: chart.name,
      type: chart.type,
      dataSource: chart.dataSource,
      accentColor: chart.accentColor,
      animations: chart.animations,
      showLabels: chart.showLabels,
    });
  }

  function handleDeleteChart(chartId: string) {
    if (confirm("Eliminar este grafico?")) {
      removeChart(chartId);
    }
  }

  function handleSaveChart() {
    if (editor.editingChartId) {
      updateChart(editor.editingChartId, {
        name: editor.name,
        type: editor.type,
        dataSource: editor.dataSource,
        accentColor: editor.accentColor,
        animations: editor.animations,
        showLabels: editor.showLabels,
      });
    } else {
      addChart({
        name: editor.name,
        type: editor.type,
        dataSource: editor.dataSource,
        accentColor: editor.accentColor,
        animations: editor.animations,
        showLabels: editor.showLabels,
      });
    }
    resetEditor();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Personalizar Dashboard
          </DialogTitle>
          <DialogDescription>
            Configura los widgets y graficos de tu dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={editor.step === "list" ? "default" : "ghost"}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={resetEditor}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Widgets
          </Button>
          <Button
            variant={editor.step !== "list" ? "default" : "ghost"}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => editor.step === "list" && handleAddChart()}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Graficos
          </Button>
        </div>

        {editor.step === "list" && (
          <div className="space-y-3 py-4">
            <p className="text-xs text-muted-foreground mb-2">
              Activa o desactiva widgets y reordenalos
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
          </div>
        )}

        {editor.step !== "list" && (
          <div className="space-y-4 py-4">
            {editor.step === "name" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chart-name">Nombre del grafico</Label>
                  <Input
                    id="chart-name"
                    placeholder="Ej: Mis gastos de verano"
                    value={editor.name}
                    onChange={(e) =>
                      setEditor((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={resetEditor}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() =>
                      setEditor((prev) => ({ ...prev, step: "style" }))
                    }
                    disabled={!editor.name.trim()}
                    className="flex-1"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {editor.step === "style" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    {editor.editingChartId ? "Editar" : "Nuevo"} grafico
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={resetEditor}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wide">
                      Tipo de grafico
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {CHART_TYPES.map((ct) => {
                        const Icon = ct.icon;
                        return (
                          <button
                            key={ct.value}
                            onClick={() =>
                              setEditor((prev) => ({ ...prev, type: ct.value }))
                            }
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all text-xs",
                              editor.type === ct.value
                                ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                : "hover:bg-muted border-transparent"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{ct.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wide">
                      Datos a mostrar
                    </Label>
                    <div className="space-y-1">
                      {DATA_SOURCES.map((ds) => (
                        <button
                          key={ds.value}
                          onClick={() =>
                            setEditor((prev) => ({
                              ...prev,
                              dataSource: ds.value,
                            }))
                          }
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                            editor.dataSource === ds.value
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted"
                          )}
                        >
                          {ds.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wide">
                      Color de acento
                    </Label>
                    <div className="flex gap-2">
                      {CHART_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() =>
                            setEditor((prev) => ({
                              ...prev,
                              accentColor: color,
                            }))
                          }
                          className={cn(
                            "w-8 h-8 rounded-full transition-all ring-2 ring-offset-2",
                            editor.accentColor === color
                              ? `ring-[${color}]`
                              : "ring-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Animaciones</Label>
                      <Switch
                        checked={editor.animations}
                        onCheckedChange={(checked) =>
                          setEditor((prev) => ({
                            ...prev,
                            animations: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Mostrar valores</Label>
                      <Switch
                        checked={editor.showLabels}
                        onCheckedChange={(checked) =>
                          setEditor((prev) => ({
                            ...prev,
                            showLabels: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={resetEditor}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveChart} className="flex-1">
                    {editor.editingChartId ? "Guardar" : "Crear"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {editor.step === "list" && (dashboardConfig.charts ?? []).length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Graficos creados</h3>
              <Button size="sm" variant="outline" onClick={handleAddChart} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Añadir
              </Button>
            </div>
            <div className="space-y-2">
              {(dashboardConfig.charts ?? []).map((chart) => (
                <div
                  key={chart.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: chart.accentColor }}
                    />
                    <span className="text-sm font-medium">{chart.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {chart.type} · {DATA_SOURCES.find((d) => d.value === chart.dataSource)?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEditChart(chart)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteChart(chart.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {editor.step === "list" && (dashboardConfig.charts ?? []).length === 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="text-center py-6 space-y-3">
              <div className="text-4xl">📊</div>
              <p className="text-sm text-muted-foreground">
                No hay graficos creados.
              </p>
              <Button onClick={handleAddChart} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear el primero
              </Button>
            </div>
          </div>
        )}

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