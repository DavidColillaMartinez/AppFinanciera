"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";
import {
  PiggyBank,
  Target,
  Clock,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SavingsTargetDetail } from "@/lib/finance/finance-engine";
import { computeSavingsDifficulty } from "@/lib/finance/finance-engine";
import Link from "next/link";

interface GeneralSavingsBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalSaved: number;
  totalTarget: number;
  overallProgress: number;
  reserves: SavingsTargetDetail[];
  goals: SavingsTargetDetail[];
  futurePayments: SavingsTargetDetail[];
  hasAnyItems: boolean;
  availableCapacity?: number;
}

const PRIORITY_LABELS: Record<string, string> = {
  Alta: "Alta",
  Media: "Media",
  Baja: "Baja",
};

const PRIORITY_COLORS: Record<string, string> = {
  Alta: "bg-red-100 text-red-700",
  Media: "bg-amber-100 text-amber-700",
  Baja: "bg-blue-100 text-blue-700",
};

const ESTADO_BADGES: Record<string, { label: string; class: string }> = {
  Activo: { label: "Activo", class: "bg-green-100 text-green-700" },
  Pausado: { label: "Pausado", class: "bg-amber-100 text-amber-700" },
  Completado: { label: "Completado", class: "bg-blue-100 text-blue-700" },
  Cancelado: { label: "Cancelado", class: "bg-gray-100 text-gray-500" },
};

interface GroupSectionProps {
  title: string;
  icon: typeof PiggyBank;
  colorClass: string;
  accentClass: string;
  totalSaved: number;
  totalTarget: number;
  items: SavingsTargetDetail[];
  emptyHint: string;
}

function GroupSection({
  title,
  icon: Icon,
  colorClass,
  accentClass,
  totalSaved,
  totalTarget,
  items,
  emptyHint,
}: GroupSectionProps) {
  if (items.length === 0) return null;
  const progress = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", colorClass)} />
          <p className="text-sm font-semibold">{title}</p>
          <span className="text-xs text-muted-foreground">
            ({items.length})
          </span>
        </div>
        <span className={cn("text-xs font-semibold", colorClass)}>
          {totalSaved.toFixed(2)} / {totalTarget.toFixed(2)} €
        </span>
      </div>
      <Progress value={progress} className="h-1.5" />
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={`${title}-${item.id}`}
            className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-2.5"
          >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={cn("rounded p-1.5 shrink-0", accentClass)}>
                  <Icon className={cn("h-3.5 w-3.5", colorClass)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <p className="text-xs text-muted-foreground">
                      {item.progressPercent.toFixed(0)}%
                    </p>
                    {item.prioridad && (
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded", PRIORITY_COLORS[item.prioridad] ?? "")}>
                        {PRIORITY_LABELS[item.prioridad] ?? item.prioridad}
                      </span>
                    )}
                    {item.estado && item.estado !== "Activo" && (
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded", ESTADO_BADGES[item.estado]?.class ?? "")}>
                        {ESTADO_BADGES[item.estado]?.label ?? item.estado}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            <div className="text-right shrink-0">
              <p className={cn("text-sm font-semibold tabular-nums", colorClass)}>
                {item.saved.toFixed(2)} €
              </p>
              <p className="text-xs text-muted-foreground">
                / {item.target.toFixed(2)} €
              </p>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground italic">{emptyHint}</p>
      )}
    </div>
  );
}

export function GeneralSavingsBreakdownModal({
  open,
  onOpenChange,
  totalSaved,
  totalTarget,
  overallProgress,
  reserves,
  goals,
  futurePayments,
  hasAnyItems,
  availableCapacity = 0,
}: GeneralSavingsBreakdownModalProps) {
  const allItems = useMemo(() => [...reserves, ...goals, ...futurePayments], [reserves, goals, futurePayments]);
  const priorityCounts = useMemo(() => {
    const alta = allItems.filter((i) => i.prioridad === "Alta").length;
    const media = allItems.filter((i) => i.prioridad === "Media").length;
    const baja = allItems.filter((i) => i.prioridad === "Baja").length;
    return { alta, media, baja };
  }, [allItems]);
  const pausadoCount = useMemo(() => allItems.filter((i) => i.estado === "Pausado").length, [allItems]);
  const hasRealCapacity = availableCapacity > 0;
  const warningCount = useMemo(() => {
    if (!hasRealCapacity) return -1;
    return allItems.filter((i) => {
      if (!i.requiredMonthly || i.requiredMonthly <= 0) return false;
      const diff = computeSavingsDifficulty(i.requiredMonthly, availableCapacity);
      return diff === "difficult" || diff === "impossible";
    }).length;
  }, [allItems, availableCapacity, hasRealCapacity]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-savings" />
            Ahorro general
          </DialogTitle>
          <DialogDescription>
            Total acumulado en reservas, objetivos y provisiones de pagos futuros.
          </DialogDescription>
        </DialogHeader>

        {!hasAnyItems ? (
          <EmptyState
            title="Sin objetivos"
            description="Crea reservas, objetivos o pagos futuros para empezar a ahorrar."
            type="empty"
            action={{ label: "Crear ahorro", onClick: () => window.location.assign("/savings") }}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-savings/30 bg-savings/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total acumulado
                </p>
                <span className="text-xs text-muted-foreground">
                  {overallProgress.toFixed(0)}% del objetivo
                </span>
              </div>
              <p className="text-2xl font-bold text-savings">
                {totalSaved.toFixed(2)} €
              </p>
              {totalTarget > 0 && (
                <>
                  <Progress value={overallProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Faltan {Math.max(0, totalTarget - totalSaved).toFixed(2)} € para
                    alcanzar todos los objetivos.
                  </p>
                </>
              )}
            </div>

            {(priorityCounts.alta > 0 || priorityCounts.media > 0 || priorityCounts.baja > 0) && (
              <div className="flex flex-wrap gap-2">
                {priorityCounts.alta > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                    Alta: {priorityCounts.alta}
                  </span>
                )}
                {priorityCounts.media > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                    Media: {priorityCounts.media}
                  </span>
                )}
                {priorityCounts.baja > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                    Baja: {priorityCounts.baja}
                  </span>
                )}
                {pausadoCount > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                    Pausados: {pausadoCount}
                  </span>
                )}
              </div>
            )}

            {warningCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {warningCount} objetivo{warningCount > 1 ? "s" : ""} con dificultad alta o inviable
                  </p>
                  <p className="mt-0.5 text-red-600">
                    Revisa los importes o las fechas objetivo. Puedes ajustarlos desde la seccion Ahorros.
                  </p>
                </div>
              </div>
            )}
            {!hasRealCapacity && allItems.some((i) => i.requiredMonthly && i.requiredMonthly > 0) && (
              <div className="flex items-start gap-2 rounded-lg border border-muted-foreground/20 bg-muted/50 p-3 text-xs text-muted-foreground">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>No hay datos de ingresos del mes para calcular la dificultad de los objetivos.</p>
              </div>
            )}

            <GroupSection
              title="Reservas"
              icon={PiggyBank}
              colorClass="text-savings"
              accentClass="bg-savings/10"
              totalSaved={reserves.reduce((acc, r) => acc + r.saved, 0)}
              totalTarget={reserves.reduce((acc, r) => acc + r.target, 0)}
              items={reserves}
              emptyHint="Crea reservas en /savings."
            />
            <GroupSection
              title="Objetivos"
              icon={Target}
              colorClass="text-income"
              accentClass="bg-income/10"
              totalSaved={goals.reduce((acc, g) => acc + g.saved, 0)}
              totalTarget={goals.reduce((acc, g) => acc + g.target, 0)}
              items={goals}
              emptyHint="Crea objetivos en /goals."
            />
            <GroupSection
              title="Pagos futuros"
              icon={Clock}
              colorClass="text-warning"
              accentClass="bg-warning/10"
              totalSaved={futurePayments.reduce((acc, f) => acc + f.saved, 0)}
              totalTarget={futurePayments.reduce((acc, f) => acc + f.target, 0)}
              items={futurePayments}
              emptyHint="Crea pagos futuros en /future-payments."
            />

            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Button asChild size="sm" className="flex-1 gap-2 bg-savings hover:bg-savings/90">
                <Link href="/savings">
                  <Plus className="h-4 w-4" />
                  Aportar
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href="/savings/monthly">
                  Confirmar mes
                </Link>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
