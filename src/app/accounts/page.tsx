"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { PlusIcon } from "lucide-react";

export default function AccountsPage() {
  const { sheetId } = useAppStore();
  const [showForm, setShowForm] = useState(false);

  const { data: accounts, isLoading, isError, error } = useAccounts(sheetId);

  const activeAccounts = (accounts ?? []).filter(
    (a) => a.incluirDashboard === "S",
  );

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Cuentas</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Nueva
        </Button>
      </div>

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
                        className="w-4 h-4 rounded-full"
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
                  <div className="text-right">
                    <p className="font-semibold">
                      {Number(account.saldoActualManual).toFixed(2)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {account.tipo}
                    </Badge>
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
