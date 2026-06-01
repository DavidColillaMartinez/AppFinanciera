"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/stores/app-store";
import { clearToken } from "@/lib/sheets/client";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  RefreshCw,
  Unlink,
  Link,
  LogOut,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function PreferenciasPage() {
  const { sheetId, sheetUrl, isConnected, disconnect, monthlyIncome, incomeType, lastIncomeSetMonth, setMonthlyIncome } = useAppStore();
  const router = useRouter();
  const { success, error: showError, warning } = useToast();
  const [incomeInput, setIncomeInput] = useState(monthlyIncome > 0 ? monthlyIncome.toString() : "");
  const [incomeMode, setIncomeMode] = useState<"fixed" | "variable">(
    monthlyIncome > 0 ? incomeType : "fixed"
  );
  const [isSavingIncome, setIsSavingIncome] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  function handleChangeSheet() {
    disconnect();
    router.push("/onboarding?step=sheet");
  }

  function handleDisconnectSheet() {
    if (confirm("¿Desconectar la Sheet? La sesion de Google se mantiene.")) {
      disconnect();
      router.push("/onboarding?step=sheet");
      success("Sheet desconectada");
    }
  }

  function handleDisconnectGoogle() {
    if (confirm("¿Cerrar sesion de Google? Tendras que volver a iniciar sesion.")) {
      clearToken();
      disconnect();
      window.location.href = "/onboarding";
    }
  }

  function handleSaveIncome() {
    const amount = parseFloat(incomeInput);
    if (isNaN(amount) || amount <= 0) {
      warning("Introduce un importe valido");
      return;
    }

    setIsSavingIncome(true);
    try {
      setMonthlyIncome(amount, incomeMode);
      success(
        incomeMode === "fixed"
          ? "Nomina fija guardada"
          : "Nomina variable guardada. La tendras que actualizar cada mes."
      );
    } catch (e) {
      showError("Error al guardar la nomina");
    } finally {
      setIsSavingIncome(false);
    }
  }

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Preferencias</h1>
        <a
          href="/settings"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Categorias
        </a>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Nomina mensual
        </h2>

        <Card>
          <CardContent className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Configura tu nomina mensual para calcular el plan de ahorro.
              Si es fija, se usara todos los meses. Si es variable, te pediremos actualizarla cada mes.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="income-amount">Importe mensual (€)</Label>
                <Input
                  id="income-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="2000.00"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de nomina</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={incomeMode === "fixed" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => setIncomeMode("fixed")}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Fija
                  </Button>
                  <Button
                    type="button"
                    variant={incomeMode === "variable" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => setIncomeMode("variable")}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Variable
                  </Button>
                </div>
              </div>
            </div>

            {incomeMode === "variable" && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                <p className="font-medium">Recordatorio</p>
                <p className="mt-1">
                  Tu nomina es variable. Te recordaremos actualizarla al inicio de cada mes.
                </p>
              </div>
            )}

            {monthlyIncome > 0 && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                <p className="font-medium">Ultima actualizacion</p>
                <p className="mt-1">
                  {incomeMode === "fixed" ? "Nomina fija" : "Nomina variable"}: {monthlyIncome.toFixed(2)} €
                  {lastIncomeSetMonth && (
                    <span> (mes: {lastIncomeSetMonth})</span>
                  )}
                </p>
              </div>
            )}

            <Button
              onClick={handleSaveIncome}
              disabled={isSavingIncome || !incomeInput}
              className="w-full gap-2"
            >
              <DollarSign className="h-4 w-4" />
              {isSavingIncome ? "Guardando..." : "Guardar nomina"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Conexion
        </h2>

        {isConnected && sheetId && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-income/10 p-2.5">
                  <FileSpreadsheet className="h-5 w-5 text-income" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Sheet conectada</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {sheetId}
                  </p>
                </div>
              </div>
              {sheetUrl && (
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Link className="h-4 w-4" />
                    Abrir en Google Sheets
                  </Button>
                </a>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleChangeSheet}
                >
                  <RefreshCw className="h-4 w-4" />
                  Cambiar Sheet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleDisconnectSheet}
                >
                  <Unlink className="h-4 w-4" />
                  Desconectar
                </Button>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2"
                onClick={handleDisconnectGoogle}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesion de Google
              </Button>
            </CardContent>
          </Card>
        )}

        {!isConnected && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-expense/10 p-2.5">
                  <Unlink className="h-5 w-5 text-expense" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Sin conexion</p>
                  <p className="text-xs text-muted-foreground">
                    Conecta tu Google Sheet
                  </p>
                </div>
              </div>
              <Button
                className="w-full mt-3 gap-2"
                onClick={() => {
                  window.location.href = "/onboarding";
                }}
              >
                <Link className="h-4 w-4" />
                Conectar Sheet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Informacion
        </h2>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Version de la app</span>
              <span className="text-sm font-medium">1.1.1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Moneda</span>
              <span className="text-sm font-medium">EUR</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}