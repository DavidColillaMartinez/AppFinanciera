"use client";

import { useState, useMemo, useEffect } from "react";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Target,
  Clock,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateSavingsContribution,
  useCreateSavingsWithdrawal,
} from "@/features/savings/hooks/use-savings";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { TipoDestinoReserva } from "@/constants/enums";
import type { ReserveRow, GoalRow, FuturePaymentRow } from "@/types/models";

const TYPE_OPTIONS: { value: "reserva" | "objetivo" | "pago_futuro"; label: string; icon: typeof PiggyBank }[] = [
  { value: "reserva", label: "Reserva", icon: PiggyBank },
  { value: "objetivo", label: "Objetivo", icon: Target },
  { value: "pago_futuro", label: "Pago futuro", icon: Clock },
];

interface DirectSavingsTargetHint {
  targetType: "reserva" | "objetivo" | "pago_futuro";
  targetId: string;
}

interface DirectSavingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetId: string | null;
  reserves: ReserveRow[];
  goals: GoalRow[];
  futurePayments: FuturePaymentRow[];
  defaultType?: "aporte" | "retirada";
  defaultTarget?: DirectSavingsTargetHint | null;
  onSuccess?: () => void;
}

export function DirectSavingsModal({
  open,
  onOpenChange,
  sheetId,
  reserves,
  goals,
  futurePayments,
  defaultType = "aporte",
  defaultTarget = null,
  onSuccess,
}: DirectSavingsModalProps) {
  const { success, error: showError } = useToast();
  const { data: accounts } = useAccounts(sheetId);

  const [tipo, setTipo] = useState<"aporte" | "retirada">(defaultType);
  const [targetType, setTargetType] = useState<"reserva" | "objetivo" | "pago_futuro">(
    "objetivo",
  );
  const [targetId, setTargetId] = useState<string>(() =>
    defaultTarget ? defaultTarget.targetId : "",
  );
  const [importe, setImporte] = useState<string>("");
  const [cuentaId, setCuentaId] = useState<string>("");
  const [notas, setNotas] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTipo(defaultType);
    if (defaultTarget) {
      setTargetType(defaultTarget.targetType);
      setTargetId(defaultTarget.targetId);
    } else {
      setTargetId("");
    }
    setImporte("");
    setNotas("");
  }, [open, defaultType, defaultTarget]);

  const targets = useMemo(() => {
    if (targetType === TipoDestinoReserva.RESERVA) {
      return reserves
        .filter((r) => r.estado !== "Cancelado")
        .map((r) => ({ id: r.reservaId, nombre: r.nombre }));
    }
    if (targetType === TipoDestinoReserva.OBJETIVO) {
      return goals
        .filter((g) => g.estado !== "Cancelado")
        .map((g) => ({ id: g.objetivoId, nombre: g.nombre }));
    }
    return futurePayments
      .filter((f) => f.estado !== "Cancelado")
      .map((f) => ({ id: f.pagoId, nombre: f.concepto }));
  }, [targetType, reserves, goals, futurePayments]);

  const safeTargetId =
    targets.length === 0
      ? ""
      : targets.some((t) => t.id === targetId)
        ? targetId
        : (targets[0]?.id ?? "");

  const createAporte = useCreateSavingsContribution(sheetId);
  const createRetirada = useCreateSavingsWithdrawal(sheetId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!safeTargetId) {
      showError("Selecciona un objetivo.");
      return;
    }
    const n = Number(importe);
    if (!(n > 0)) {
      showError("Importe no válido.");
      return;
    }
    setSubmitting(true);
    try {
      const common = {
        tipoDestino: targetType,
        destinoId: safeTargetId,
        reservaId: safeTargetId,
        importe: n,
        notas: notas || undefined,
        cuentaOrigen: tipo === "retirada" ? cuentaId || undefined : undefined,
        cuentaDestino: tipo === "aporte" ? cuentaId || undefined : undefined,
      };
      if (tipo === "aporte") {
        await createAporte.mutateAsync(common);
      } else {
        await createRetirada.mutateAsync(common);
      }
      success(
        tipo === "aporte"
          ? "Aporte registrado correctamente."
          : "Retirada registrada correctamente.",
      );
      setImporte("");
      setNotas("");
      onSuccess?.();
    } catch (e) {
      showError(`Error: ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  const noTargets = targets.length === 0;
  const noAccounts = (accounts ?? []).length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tipo === "aporte" ? (
              <ArrowDownLeft className="h-5 w-5 text-savings" />
            ) : (
              <ArrowUpRight className="h-5 w-5 text-expense" />
            )}
            {tipo === "aporte" ? "Nuevo aporte" : "Nueva retirada"}
          </DialogTitle>
          <DialogDescription>
            Registra un movimiento puntual en una reserva, objetivo o pago futuro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={tipo === "aporte" ? "default" : "outline"}
              size="sm"
              onClick={() => setTipo("aporte")}
              className="gap-2"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Aporte
            </Button>
            <Button
              type="button"
              variant={tipo === "retirada" ? "default" : "outline"}
              size="sm"
              onClick={() => setTipo("retirada")}
              className="gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              Retirada
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Tipo de objetivo
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((o) => {
                const Icon = o.icon;
                const active = targetType === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setTargetType(o.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {noTargets ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3 text-xs text-amber-800 space-y-2">
                <p className="font-medium">No hay {targetType === "pago_futuro" ? "pagos futuros" : targetType === "objetivo" ? "objetivos" : "reservas"} activos.</p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/savings" onClick={() => onOpenChange(false)}>
                    Crear uno en Ahorros
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="target">Destino</Label>
              <select
                id="target"
                value={safeTargetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="importe">Importe (€)</Label>
            <Input
              id="importe"
              type="number"
              step="0.01"
              min="0.01"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {!noAccounts && (accounts ?? []).length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="cuenta">
                {tipo === "aporte" ? "Cuenta de origen (opcional)" : "Cuenta de destino (opcional)"}
              </Label>
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  id="cuenta"
                  value={cuentaId}
                  onChange={(e) => setCuentaId(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  <option value="">(Sin cuenta)</option>
                  {(accounts ?? []).map((a) => (
                    <option key={a.cuentaId} value={a.cuentaId}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Input
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Sin notas"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={submitting || noTargets}
              className={cn(
                "flex-1 gap-2",
                tipo === "aporte"
                  ? "bg-savings hover:bg-savings/90"
                  : "bg-expense hover:bg-expense/90",
              )}
            >
              {submitting
                ? "Guardando..."
                : tipo === "aporte"
                  ? "Registrar aporte"
                  : "Registrar retirada"}
            </Button>
            {onOpenChange && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
