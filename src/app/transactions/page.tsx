"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import {
  useTransactions,
  useDeleteTransaction,
} from "@/features/transactions/hooks/use-transactions";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  ArrowRightLeft,
  Search,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionType } from "@/constants/enums";
import { cn } from "@/lib/utils";

const typeOptions = [
  { value: "", label: "Todos" },
  { value: TransactionType.INGRESO, label: "Ingresos" },
  { value: TransactionType.GASTO, label: "Gastos" },
  { value: TransactionType.AHORRO, label: "Ahorros" },
  { value: TransactionType.TRANSFERENCIA_INTERNA, label: "Transferencias" },
];

const VALID_TRANSACTION_TYPES = new Set<string>(Object.values(TransactionType));

function TransactionsContent() {
  const { sheetId } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7),
  );

  const queryFilterType = useMemo(() => {
    const raw = searchParams.get("filterType") ?? "";
    return VALID_TRANSACTION_TYPES.has(raw) ? raw : "";
  }, [searchParams]);

  const queryMonth = useMemo(() => {
    const raw = searchParams.get("month") ?? "";
    return /^\d{4}-\d{2}$/.test(raw) ? raw : "";
  }, [searchParams]);

  const [filterType, setFilterType] = useState(queryFilterType);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (queryFilterType && queryFilterType !== filterType) {
      setFilterType(queryFilterType);
    }
    if (queryMonth && queryMonth !== selectedMonth) {
      setSelectedMonth(queryMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryFilterType, queryMonth]);

  const {
    data: transactions,
    isLoading,
    isError,
    error,
  } = useTransactions(sheetId, selectedMonth);
  const { data: categories } = useCategories(sheetId);
  const { data: accounts } = useAccounts(sheetId);
  const deleteTransaction = useDeleteTransaction(sheetId);

  function clearQueryFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("filterType");
    params.delete("month");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const activeQueryFilters = Boolean(queryFilterType || queryMonth);

  const categoryOptions = [
    { value: "", label: "Todas" },
    ...(categories ?? []).map((c) => ({ value: c.nombre, label: c.nombre })),
  ];

  function getAccountName(value: string): string {
    if (!value) return "";
    const account = accounts?.find(
      (a) => a.cuentaId === value || a.nombre === value,
    );
    return account?.nombre ?? value;
  }

  const accountOptions = [
    { value: "", label: "Todas" },
    ...(accounts ?? []).map((a) => ({ value: a.cuentaId, label: a.nombre })),
  ];

  const filtered = useMemo(() => {
    let result = transactions ?? [];

    if (filterType) {
      result = result.filter((t) => t.tipo === filterType);
    }
    if (filterCategory) {
      result = result.filter((t) => t.categoria === filterCategory);
    }
    if (filterAccount) {
      result = result.filter(
        (t) =>
          t.cuentaOrigen === filterAccount ||
          t.cuentaDestino === filterAccount ||
          accounts?.some(
            (a) =>
              a.cuentaId === filterAccount &&
              (t.cuentaOrigen === a.nombre ||
                t.cuentaDestino === a.nombre),
          ),
      );
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          (t.concepto || "").toLowerCase().includes(q) ||
          t.notas.toLowerCase().includes(q),
      );
    }

    return result;
  }, [transactions, filterType, filterCategory, filterAccount, search, accounts]);

  const income = useMemo(
    () =>
      filtered
        .filter((t) => t.tipo === "Ingreso")
        .reduce((acc, t) => acc + t.importe, 0),
    [filtered],
  );

  const expenses = useMemo(
    () =>
      filtered
        .filter((t) => t.tipo === "Gasto")
        .reduce((acc, t) => acc + t.importe, 0),
    [filtered],
  );

  const savings = useMemo(
    () =>
      filtered
        .filter((t) => t.tipo === "Ahorro")
        .reduce((acc, t) => acc + t.importe, 0),
    [filtered],
  );

  const balance = income - expenses - savings;

  const editingTransaction = editingId
    ? filtered.find((t) => t.id === editingId)
    : null;

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar este movimiento?")) return;
    try {
      await deleteTransaction.mutateAsync(id);
    } catch (e) {
      console.error("Error deleting:", e);
    }
  }

  function handleAddType(type: TransactionType) {
    if (type === TransactionType.AHORRO) {
      router.push("/savings/monthly");
      return;
    }
    setSelectedType(type);
    setEditingId(null);
    setShowForm(true);
  }

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-sm text-muted-foreground">
            Gestión completa de transacciones
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button
          size="sm"
          variant="income"
          className="gap-1"
          onClick={() => handleAddType(TransactionType.INGRESO)}
        >
          <ArrowDownLeft className="h-4 w-4" />
          Ingreso
        </Button>
        <Button
          size="sm"
          variant="expense"
          className="gap-1"
          onClick={() => handleAddType(TransactionType.GASTO)}
        >
          <ArrowUpRight className="h-4 w-4" />
          Gasto
        </Button>
        <Button
          size="sm"
          className="gap-1 bg-savings hover:bg-savings/90"
          onClick={() => handleAddType(TransactionType.AHORRO)}
        >
          <PiggyBank className="h-4 w-4" />
          Ahorro
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => handleAddType(TransactionType.TRANSFERENCIA_INTERNA)}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Transf.
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            if (activeQueryFilters && queryMonth) clearQueryFilters();
          }}
          className="rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 flex-1"
        />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Select
          options={typeOptions}
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            if (activeQueryFilters) clearQueryFilters();
          }}
        />
        <Select
          options={categoryOptions}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        />
        <Select
          options={accountOptions}
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
        />
      </div>

      {activeQueryFilters && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Filtros desde el dashboard:</span>
          {queryFilterType && (
            <Badge variant="secondary" className="text-xs">
              {typeOptions.find((o) => o.value === queryFilterType)?.label ??
                queryFilterType}
            </Badge>
          )}
          {queryMonth && <Badge variant="secondary" className="text-xs">{queryMonth}</Badge>}
          <button
            onClick={clearQueryFilters}
            className="ml-auto text-primary hover:underline"
          >
            Limpiar
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="card-income">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Ingresos
            </p>
            <p className="text-lg font-bold text-income">+{income.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="card-expense">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Gastos
            </p>
            <p className="text-lg font-bold text-expense">-{expenses.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="card-savings">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Ahorro
            </p>
            <p className="text-lg font-bold text-savings">+{savings.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Balance
            </p>
            <p
              className={cn(
                "text-lg font-bold",
                balance >= 0 ? "text-income" : "text-expense",
              )}
            >
              {balance >= 0 ? "+" : ""}
              {balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

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
            <Card key={t.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        "rounded-lg p-2",
                        t.tipo === "Ingreso"
                          ? "bg-income/10"
                          : t.tipo === "Gasto"
                            ? "bg-expense/10"
                            : t.tipo === "Ahorro"
                              ? "bg-savings/10"
                              : "bg-muted",
                      )}
                    >
                      {t.tipo === "Ingreso" ? (
                        <ArrowDownLeft className="h-4 w-4 text-income" />
                      ) : t.tipo === "Gasto" ? (
                        <ArrowUpRight className="h-4 w-4 text-expense" />
                      ) : t.tipo === "Ahorro" ? (
                        <PiggyBank className="h-4 w-4 text-savings" />
                      ) : (
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {t.concepto || (t.tipo === "Ingreso" ? "Ingreso" : t.tipo === "Gasto" ? "Gasto" : t.tipo === "Transferencia interna" ? "Transferencia" : t.tipo)}
                        </span>
                        <Badge
                          variant={
                            t.tipo === "Ingreso"
                              ? "success"
                              : t.tipo === "Gasto"
                                ? "destructive"
                                : t.tipo === "Ahorro"
                                  ? "outline"
                                  : "outline"
                          }
                          className={cn(
                            "text-xs",
                            t.tipo === "Ahorro" && "text-savings border-savings/30",
                            t.tipo === "Transferencia interna" && "text-muted-foreground",
                          )}
                        >
                          {t.tipo}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.fecha}
                        {t.categoria && ` · ${t.categoria}`}
                        {t.cuentaOrigen && ` · ${getAccountName(t.cuentaOrigen)}`}
                        {t.cuentaDestino && ` → ${getAccountName(t.cuentaDestino)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedType(null);
                        setEditingId(t.id);
                        setShowForm(true);
                      }}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                    <p
                      className={cn(
                        "font-semibold text-sm min-w-[80px] text-right",
                        t.tipo === "Ingreso"
                          ? "text-income"
                          : t.tipo === "Gasto"
                            ? "text-expense"
                            : t.tipo === "Ahorro"
                              ? "text-savings"
                              : "text-muted-foreground",
                      )}
                    >
                      {t.tipo === "Ingreso" ? "+" : t.tipo === "Gasto" || t.tipo === "Ahorro" ? "-" : ""}
                      {Number(t.importe).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction
                ? "Editar movimiento"
                : selectedType === TransactionType.INGRESO
                  ? "Nuevo ingreso"
                  : selectedType === TransactionType.GASTO
                    ? "Nuevo gasto"
                    : selectedType === TransactionType.AHORRO
                      ? "Nuevo ahorro"
                      : "Nueva transferencia"}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            sheetId={sheetId}
            categories={categories ?? []}
            accounts={accounts ?? []}
            initialData={editingTransaction ?? undefined}
            defaultType={!editingTransaction && selectedType ? selectedType : undefined}
            onSuccess={() => {
              setShowForm(false);
              setEditingId(null);
              setSelectedType(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
              setSelectedType(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={<LoadingState message="Cargando movimientos..." />}
    >
      <TransactionsContent />
    </Suspense>
  );
}
