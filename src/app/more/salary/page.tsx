"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/stores/app-store";
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  ChevronLeft,
  AlertCircle,
  Building2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import {
  useSalaryConfig,
  useUpdateSalaryConfig,
  useSaveVariableSalary,
} from "@/features/salary/hooks/use-salary";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import {
  buildSalaryMovementId,
  EMPTY_SALARY_CONFIG,
  validateSalaryConfig,
  type SalaryConfigRecord,
  type SalaryType,
} from "@/lib/finance/salary";
import { generateMonthKey } from "@/lib/sheets/adapters";

const SALARY_DAY_MAX = 28;
const ACTIVE_ACCOUNTS_ONLY = true;

export default function SalaryPage() {
  const { sheetId, setMonthlyIncome } = useAppStore();
  const { success, error: showError, warning } = useToast();

  const { data: accounts = [] } = useAccounts(sheetId);
  const { data: salaryConfig, isLoading: loadingConfig } = useSalaryConfig(sheetId);
  const updateConfig = useUpdateSalaryConfig(sheetId);
  const saveVariable = useSaveVariableSalary(sheetId);

  const currentMonth = useMemo(() => generateMonthKey(new Date().toISOString()), []);
  const { data: monthTransactions } = useTransactions(sheetId, currentMonth);

  const initialConfig: SalaryConfigRecord = salaryConfig ?? EMPTY_SALARY_CONFIG;

  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [type, setType] = useState<SalaryType>(initialConfig.type);
  const [fixedAmount, setFixedAmount] = useState(
    initialConfig.fixedAmount > 0 ? String(initialConfig.fixedAmount) : "",
  );
  const [day, setDay] = useState(String(initialConfig.day));
  const [destinationAccount, setDestinationAccount] = useState(
    initialConfig.destinationAccount,
  );
  const [description, setDescription] = useState(initialConfig.description);
  const [variableAmount, setVariableAmount] = useState("");
  const [configInitialized, setConfigInitialized] = useState(false);

  useEffect(() => {
    if (salaryConfig && !configInitialized) {
      setEnabled(salaryConfig.enabled);
      setType(salaryConfig.type);
      setFixedAmount(
        salaryConfig.fixedAmount > 0 ? String(salaryConfig.fixedAmount) : "",
      );
      setDay(String(salaryConfig.day));
      setDestinationAccount(salaryConfig.destinationAccount);
      setDescription(salaryConfig.description);
      setConfigInitialized(true);
    }
  }, [salaryConfig, configInitialized]);

  const availableAccounts = useMemo(
    () => accounts.filter((a) => (ACTIVE_ACCOUNTS_ONLY ? a.activo === "S" : true)),
    [accounts],
  );

  const validation = useMemo(
    () =>
      validateSalaryConfig(
        {
          enabled,
          type,
          fixedAmount: Number(enabled && type === "fixed" ? fixedAmount : 0) || 0,
          day: Number(day) || 1,
          destinationAccount,
          description,
          updatedAt: initialConfig.updatedAt,
        },
        accounts,
      ),
    [enabled, type, fixedAmount, day, destinationAccount, description, accounts, initialConfig.updatedAt],
  );

  const variableSalaryMovement = useMemo(() => {
    if (!monthTransactions) return null;
    const id = buildSalaryMovementId(currentMonth);
    return monthTransactions.find((t) => t.id === id) ?? null;
  }, [monthTransactions, currentMonth]);

  async function handleSaveConfig() {
    if (!sheetId) {
      showError("Conecta una hoja de Google antes de guardar la nomina.");
      return;
    }

    const fixedAmountNum = Number(fixedAmount) || 0;
    const dayNum = Math.max(1, Math.min(SALARY_DAY_MAX, Math.floor(Number(day) || 1)));

    const draft: SalaryConfigRecord = {
      enabled,
      type,
      fixedAmount: fixedAmountNum,
      day: dayNum,
      destinationAccount,
      description: description.trim() || "Nomina mensual",
      updatedAt: new Date().toISOString(),
    };

    const check = validateSalaryConfig(draft, accounts);
    if (!check.valid) {
      showError(check.error ?? "Configuracion invalida.");
      return;
    }

    try {
      await updateConfig.mutateAsync(draft);
      setMonthlyIncome(draft.enabled ? draft.fixedAmount : 0, draft.type);
      success("Configuracion de nomina guardada.");
    } catch (e) {
      showError(`Error al guardar la nomina: ${(e as Error).message}`);
    }
  }

  async function handleSaveVariableMonth() {
    if (!sheetId) {
      showError("Conecta una hoja de Google antes de guardar la nomina.");
      return;
    }
    const amount = Number(variableAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      warning("Introduce un importe valido.");
      return;
    }
    if (!destinationAccount) {
      showError("Selecciona una cuenta de destino para la nomina.");
      return;
    }
    try {
      const result = await saveVariable.mutateAsync({
        monthKey: currentMonth,
        amount,
        destinationAccount,
        description: description.trim() || undefined,
        day: Math.max(1, Math.min(SALARY_DAY_MAX, Math.floor(Number(day) || 1))),
      });
      const message = result.updated
        ? "Nomina del mes actualizada."
        : "Nomina del mes guardada.";
      success(message);
      setVariableAmount("");
    } catch (e) {
      showError(`Error al guardar la nomina del mes: ${(e as Error).message}`);
    }
  }

  const noAccounts = availableAccounts.length === 0;
  const showVariablePanel = enabled && type === "variable";

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/more" className="p-2 -ml-2 rounded-lg hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nomina mensual</h1>
      </div>

      {noAccounts && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 space-y-1">
              <p className="font-medium">No tienes cuentas activas.</p>
              <p>
                Crea al menos una cuenta en la seccion de Cuentas antes de
                guardar la nomina. La nomina necesita una cuenta de destino.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Configura tu nomina</h2>
            <p className="text-sm text-muted-foreground">
              La configuracion se guarda en tu Google Sheet (hoja Config) y la
              nomina se anade como movimiento de ingreso en la cuenta que
              elijas.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="font-medium text-sm">Nomina activa</p>
              <p className="text-xs text-muted-foreground">
                Cuando esta activa, se anadira automaticamente la nomina fija o
                gestionaras la variable.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="space-y-3">
            <Label>Tipo de nomina</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("fixed")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  type === "fixed"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-medium">Fija</span>
                <span className="text-xs text-muted-foreground text-center">
                  Se anade automaticamente cada mes
                </span>
              </button>
              <button
                type="button"
                onClick={() => setType("variable")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  type === "variable"
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

          {type === "fixed" && (
            <div className="space-y-2">
              <Label htmlFor="fixed-amount">Importe mensual (€)</Label>
              <Input
                id="fixed-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="2000.00"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                className="text-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="salary-day">Dia del mes</Label>
              <Input
                id="salary-day"
                type="number"
                min="1"
                max={SALARY_DAY_MAX}
                step="1"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Entre 1 y {SALARY_DAY_MAX} (limite seguro para todos los meses).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Concepto</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nomina mensual"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination-account">Cuenta de destino</Label>
            <select
              id="destination-account"
              value={destinationAccount}
              onChange={(e) => setDestinationAccount(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              disabled={noAccounts}
            >
              <option value="">Selecciona una cuenta...</option>
              {availableAccounts.map((a) => (
                <option key={a.cuentaId} value={a.cuentaId}>
                  {a.nombre}
                </option>
              ))}
            </select>
            {noAccounts && (
              <p className="text-xs text-muted-foreground">
                Crea primero una cuenta en la seccion Cuentas.
              </p>
            )}
          </div>

          {!validation.valid && validation.error && (
            <p className="text-sm text-destructive">{validation.error}</p>
          )}

          <Button
            onClick={handleSaveConfig}
            disabled={updateConfig.isPending || !validation.valid || noAccounts}
            className="w-full gap-2 text-base py-6"
            size="lg"
          >
            <DollarSign className="h-5 w-5" />
            {updateConfig.isPending ? "Guardando..." : "Guardar configuracion"}
          </Button>
        </CardContent>
      </Card>

      {showVariablePanel && (
        <Card className="border-blue-100">
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="text-base font-semibold">Nomina de {currentMonth}</h3>
              <p className="text-sm text-muted-foreground">
                Guarda o actualiza la nomina del mes actual. Si ya existe, se
                sobreescribe el importe.
              </p>
            </div>

            {variableSalaryMovement ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1 text-sm text-green-800">
                <p className="font-medium">Nomina del mes guardada</p>
                <p>
                  Importe: {variableSalaryMovement.importe.toFixed(2)} € -
                  Fecha: {variableSalaryMovement.fecha}
                </p>
                <p className="text-xs">
                  ID: <span className="font-mono">{variableSalaryMovement.id}</span>
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                Aun no has guardado la nomina de este mes.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="variable-amount">Importe de {currentMonth} (€)</Label>
              <Input
                id="variable-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={variableAmount}
                onChange={(e) => setVariableAmount(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSaveVariableMonth}
              disabled={
                saveVariable.isPending ||
                !destinationAccount ||
                !variableAmount ||
                Number(variableAmount) <= 0
              }
              className="w-full gap-2"
            >
              <Building2 className="h-4 w-4" />
              {saveVariable.isPending
                ? "Guardando..."
                : variableSalaryMovement
                  ? "Actualizar nomina del mes"
                  : "Guardar nomina del mes"}
            </Button>
          </CardContent>
        </Card>
      )}

      {enabled && type === "fixed" && (
        <Card className="border-green-100">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <p className="font-medium text-sm">Nomina fija activa</p>
            </div>
            <p className="text-xs text-green-700">
              Se anadira automaticamente como movimiento de ingreso el dia{" "}
              {day || 1} de cada mes en la cuenta seleccionada. Si abres la app
              en cualquier dia del mes y la nomina aun no existe, se creara.
            </p>
            <p className="text-xs text-green-700">
              La nomina nunca se duplica: usa un ID unico por mes.
            </p>
          </CardContent>
        </Card>
      )}

      {!enabled && !loadingConfig && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            La nomina esta desactivada. Activala para que la app pueda anadir
            automaticamente tu ingreso mensual o gestionar la nomina variable.
          </CardContent>
        </Card>
      )}

      <Card className="border-blue-100">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-medium text-sm">Como funciona?</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>
                La configuracion de nomina se guarda en tu Google Sheet
                (hoja <span className="font-mono">Config</span>), no solo en
                el navegador.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>
                La nomina se registra como movimiento de ingreso con un ID
                determinista (<span className="font-mono">TX-SALARY-YYYY-MM</span>)
                para evitar duplicados aunque recargues la app.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>
                La cuenta de destino es obligatoria. Si la cuenta seleccionada
                deja de existir, la app te pedira que elijas otra.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
