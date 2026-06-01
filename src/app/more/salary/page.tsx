"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/stores/app-store";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  ChevronLeft,
  TrendingDown,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function SalaryPage() {
  const router = useRouter();
  const { monthlyIncome, incomeType, lastIncomeSetMonth, setMonthlyIncome } = useAppStore();
  const { success, error: showError, warning } = useToast();
  const [incomeInput, setIncomeInput] = useState(
    monthlyIncome > 0 ? monthlyIncome.toString() : ""
  );
  const [incomeMode, setIncomeMode] = useState<"fixed" | "variable">(
    monthlyIncome > 0 ? incomeType : "fixed"
  );
  const [isSavingIncome, setIsSavingIncome] = useState(false);

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
          ? "Nomina fija guardada. Se añadira automaticamente el dia 1 de cada mes."
          : "Nomina variable guardada. La tendras que actualizar cada mes."
      );
      router.push("/more");
    } catch (e) {
      showError("Error al guardar la nomina");
    } finally {
      setIsSavingIncome(false);
    }
  }

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/more" className="p-2 -ml-2 rounded-lg hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nomina mensual</h1>
      </div>

      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Configura tu nomina</h2>
            <p className="text-sm text-muted-foreground">
              Añade tu nomina mensual para calcular correctamente tu balance
              disponible y el plan de ahorro建議.
            </p>
          </div>

          <div className="space-y-4">
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
                className="text-lg"
              />
            </div>

            <div className="space-y-3">
              <Label>Tipo de nomina</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIncomeMode("fixed")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    incomeMode === "fixed"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="font-medium">Fija</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Se añade automaticamente el dia 1
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIncomeMode("variable")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    incomeMode === "variable"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <TrendingUp className="h-6 w-6" />
                  <span className="font-medium">Variable</span>
                  <span className="text-xs text-muted-foreground text-center">
                    La actualizas cada mes
                  </span>
                </button>
              </div>
            </div>

            {incomeMode === "variable" && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800">
                  <TrendingUp className="h-4 w-4" />
                  <p className="font-medium text-sm">Nomina variable</p>
                </div>
                <p className="text-xs text-amber-700">
                  Tu nomina cambia cada mes. Te recordaremos actualizarla al
                  inicio de cada mes para mantener los calculos precisos.
                </p>
              </div>
            )}

            {incomeMode === "fixed" && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="font-medium text-sm">Nomina fija</p>
                </div>
                <p className="text-xs text-green-700">
                  Tu nomina se añadira automaticamente como primer movimiento
                  el dia 1 de cada mes. No necesitas hacer nada mas.
                </p>
              </div>
            )}

            {monthlyIncome > 0 && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2">
                <p className="font-medium text-sm text-blue-800">
                  Configuracion actual
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Importe:</span>
                  <span className="font-medium text-blue-900">
                    {monthlyIncome.toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Tipo:</span>
                  <span className="font-medium text-blue-900">
                    {incomeType === "fixed" ? "Fija" : "Variable"}
                  </span>
                </div>
                {lastIncomeSetMonth && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Ultima actualizacion:</span>
                    <span className="text-blue-900">{lastIncomeSetMonth}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            onClick={handleSaveIncome}
            disabled={isSavingIncome || !incomeInput}
            className="w-full gap-2 text-base py-6"
            size="lg"
          >
            <DollarSign className="h-5 w-5" />
            {isSavingIncome ? "Guardando..." : "Guardar nomina"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-medium text-sm">Como funciona?</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>Tu nomina se usa para calcular cuanto dinero tienes disponible cada mes.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Con nomina fija, se añade automaticamente el dia 1 como movimiento de ingreso.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>El 20% de tu disponible se sugiere para ahorro cada mes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}