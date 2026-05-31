"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import {
  useTransactions,
  useDeleteTransaction,
  useUpdateTransaction,
} from "@/features/transactions/hooks/use-transactions";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { PlusIcon, PencilIcon, TrashIcon, XIcon } from "lucide-react";
import {
  calculateMonthlyBalance,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
} from "@/lib/finance/calculations";
import { TransactionType } from "@/constants/enums";

const typeOptions = [
  { value: "", label: "Todos" },
  { value: TransactionType.INGRESO, label: "Ingreso" },
  { value: TransactionType.GASTO, label: "Gasto" },
  { value: TransactionType.AHORRO, label: "Ahorro" },
  { value: TransactionType.TRANSFERENCIA_INTERNA, label: "Transferencia" },
];

export default function TransactionsPage() {
  const { sheetId } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7),
  );
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [search, setSearch] = useState("");

  const {
    data: transactions,
    isLoading,
    isError,
    error,
  } = useTransactions(sheetId, selectedMonth);
  const { data: categories } = useCategories(sheetId);
  const { data: accounts } = useAccounts(sheetId);
  const deleteTransaction = useDeleteTransaction(sheetId);
  const updateTransaction = useUpdateTransaction(sheetId);

  const categoryOptions = [
    { value: "", label: "Todas" },
    ...(categories ?? []).map((c) => ({ value: c.nombre, label: c.nombre })),
  ];

  const accountOptions = [
    { value: "", label: "Todas" },
    ...(accounts ?? []).map((a) => ({ value: a.nombre, label: a.nombre })),
  ];

  let filtered = transactions ?? [];

  if (filterType) {
    filtered = filtered.filter((t) => t.tipo === filterType);
  }
  if (filterCategory) {
    filtered = filtered.filter((t) => t.categoria === filterCategory);
  }
  if (filterAccount) {
    filtered = filtered.filter(
      (t) =>
        t.cuentaOrigen === filterAccount || t.cuentaDestino === filterAccount,
    );
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.concepto.toLowerCase().includes(q) ||
        t.notas.toLowerCase().includes(q),
    );
  }

  const balance = calculateMonthlyBalance(
    filtered.map((t) => ({ tipo: t.tipo, importe: t.importe })),
  );
  const income = calculateMonthlyIncome(
    filtered.map((t) => ({ tipo: t.tipo, importe: t.importe })),
  );
  const expenses = calculateMonthlyExpenses(
    filtered.map((t) => ({ tipo: t.tipo, importe: t.importe })),
  );

  const editingTransaction = editingId
    ? filtered.find((t) => t.id === editingId)
    : null;

  async function handleDelete(id: string) {
    if (!confirm("Borrar este movimiento?")) return;
    try {
      await deleteTransaction.mutateAsync(id);
    } catch (e) {
      console.error("Error deleting:", e);
    }
  }

  async function handleEditSave(
    data: Parameters<typeof updateTransaction.mutateAsync>[0],
  ) {
    try {
      await updateTransaction.mutateAsync(data);
      setEditingId(null);
    } catch (e) {
      console.error("Error updating:", e);
    }
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
          }}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm flex-1"
        />
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="flex gap-2">
        <Select
          options={typeOptions}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="flex-1"
        />
        <Select
          options={categoryOptions}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-lg font-semibold text-green-600">
              {income.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="text-lg font-semibold text-red-600">
              {expenses.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p
              className={`text-lg font-semibold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {showForm && !editingId && (
        <TransactionForm
          sheetId={sheetId}
          categories={categories ?? []}
          accounts={accounts ?? []}
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingId && editingTransaction && (
        <TransactionForm
          sheetId={sheetId}
          categories={categories ?? []}
          accounts={accounts ?? []}
          initialData={editingTransaction}
          onSuccess={() => {
            setEditingId(null);
            setShowForm(false);
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {isLoading && <LoadingState message="Cargando movimientos..." />}

      {isError && (
        <ErrorState message={(error as Error)?.message ?? "Error al cargar"} />
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          title="Sin movimientos"
          description={`No hay movimientos para ${selectedMonth}. Empieza añadiendo el primero.`}
          type="empty"
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">
                        {t.concepto}
                      </span>
                      <Badge
                        variant={
                          t.tipo === "Ingreso"
                            ? "success"
                            : t.tipo === "Gasto"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {t.tipo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.fecha}
                      {t.categoria && ` · ${t.categoria}`}
                      {t.cuentaOrigen && ` · ${t.cuentaOrigen}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId(t.id);
                        setShowForm(false);
                      }}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </button>
                    <p
                      className={`font-semibold ${
                        t.tipo === "Ingreso"
                          ? "text-green-600"
                          : "text-foreground"
                      }`}
                    >
                      {t.tipo === "Ingreso" ? "+" : "-"}
                      {Number(t.importe).toFixed(2)}
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
