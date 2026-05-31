"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from "@/features/accounts/hooks/use-accounts";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { AccountType } from "@/constants/enums";
import type { AccountRow } from "@/types/models";

const accountTypes = [
  { value: AccountType.BANCO, label: "Banco" },
  { value: AccountType.EFECTIVO, label: "Efectivo" },
  { value: AccountType.VIRTUAL, label: "Virtual" },
  { value: AccountType.OTRO, label: "Otro" },
];

const currencies = [
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "JPY", label: "JPY" },
  { value: "MXN", label: "MXN" },
  { value: "ARS", label: "ARS" },
];

function AccountForm({
  initialData,
  onSuccess,
  onCancel,
}: {
  initialData?: AccountRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const { sheetId } = useAppStore();
  const createAccount = useCreateAccount(sheetId);
  const updateAccount = useUpdateAccount(sheetId);
  const isEditing = !!initialData;

  const [nombre, setNombre] = useState(initialData?.nombre ?? "");
  const [tipo, setTipo] = useState(initialData?.tipo ?? AccountType.BANCO);
  const [moneda, setMoneda] = useState(initialData?.moneda ?? "EUR");
  const [saldoInicial, setSaldoInicial] = useState(
    initialData?.saldoInicial?.toString() ?? "0",
  );
  const [saldoActualManual, setSaldoActualManual] = useState(
    initialData?.saldoActualManual?.toString() ?? "0",
  );
  const [incluirDashboard, setIncluirDashboard] = useState(
    initialData?.incluirDashboard ?? "S",
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
        moneda,
        saldoInicial: Number(saldoInicial) || 0,
        saldoActualManual: Number(saldoActualManual) || 0,
        incluirDashboard: incluirDashboard === "S",
        color,
        notas,
      };

      if (isEditing && initialData) {
        await updateAccount.mutateAsync({
          ...data,
          cuentaId: initialData.cuentaId,
        } as Parameters<typeof updateAccount.mutateAsync>[0]);
      } else {
        await createAccount.mutateAsync(
          data as Parameters<typeof createAccount.mutateAsync>[0],
        );
      }
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la cuenta"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                options={accountTypes}
                value={tipo}
                onChange={(e) => setTipo(e.target.value as AccountType)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                options={currencies}
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Saldo inicial</Label>
              <Input
                type="number"
                step="0.01"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Saldo actual manual</Label>
              <Input
                type="number"
                step="0.01"
                value={saldoActualManual}
                onChange={(e) => setSaldoActualManual(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Input
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : isEditing
                  ? "Actualizar"
                  : "Crear"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AccountsPage() {
  const { sheetId } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: accounts, isLoading, isError, error } = useAccounts(sheetId);
  const deleteAccount = useDeleteAccount(sheetId);

  const activeAccounts = (accounts ?? []).filter(
    (a) => a.incluirDashboard === "S",
  );

  const editingAccount = editingId
    ? (accounts ?? []).find((a) => a.cuentaId === editingId)
    : null;

  async function handleDelete(cuentaId: string) {
    if (!confirm("Desactivar esta cuenta?")) return;
    try {
      await deleteAccount.mutateAsync(cuentaId);
    } catch (e) {
      console.error("Error:", e);
    }
  }

  return (
    <div className="px-4 py-6 space-y-4">
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
          description="Añade tus cuentas para hacer seguimiento de tus balances."
          type="empty"
        />
      )}

      {!isLoading && !isError && activeAccounts.length > 0 && (
        <div className="space-y-2">
          {activeAccounts.map((account) => (
            <Card key={account.cuentaId}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {account.color && (
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: account.color }}
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm">{account.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {account.tipo} · {account.moneda}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId(account.cuentaId);
                        setShowForm(false);
                      }}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.cuentaId)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </button>
                    <p className="font-semibold">
                      {Number(account.saldoActualManual).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
