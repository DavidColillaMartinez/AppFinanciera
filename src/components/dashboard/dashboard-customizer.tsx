"use client";

import { useState } from "react";
import { useAppStore, type ChartType, type ChartDataSource, type DashboardChart, type LayoutMode } from "@/stores/app-store";
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
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  Settings,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  BarChart3,
  PieChart,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  LayoutGrid,
  Columns2,
} from "lucide-react";

const WIDGET_LABELS: Record<string, string> = {
  balance: "Disponible",
  income: "Ingresos",
  expenses: "Gastos variables",
  savings: "Ahorro general",
  monthlySavings: "Ahorro del mes",
  savingsPlan: "Tu nomina",
  obligations: "Total obligaciones",
  detail: "Ultimos movimientos",
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
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

interface DashboardCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EditorStep = "list" | "chart-name" | "chart-style";

interface ChartEditorState {
  step: EditorStep;
  editingChartId: string | null;
  name: string;
  type: ChartType;
  dataSource: ChartDataSource;
  accentColor: string;
  animations: boolean;
  showLabels: boolean;
}

export function DashboardCustomizer({ open, onOpenChange }: DashboardCustomizerProps) {
  const {
    dashboardConfig,
    toggleWidgetEnabled,
    moveWidget,
    setLayoutMode,
    resetDashboardConfig,
    addChart,
    updateChart,
    removeChart,
  } = useAppStore();

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

  const [chartToDelete, setChartToDelete] = useState<DashboardChart | null>(null);

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
    setEditor({ step: "chart-name", editingChartId: null, name: "", type: "pie", dataSource: "categories", accentColor: CHART_COLORS[0], animations: true, showLabels: false });
  }

  function handleEditChart(chart: DashboardChart) {
    setEditor({ step: "chart-style", editingChartId: chart.id, name: chart.name, type: chart.type, dataSource: chart.dataSource, accentColor: chart.accentColor, animations: chart.animations, showLabels: chart.showLabels });
  }

  function handleSaveChart() {
    if (editor.editingChartId) {
      updateChart(editor.editingChartId, {
        name: editor.name, type: editor.type, dataSource: editor.dataSource,
        accentColor: editor.accentColor, animations: editor.animations, showLabels: editor.showLabels,
      });
    } else {
      addChart({
        name: editor.name, type: editor.type, dataSource: editor.dataSource,
        accentColor: editor.accentColor, animations: editor.animations, showLabels: editor.showLabels,
      });
    }
    resetEditor();
  }

  const sortedWidgets = [...dashboardConfig.widgets].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Personalizar Dashboard
          </DialogTitle>
          <DialogDescription>Configura los widgets y el layout del dashboard.</DialogDescription>
        </DialogHeader>

        {editor.step === "list" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Columns2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Layout</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant={dashboardConfig.layoutMode === "single" ? "default" : "outline"} className="text-xs" onClick={() => setLayoutMode("single")}>
                  <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                  1 columna
                </Button>
                <Button size="sm" variant={dashboardConfig.layoutMode === "two-column" ? "default" : "outline"} className="text-xs" onClick={() => setLayoutMode("two-column")}>
                  <Columns2 className="h-3.5 w-3.5 mr-1" />
                  2 columnas
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">Widgets — pulsa para cambiar visibilidad</p>

            <div className="space-y-1.5">
              {sortedWidgets.map((widget, index) => {
                const label = widget.kind === "builtin"
                  ? (WIDGET_LABELS[widget.id] ?? widget.id)
                  : dashboardConfig.charts.find((c) => c.id === widget.chartId)?.name ?? "Grafico";
                const chartData = widget.kind === "chart"
                  ? dashboardConfig.charts.find((c) => c.id === widget.chartId)
                  : null;
                return (
                  <div
                    key={widget.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 transition-all",
                      widget.enabled ? "border-primary/30 bg-card" : "border-dashed opacity-60",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => toggleWidgetEnabled(widget.id)}
                        className={cn(
                          "flex items-center gap-2 text-sm font-medium truncate cursor-pointer",
                          widget.enabled ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {widget.enabled ? (
                          <Eye className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate">{label}</span>
                      </button>
                      {chartData && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                          {chartData.type}
                        </span>
                      )}
                      {!widget.enabled && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                          Oculto
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {widget.kind === "chart" && chartData && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditChart(chartData)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {widget.kind === "chart" && chartData && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setChartToDelete(chartData)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => moveWidget(widget.id, "up")}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === sortedWidgets.length - 1} onClick={() => moveWidget(widget.id, "down")}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleAddChart}>
              <Plus className="h-4 w-4" />
              Añadir grafico
            </Button>
          </div>
        )}

        {editor.step === "chart-name" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="chart-name">Nombre del grafico</Label>
              <Input id="chart-name" placeholder="Ej: Mis gastos de verano" value={editor.name} onChange={(e) => setEditor((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={resetEditor} className="flex-1">Cancelar</Button>
              <Button onClick={() => setEditor((p) => ({ ...p, step: "chart-style" }))} disabled={!editor.name.trim()} className="flex-1">
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {editor.step === "chart-style" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{editor.editingChartId ? "Editar" : "Nuevo"} grafico</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetEditor}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wide">Tipo</Label>
                <div className="grid grid-cols-4 gap-2">
                  {CHART_TYPES.map((ct) => {
                    const Icon = ct.icon;
                    return (
                      <button key={ct.value} onClick={() => setEditor((p) => ({ ...p, type: ct.value }))}
                        className={cn("flex flex-col items-center gap-1 rounded-lg border p-3 transition-all text-xs", editor.type === ct.value ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "hover:bg-muted border-transparent")}>
                        <Icon className="h-5 w-5" /><span>{ct.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wide">Datos</Label>
                <div className="space-y-1">
                  {DATA_SOURCES.map((ds) => (
                    <button key={ds.value} onClick={() => setEditor((p) => ({ ...p, dataSource: ds.value }))}
                      className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-all", editor.dataSource === ds.value ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted")}>
                      {ds.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wide">Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {CHART_COLORS.map((color) => (
                    <button key={color} onClick={() => setEditor((p) => ({ ...p, accentColor: color }))}
                      className={cn("w-8 h-8 rounded-full transition-all ring-2 ring-offset-2", editor.accentColor === color ? "ring-primary" : "ring-transparent")}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Animaciones</Label>
                  <Switch checked={editor.animations} onCheckedChange={(c) => setEditor((p) => ({ ...p, animations: c }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Mostrar valores</Label>
                  <Switch checked={editor.showLabels} onCheckedChange={(c) => setEditor((p) => ({ ...p, showLabels: c }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={resetEditor} className="flex-1">Cancelar</Button>
              <Button onClick={handleSaveChart} className="flex-1">{editor.editingChartId ? "Guardar" : "Crear"}</Button>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t gap-2">
          <Button variant="outline" size="sm" onClick={resetDashboardConfig} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Restaurar
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>Aplicar cambios</Button>
        </div>
      </DialogContent>

      <ConfirmDialog
        open={chartToDelete !== null}
        onOpenChange={(open) => !open && setChartToDelete(null)}
        title="Eliminar grafico"
        description={`Vas a eliminar "${chartToDelete?.name ?? ""}". Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={() => {
          if (chartToDelete) { removeChart(chartToDelete.id); setChartToDelete(null); }
        }}
      />
    </Dialog>
  );
}
