"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SavingsTargetDetail } from "@/lib/finance/finance-engine";
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
}

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
                <p className="text-xs text-muted-foreground">
                  {item.progressPercent.toFixed(0)}% &middot; faltan{" "}
                  {item.remaining.toFixed(2)} €
                </p>
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
}: GeneralSavingsBreakdownModalProps) {
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
