"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { PlusIcon } from "lucide-react";
import {
  calculateMonthlyBalance,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
} from "@/lib/finance/calculations";

export default function TransactionsPage() {
  const { sheetId } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7),
  );

  const {
    data: transactions,
    isLoading,
    isError,
    error,
  } = useTransactions(sheetId, selectedMonth);

  const filteredTransactions = transactions ?? [];

  const balance = calculateMonthlyBalance(
    filteredTransactions.map((t) => ({ tipo: t.tipo, importe: t.importe })),
  );
  const income = calculateMonthlyIncome(
    filteredTransactions.map((t) => ({ tipo: t.tipo, importe: t.importe })),
  );
  const expenses = calculateMonthlyExpenses(
    filteredTransactions.map((t) => ({ tipo: t.tipo, importe: t.importe })),
  );

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
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

      {showForm && (
        <TransactionForm
          sheetId={sheetId}
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {isLoading && <LoadingState message="Cargando movimientos..." />}

      {isError && (
        <ErrorState message={(error as Error)?.message ?? "Error al cargar"} />
      )}

      {!isLoading && !isError && filteredTransactions.length === 0 && (
        <EmptyState
          title="Sin movimientos"
          description={`No hay movimientos para ${selectedMonth}. Empieza añadiendo el primero.`}
          type="empty"
        />
      )}

      {!isLoading && !isError && filteredTransactions.length > 0 && (
        <div className="space-y-2">
          {filteredTransactions.map((t) => (
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
                              ? "danger"
                              : "outline"
                        }
                      >
                        {t.tipo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.fecha} {t.categoria && `· ${t.categoria}`}
                    </p>
                  </div>
                  <div className="text-right">
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
