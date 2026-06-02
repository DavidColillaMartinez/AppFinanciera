"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/stores/app-store";
import { useFixedExpenses } from "@/features/fixed-expenses/hooks/use-fixed-expenses";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import {
  useConfirmedFixedExpenseIds,
  useConfirmFixedExpense,
  useUnconfirmFixedExpense,
  useConfirmAllPendingFixedExpenses,
} from "@/features/fixed-expenses/hooks/use-fixed-confirmation";
import { buildProposal, buildFixedExpenseMovementId } from "@/lib/finance/fixed-expense-confirmation";
import { generateMonthKey } from "@/lib/sheets/adapters";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { Frequency } from "@/constants/enums";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CheckCheck,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FixedExpenseRow } from "@/types/models";

interface DraftState {
  importe: string;
  categoria: string;
  cuentaOrigen: string;
  fecha: string;
  metodo: string;
  notas: string;
  editing: boolean;
}

function defaultDraftFrom(fijo: FixedExpenseRow, monthKey: string): DraftState {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const safeDay = Math.max(1, Math.min(28, Math.floor(fijo.diaCargo || 1)));
  const fecha = `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
  return {
    importe: String(fijo.importe),
    categoria: fijo.categoria,
    cuentaOrigen: fijo.cuentaOrigen,
    fecha,
    metodo: "",
    notas: `Gasto fijo confirmado: ${fijo.concepto} (${fijo.fijoId})`,
    editing: false,
  };
}

const frequencyLabels: Record<string, string> = {
  [Frequency.MENSUAL]: "Mensual",
  [Frequency.ANUAL]: "Anual",
  [Frequency.TRIMESTRAL]: "Trimestral",
  [Frequency.UNICO]: "Unico",
};

function isActiveInMonth(fijo: FixedExpenseRow, monthKey: string): boolean {
  const monthStart = `${monthKey}-01`;
  if (fijo.fechaInicio && fijo.fechaInicio > monthKey + "-31") return false;
  if (fijo.fechaFin && fijo.fechaFin < monthStart) return false;
  return true;
}

function isMonthlyForMonth(fijo: FixedExpenseRow, monthKey: string): boolean {
  if (fijo.frecuencia === Frequency.MENSUAL) return true;
  if (fijo.frecuencia === Frequency.UNICO) {
    if (!fijo.fechaInicio) return true;
    const inicioMonth = fijo.fechaInicio.slice(0, 7);
    return inicioMonth === monthKey;
  }
  if (fijo.frecuencia === Frequency.TRIMESTRAL) {
    if (!fijo.fechaInicio) return true;
    const inicioMonth = fijo.fechaInicio.slice(0, 7);
    const [iY, iM] = inicioMonth.split("-").map(Number);
    const [cY, cM] = monthKey.split("-").map(Number);
    const monthsFromStart = (cY - iY) * 12 + (cM - iM);
    return monthsFromStart >= 0 && monthsFromStart % 3 === 0;
  }
  if (fijo.frecuencia === Frequency.ANUAL) {
    if (!fijo.fechaInicio) return true;
    const inicioMonth = fijo.fechaInicio.slice(0, 7);
    return inicioMonth === monthKey;
  }
  return false;
}

export default function ConfirmFixedExpensesPage() {
  const { sheetId } = useAppStore();
  const { success, error: showError } = useToast();

  const currentMonth = useMemo(() => generateMonthKey(new Date().toISOString()), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const { data: fijos, isLoading: loadingFijos, isError: errorFijos, error: fijosError } =
    useFixedExpenses(sheetId);
  const { data: categories = [] } = useCategories(sheetId);
  const { data: accounts = [] } = useAccounts(sheetId);
  const { data: monthTransactions = [] } = useTransactions(sheetId, selectedMonth);

  const { data: confirmedIds, isLoading: loadingConfirmed } =
    useConfirmedFixedExpenseIds(sheetId, selectedMonth);

  const confirmOne = useConfirmFixedExpense(sheetId);
  const unconfirmOne = useUnconfirmFixedExpense(sheetId);
  const confirmAll = useConfirmAllPendingFixedExpenses(sheetId);

  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [pendingUnconfirm, setPendingUnconfirm] = useState<ReturnType<typeof buildProposal> | null>(null);

  const proposals = useMemo(() => {
    if (!fijos) return [];
    return fijos
      .filter((f) => f.activo === "S")
      .filter((f) => isActiveInMonth(f, selectedMonth))
      .filter((f) => isMonthlyForMonth(f, selectedMonth))
      .map((fijo) => {
        const movementId = buildFixedExpenseMovementId(selectedMonth, fijo.fijoId);
        const inMovements = monthTransactions.some((t) => t.id === movementId);
        const inConfig = confirmedIds?.has(fijo.fijoId) ?? false;
        const alreadyConfirmed = inMovements || inConfig;
        return buildProposal({ fijo, monthKey: selectedMonth, alreadyConfirmed });
      });
  }, [fijos, selectedMonth, monthTransactions, confirmedIds]);

  const pendingProposals = proposals.filter((p) => !p.alreadyConfirmed);
  const confirmedProposals = proposals.filter((p) => p.alreadyConfirmed);

  const totalPendiente = pendingProposals.reduce((acc, p) => acc + p.proposedImporte, 0);
  const totalConfirmado = confirmedProposals.reduce((acc, p) => acc + p.proposedImporte, 0);

  function getDraft(fijoId: string, fallback: FixedExpenseRow): DraftState {
    return (
      drafts[fijoId] ?? defaultDraftFrom(fallback, selectedMonth)
    );
  }

  function setDraft(fijoId: string, partial: Partial<DraftState>) {
    setDrafts((prev) => {
      const current = prev[fijoId] ?? defaultDraftFrom(
        proposals.find((p) => p.fijo.fijoId === fijoId)?.fijo as FixedExpenseRow,
        selectedMonth,
      );
      return { ...prev, [fijoId]: { ...current, ...partial } };
    });
  }

  function startEdit(fijoId: string) {
    setDraft(fijoId, { editing: true });
  }

  function cancelEdit(fijoId: string, fallback: FixedExpenseRow) {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[fijoId];
      return next;
    });
    void fallback;
  }

  function changeMonth(month: string) {
    setSelectedMonth(month);
    setDrafts({});
  }

  async function handleConfirm(proposal: ReturnType<typeof buildProposal>) {
    const draft = getDraft(proposal.fijo.fijoId, proposal.fijo);
    const importe = Number(draft.importe);
    if (!Number.isFinite(importe) || importe <= 0) {
      showError(`Importe invalido para "${proposal.fijo.concepto}".`);
      return;
    }
    if (!draft.cuentaOrigen) {
      showError(`Selecciona una cuenta para "${proposal.fijo.concepto}".`);
      return;
    }
    try {
      await confirmOne.mutateAsync({
        monthKey: selectedMonth,
        fijo: proposal.fijo,
        draft: {
          importe,
          categoria: draft.categoria,
          cuentaOrigen: draft.cuentaOrigen,
          metodo: draft.metodo,
          fecha: draft.fecha,
          notas: draft.notas,
        },
      });
      success(`Gasto fijo "${proposal.fijo.concepto}" confirmado.`);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[proposal.fijo.fijoId];
        return next;
      });
    } catch (e) {
      showError(`Error al confirmar: ${(e as Error).message}`);
    }
  }

  function requestUnconfirm(proposal: ReturnType<typeof buildProposal>) {
    setPendingUnconfirm(proposal);
  }

  async function confirmUnconfirm() {
    if (!pendingUnconfirm) return;
    const proposal = pendingUnconfirm;
    try {
      await unconfirmOne.mutateAsync({
        monthKey: selectedMonth,
        fijoId: proposal.fijo.fijoId,
      });
      success(`Gasto fijo "${proposal.fijo.concepto}" desconfirmado.`);
    } catch (e) {
      showError(`Error al desconfirmar: ${(e as Error).message}`);
    } finally {
      setPendingUnconfirm(null);
    }
  }

  async function handleConfirmAll() {
    if (pendingProposals.length === 0) return;
    try {
      const result = await confirmAll.mutateAsync({
        monthKey: selectedMonth,
        fijos: pendingProposals.map((p) => p.fijo),
        alreadyConfirmed: new Set(),
      });
      const parts: string[] = [];
      if (result.confirmedCount) parts.push(`${result.confirmedCount} confirmados`);
      if (result.updatedCount) parts.push(`${result.updatedCount} actualizados`);
      if (result.skippedCount) parts.push(`${result.skippedCount} omitidos`);
      if (result.failures.length) parts.push(`${result.failures.length} fallidos`);
      const message = parts.length ? `Resumen: ${parts.join(", ")}.` : "Sin cambios.";
      success(message);
    } catch (e) {
      showError(`Error al confirmar todos: ${(e as Error).message}`);
    }
  }

  if (!sheetId) {
    return (
      <div className="px-4 py-6 pb-24 space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/fixed-expenses" className="p-2 -ml-2 rounded-lg hover:bg-muted">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Confirmar gastos fijos</h1>
        </div>
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Conecta una hoja de Google antes de confirmar gastos fijos.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/fixed-expenses" className="p-2 -ml-2 rounded-lg hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Confirmar gastos fijos</h1>
          <p className="text-sm text-muted-foreground">
            Revisa y confirma los gastos fijos del mes.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="month">Mes</Label>
            <Input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => changeMonth(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-0.5">
              <p className="text-xs uppercase tracking-wide text-amber-800 font-medium">
                Pendientes
              </p>
              <p className="text-2xl font-bold text-amber-900">{pendingProposals.length}</p>
              <p className="text-xs text-amber-700">{totalPendiente.toFixed(2)} €</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-0.5">
              <p className="text-xs uppercase tracking-wide text-green-800 font-medium">
                Confirmados
              </p>
              <p className="text-2xl font-bold text-green-900">{confirmedProposals.length}</p>
              <p className="text-xs text-green-700">{totalConfirmado.toFixed(2)} €</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {(loadingFijos || loadingConfirmed) && (
        <LoadingState message="Cargando gastos fijos..." />
      )}
      {errorFijos && (
        <ErrorState message={(fijosError as Error)?.message ?? "Error al cargar"} />
      )}

      {!loadingFijos && !loadingConfirmed && proposals.length === 0 && (
        <EmptyState
          title="Sin gastos fijos para este mes"
          description="No hay gastos fijos activos que correspondan a este mes."
          type="empty"
        />
      )}

      {pendingProposals.length > 0 && (
        <Button
          onClick={handleConfirmAll}
          disabled={confirmAll.isPending}
          className="w-full gap-2"
          size="lg"
        >
          <CheckCheck className="h-5 w-5" />
          {confirmAll.isPending
            ? "Confirmando..."
            : `Confirmar todos los pendientes (${pendingProposals.length})`}
        </Button>
      )}

      {pendingProposals.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Pendientes
          </h2>
          {pendingProposals.map((proposal) => {
            const draft = getDraft(proposal.fijo.fijoId, proposal.fijo);
            return (
              <PendingRow
                key={proposal.fijo.fijoId}
                proposal={proposal}
                draft={draft}
                categories={categories}
                accounts={accounts}
                onChange={(partial) => setDraft(proposal.fijo.fijoId, partial)}
                onEdit={() => startEdit(proposal.fijo.fijoId)}
                onCancel={() => cancelEdit(proposal.fijo.fijoId, proposal.fijo)}
                onConfirm={() => handleConfirm(proposal)}
                confirming={confirmOne.isPending}
              />
            );
          })}
        </div>
      )}

      {confirmedProposals.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Confirmados
          </h2>
          {confirmedProposals.map((proposal) => (
            <ConfirmedRow
              key={proposal.fijo.fijoId}
              proposal={proposal}
              onUnconfirm={() => requestUnconfirm(proposal)}
              unconfirming={unconfirmOne.isPending}
            />
          ))}
        </div>
      )}

      {proposals.length > 0 && (
        <Card className="border-blue-100">
          <CardContent className="p-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                Los gastos fijos confirmados crean un movimiento de tipo{" "}
                <span className="font-mono">Gasto</span> en la hoja{" "}
                <span className="font-mono">Movimientos</span> con ID{" "}
                <span className="font-mono">TX-FIJO-YYYY-MM-fijoId</span> para
                evitar duplicados.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                Puedes ajustar el importe, la cuenta, la fecha o la categoria
                antes de confirmar. El historial de meses anteriores no se
                modifica.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={pendingUnconfirm !== null}
        onOpenChange={(open) => !open && setPendingUnconfirm(null)}
        title="Desconfirmar gasto fijo"
        description={
          pendingUnconfirm
            ? `¿Desconfirmar el gasto fijo "${pendingUnconfirm.fijo.concepto}" de ${selectedMonth}? Se eliminara el movimiento del mes.`
            : ""
        }
        confirmLabel="Desconfirmar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={confirmUnconfirm}
      />
    </div>
  );
}

interface PendingRowProps {
  proposal: ReturnType<typeof buildProposal>;
  draft: DraftState;
  categories: Array<{ nombre: string }>;
  accounts: Array<{ cuentaId: string; nombre: string }>;
  onChange: (partial: Partial<DraftState>) => void;
  onEdit: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirming: boolean;
}

function PendingRow({
  proposal,
  draft,
  categories,
  accounts,
  onChange,
  onEdit,
  onCancel,
  onConfirm,
  confirming,
}: PendingRowProps) {
  const { fijo, proposedImporte, proposedCategoria, proposedCuentaOrigen } =
    proposal;
  const isEditing = draft.editing;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium text-sm">{fijo.concepto}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {frequencyLabels[fijo.frecuencia] ?? fijo.frecuencia}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {proposedCategoria} · {proposedCuentaOrigen || "Sin cuenta"}
              </span>
            </div>
          </div>
          <p className="text-lg font-bold text-expense whitespace-nowrap">
            {proposedImporte.toFixed(2)} €
          </p>
        </div>

        {isEditing ? (
          <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`importe-${fijo.fijoId}`}>Importe (€)</Label>
                <Input
                  id={`importe-${fijo.fijoId}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.importe}
                  onChange={(e) => onChange({ importe: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`fecha-${fijo.fijoId}`}>Fecha</Label>
                <Input
                  id={`fecha-${fijo.fijoId}`}
                  type="date"
                  value={draft.fecha}
                  onChange={(e) => onChange({ fecha: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`categoria-${fijo.fijoId}`}>Categoria</Label>
                <select
                  id={`categoria-${fijo.fijoId}`}
                  value={draft.categoria}
                  onChange={(e) => onChange({ categoria: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.nombre} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`cuenta-${fijo.fijoId}`}>Cuenta</Label>
                <select
                  id={`cuenta-${fijo.fijoId}`}
                  value={draft.cuentaOrigen}
                  onChange={(e) => onChange({ cuentaOrigen: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Selecciona...</option>
                  {accounts.map((a) => (
                    <option key={a.cuentaId} value={a.cuentaId}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`notas-${fijo.fijoId}`}>Notas</Label>
              <Input
                id={`notas-${fijo.fijoId}`}
                value={draft.notas}
                onChange={(e) => onChange({ notas: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={confirming}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={onConfirm}
                disabled={confirming}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {confirming ? "Confirmando..." : "Confirmar"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="gap-2"
                disabled={confirming}
              >
                <Pencil className="h-4 w-4" />
                Ajustar
              </Button>
              <Button
                size="sm"
                onClick={onConfirm}
                disabled={confirming}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ConfirmedRowProps {
  proposal: ReturnType<typeof buildProposal>;
  onUnconfirm: () => void;
  unconfirming: boolean;
}

function ConfirmedRow({ proposal, onUnconfirm, unconfirming }: ConfirmedRowProps) {
  const { fijo } = proposal;
  return (
    <Card className="overflow-hidden border-green-200">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="font-medium text-sm">{fijo.concepto}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {fijo.categoria} · {fijo.cuentaOrigen || "Sin cuenta"}
            </p>
          </div>
          <p className={cn("text-lg font-bold text-expense whitespace-nowrap")}>
            {fijo.importe.toFixed(2)} €
          </p>
        </div>
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUnconfirm}
            disabled={unconfirming}
            className="gap-2 text-destructive"
          >
            <XCircle className="h-4 w-4" />
            {unconfirming ? "Desconfirmando..." : "Desconfirmar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
