"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from "@/features/accounts/hooks/use-accounts";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { AccountRole, AccountType } from "@/constants/enums";
import { computeAllAccountBalances } from "@/lib/finance/account-balances";
import type { AccountRow } from "@/types/models";

const accountTypes = [
  { value: AccountType.BANCO, label: "Banco" },
  { value: AccountType.EFECTIVO, label: "Efectivo" },
  { value: AccountType.VIRTUAL, label: "Virtual" },
  { value: AccountType.OTRO, label: "Otro" },
];

const accountRoles = [
  { value: AccountRole.DIARIO, label: "Diario" },
  { value: AccountRole.FIJOS, label: "Fijos" },
  { value: AccountRole.AHORRO, label: "Ahorro" },
  { value: AccountRole.GENERAL, label: "General" },
];

const currencies = [
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "JPY", label: "JPY" },
  { value: "MXN", label: "MXN" },
  { value: "ARS", label: "ARS" },
];

interface AccountFormProps {
  initialData?: AccountRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function AccountForm({ initialData, onSuccess, onCancel }: AccountFormProps) {
  const { sheetId } = useAppStore();
  const createAccount = useCreateAccount(sheetId);
  const updateAccount = useUpdateAccount(sheetId);
  const { success, error: showError } = useToast();
  const isEditing = !!initialData;

  const [nombre, setNombre] = useState(initialData?.nombre ?? "");
  const [tipo, setTipo] = useState(initialData?.tipo ?? AccountType.BANCO);
  const [rol, setRol] = useState<string>(
    (initialData?.rol as string) ?? AccountRole.GENERAL,
  );
  const [moneda, setMoneda] = useState(initialData?.moneda ?? "EUR");
  const [saldoInicial, setSaldoInicial] = useState(
    initialData?.saldoInicial?.toString() ?? "0",
  );
  const [color, setColor] = useState(initialData?.color ?? "#10B981");
  const [notas, setNotas] = useState(initialData?.notas ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        nombre: nombre.trim(),
        tipo,
        rol,
        moneda,
        saldoInicial: Number(saldoInicial) || 0,
        incluirDashboard: true,
        color,
        notas,
      };

      if (isEditing && initialData) {
        await updateAccount.mutateAsync({
          ...data,
          cuentaId: initialData.cuentaId,
        } as Parameters<typeof updateAccount.mutateAsync>[0]);
        success("Cuenta actualizada correctamente");
      } else {
        await createAccount.mutateAsync(
          data as Parameters<typeof createAccount.mutateAsync>[0],
        );
        success("Cuenta creada correctamente");
      }
      onSuccess?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al guardar";
      setError(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="account-nombre">Nombre</Label>
              <Input
                id="account-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la cuenta"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-tipo">Tipo</Label>
              <Select
                id="account-tipo"
                options={accountTypes}
                value={tipo}
                onChange={(e) => setTipo(e.target.value as AccountType)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="account-rol">Rol</Label>
              <Select
                id="account-rol"
                options={accountRoles}
                value={rol}
                onChange={(e) => setRol(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-moneda">Moneda</Label>
              <Select
                id="account-moneda"
                options={currencies}
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="account-saldo">Saldo inicial</Label>
              <Input
                id="account-saldo"
                type="number"
                step="0.01"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Punto de partida. El saldo actual se calcula con los
                movimientos.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-color">Color</Label>
              <Input
                id="account-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-notas">Notas</Label>
            <Input
              id="account-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 sticky bottom-0 bg-background border-t pt-4 -mx-4 px-4 pb-1">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-11"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}
            <Button type="submit" className="flex-1 h-11" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : isEditing
                  ? "Actualizar"
                  : "Crear"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AccountsPage() {
  const { sheetId } = useAppStore();
  const { success, error: showError } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: accounts, isLoading, isError, error } = useAccounts(sheetId);
  const { data: allTransactions } = useTransactions(sheetId);
  const deleteAccount = useDeleteAccount(sheetId);

  const balances = useMemo(
    () => computeAllAccountBalances(accounts ?? [], allTransactions ?? []),
    [accounts, allTransactions],
  );

  const activeAccounts = (accounts ?? []).filter(
    (a) => a.incluirDashboard === "S",
  );

  const editingAccount = editingId
    ? (accounts ?? []).find((a) => a.cuentaId === editingId)
    : null;

  const pendingDeleteAccount = pendingDeleteId
    ? (accounts ?? []).find((a) => a.cuentaId === pendingDeleteId)
    : null;

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    try {
      await deleteAccount.mutateAsync(pendingDeleteId);
      success("Cuenta desactivada correctamente");
    } catch (e) {
      showError(
        `Error al desactivar la cuenta: ${(e as Error).message}`,
      );
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Cuentas</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
          }}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Nueva
        </Button>
      </div>

      {showForm && !editingId && (
        <AccountForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingId && editingAccount && (
        <AccountForm
          initialData={editingAccount}
          onSuccess={() => {
            setEditingId(null);
            setShowForm(false);
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {isLoading && <LoadingState message="Cargando cuentas..." />}

      {isError && (
        <ErrorState message={(error as Error)?.message ?? "Error al cargar"} />
      )}

      {!isLoading && !isError && activeAccounts.length === 0 && (
        <EmptyState
          title="Sin cuentas"
          description="Anade tus cuentas para hacer seguimiento de tus balances."
          type="empty"
        />
      )}

      {!isLoading && !isError && activeAccounts.length > 0 && (
        <div className="space-y-2">
          {activeAccounts.map((account) => {
            const balance = balances.get(account.cuentaId);
            const calculado = balance?.calculado ?? account.saldoInicial;
            return (
              <Card key={account.cuentaId}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {account.color && (
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: account.color }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {account.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {account.tipo} · {account.moneda}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        aria-label={`Editar ${account.nombre}`}
                        onClick={() => {
                          setEditingId(account.cuentaId);
                          setShowForm(false);
                        }}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Desactivar ${account.nombre}`}
                        onClick={() => setPendingDeleteId(account.cuentaId)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </button>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {Number(calculado).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Saldo calculado
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="outline">{account.rol}</Badge>
                    {balance && balance.saldoInicial !== 0 && (
                      <Badge variant="outline">
                        Inicial: {Number(balance.saldoInicial).toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        title="Desactivar cuenta"
        description={
          pendingDeleteAccount
            ? `Estas seguro de desactivar la cuenta "${pendingDeleteAccount.nombre}"? Los movimientos existentes no se eliminan, pero la cuenta dejara de aparecer en selectores y balances.`
            : "Estas seguro?"
        }
        confirmLabel="Desactivar"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
