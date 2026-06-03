"use client";

import { AlertTriangle, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeSavingsDifficulty } from "@/lib/finance/finance-engine";

type DifficultyLevel = "ok" | "tight" | "difficult" | "impossible";

interface SavingsDifficultyBadgeProps {
  requiredMonthly: number;
  availableCapacity: number;
  className?: string;
}

const DIFFICULTY_CONFIG: Record<DifficultyLevel, {
  label: string;
  description: string;
  icon: typeof AlertTriangle;
  class: string;
  bgClass: string;
}> = {
  ok: {
    label: "OK",
    description: "El aporte necesario encaja bien en tu capacidad de ahorro.",
    icon: CheckCircle2,
    class: "text-green-700",
    bgClass: "bg-green-50 border-green-200",
  },
  tight: {
    label: "Ajustado",
    description: "El aporte necesario consume una parte significativa de tu capacidad de ahorro.",
    icon: AlertCircle,
    class: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-200",
  },
  difficult: {
    label: "Difícil",
    description: "El aporte necesario requiere casi toda tu capacidad de ahorro mensual.",
    icon: AlertTriangle,
    class: "text-orange-700",
    bgClass: "bg-orange-50 border-orange-200",
  },
  impossible: {
    label: "Inviable",
    description: "El aporte necesario supera tu capacidad de ahorro mensual.",
    icon: XCircle,
    class: "text-red-700",
    bgClass: "bg-red-50 border-red-200",
  },
};

export function SavingsDifficultyBadge({
  requiredMonthly,
  availableCapacity,
  className,
}: SavingsDifficultyBadgeProps) {
  if (!(requiredMonthly > 0) || !(availableCapacity > 0)) return null;

  const level = computeSavingsDifficulty(requiredMonthly, availableCapacity) as DifficultyLevel;
  const config = DIFFICULTY_CONFIG[level];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-lg border p-3 space-y-1", config.bgClass, className)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", config.class)} />
        <span className={cn("text-sm font-semibold", config.class)}>
          {config.label}
        </span>
      </div>
      <p className={cn("text-xs", config.class)}>{config.description}</p>
      <div className="flex items-center gap-4 text-xs mt-1">
        <span className={cn("font-medium", config.class)}>
          Necesario: {requiredMonthly.toFixed(2)} €/mes
        </span>
        <span className="text-muted-foreground">
          Capacidad: {availableCapacity.toFixed(2)} €/mes
        </span>
      </div>
    </div>
  );
}

export function DifficultyTag({
  requiredMonthly,
  availableCapacity,
}: {
  requiredMonthly: number;
  availableCapacity: number;
}) {
  if (!(requiredMonthly > 0) || !(availableCapacity > 0)) return null;

  const level = computeSavingsDifficulty(requiredMonthly, availableCapacity) as DifficultyLevel;
  const config = DIFFICULTY_CONFIG[level];

  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", config.bgClass, config.class)}>
      {config.label}
    </span>
  );
}

export function estimateRequiredMonthly(
  importeObjetivo: number,
  saldoActual: number,
  fechaObjetivo: string,
): number {
  if (!fechaObjetivo || !importeObjetivo) return 0;
  const remaining = Math.max(0, importeObjetivo - saldoActual);
  const now = new Date();
  const targetDate = new Date(fechaObjetivo);
  if (targetDate <= now) return remaining;
  const monthsRemaining =
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
    (targetDate.getMonth() - now.getMonth());
  if (monthsRemaining <= 0) return remaining;
  return remaining / monthsRemaining;
}
