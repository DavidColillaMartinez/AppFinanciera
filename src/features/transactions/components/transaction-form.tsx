"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  transactionCreateSchema,
  transactionUpdateSchema,
  type TransactionCreateInput,
} from "@/schemas/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionType, CategoryType } from "@/constants/enums";
import { PAYMENT_METHOD_OPTIONS, PaymentMethod } from "@/constants/payment-methods";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "../hooks/use-transactions";
import type { TransactionRow, CategoryRow, AccountRow } from "@/types/models";
import { useToast } from "@/components/ui/toast";
import { FormField } from "@/components/forms/form-field";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AlertCircle, PiggyBank } from "lucide-react";

const transactionTypes = [
  { value: TransactionType.INGRESO, label: "Ingreso" },
  { value: TransactionType.GASTO, label: "Gasto" },
  { value: TransactionType.TRANSFERENCIA_INTERNA, label: "Transferencia" },
];

interface TransactionFormProps {
  sheetId: string | null;
  categories: CategoryRow[];
  accounts: AccountRow[];
  initialData?: TransactionRow;
  defaultType?: TransactionType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({
  sheetId,
  categories,
  accounts,
  initialData,
  defaultType,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const isEditing = !!initialData?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTypeOverride, setSelectedTypeOverride] = useState<TransactionType | null>(
    null,
  );
  const { success, error: showError } = useToast();
  const router = useRouter();
  const createTransaction = useCreateTransaction(sheetId);
  const updateTransaction = useUpdateTransaction(sheetId);

  const defaultValues: TransactionCreateInput = initialData && isEditing
    ? {
        fecha: initialData.fecha,
        concepto: initialData.concepto,
        tipo: initialData.tipo,
        categoria: initialData.categoria,
        importe: initialData.importe,
        metodo: initialData.metodo || "",
        cuentaOrigen: initialData.cuentaOrigen,
        cuentaDestino: initialData.cuentaDestino,
        notas: initialData.notas,
        reservaId: initialData.reservaId,
      }
    : {
        fecha: new Date().toISOString().split("T")[0],
        concepto: "",
        tipo: defaultType === TransactionType.AHORRO
          ? TransactionType.GASTO
          : (defaultType ?? TransactionType.GASTO),
        categoria: "",
        importe: 0,
        metodo: "",
        cuentaOrigen: "",
        cuentaDestino: "",
        notas: "",
        reservaId: "",
      };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      isEditing ? transactionUpdateSchema : transactionCreateSchema,
    ),
    defaultValues,
  });

  const selectedType = (selectedTypeOverride ?? watch("tipo")) as TransactionType;
  const isIncome = selectedType === TransactionType.INGRESO;
  const isExpense = selectedType === TransactionType.GASTO;
  const isTransfer = selectedType === TransactionType.TRANSFERENCIA_INTERNA;
  const showPaymentMethod = isExpense;
  const showCuentaOrigen = isExpense || isTransfer;
  const showCuentaDestino = isTransfer;
  const requireCuentaDestino = isIncome;
  const showIncomeEmptyAccounts = isIncome && accounts.length === 0;
  const showExpenseEmptyAccounts = (isExpense || isTransfer) && accounts.length === 0;

  const filteredCategories = useMemo(() => {
    if (isIncome) {
      const incomes = categories.filter(
        (c) => c.tipoHabitual === CategoryType.INGRESO,
      );
      return incomes.length > 0 ? incomes : categories;
    }
    if (isExpense) {
      const expenses = categories.filter(
        (c) => c.tipoHabitual === CategoryType.GASTO,
      );
      return expenses.length > 0 ? expenses : categories;
    }
    return categories;
  }, [categories, isIncome, isExpense]);

  const categoryOptions = [
    { value: "", label: "Sin categoria" },
    ...filteredCategories.map((c) => ({ value: c.nombre, label: c.nombre })),
  ];

  const accountOptions = [
    { value: "", label: accounts.length === 0 ? "Sin cuentas" : "Selecciona cuenta" },
    ...accounts.map((a) => ({
      value: a.nombre,
      label: `${a.nombre} (${a.tipo})`,
    })),
  ];

  const cuentaOrigenValue = watch("cuentaOrigen");
  const cuentaDestinoValue = watch("cuentaDestino");

  async function onSubmit(data: Record<string, unknown>) {
    setSubmitError(null);
    if (isTransfer) {
      const origen = (data.cuentaOrigen as string) ?? "";
      const destino = (data.cuentaDestino as string) ?? "";
      if (!origen) {
        setSubmitError("Selecciona la cuenta de origen.");
        return;
      }
      if (!destino) {
        setSubmitError("Selecciona la cuenta de destino.");
        return;
      }
      if (origen === destino) {
        setSubmitError("La cuenta de origen y destino no pueden ser la misma.");
        return;
      }
    }
    if (isIncome && !(data.cuentaDestino as string)) {
      setSubmitError("Selecciona la cuenta de destino para el ingreso.");
      return;
    }
    if (isExpense && !(data.cuentaOrigen as string)) {
      setSubmitError("Selecciona la cuenta de origen del gasto.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateTransaction.mutateAsync({
          ...data,
          id: initialData.id,
          tipo: data.tipo as TransactionRow["tipo"],
        } as Parameters<typeof updateTransaction.mutateAsync>[0]);
        success("Movimiento actualizado correctamente");
      } else {
        await createTransaction.mutateAsync(
          data as unknown as Parameters<typeof createTransaction.mutateAsync>[0],
        );
        success("Movimiento creado correctamente");
      }
      reset(defaultValues);
      onSuccess?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al guardar";
      setSubmitError(message);
      showError("Error al guardar el movimiento");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-base">
          {isEditing ? "Editar movimiento" : "Nuevo movimiento"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {submitError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {submitError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha" htmlFor="fecha" error={errors.fecha}>
              <Input id="fecha" type="date" className="h-11" {...register("fecha")} />
            </FormField>

            <FormField label="Tipo" htmlFor="tipo" error={errors.tipo}>
              <Select
                id="tipo"
                options={transactionTypes}
                value={selectedType ?? TransactionType.GASTO}
                onChange={(e) => {
                  setSelectedTypeOverride(null);
                  setValue("tipo", e.target.value as TransactionType, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  if (e.target.value === TransactionType.INGRESO) {
                    setValue("metodo", "");
                  }
                  if (e.target.value === TransactionType.TRANSFERENCIA_INTERNA) {
                    setValue("metodo", PaymentMethod.TRANSFERENCIA);
                  } else {
                    setValue("metodo", "");
                  }
                  setValue("cuentaOrigen", "");
                  setValue("cuentaDestino", "");
                }}
                disabled={isEditing}
                className="h-11"
              />
            </FormField>
          </div>

          {defaultType === TransactionType.AHORRO && !isEditing && (
            <div className="rounded-lg border border-savings/30 bg-savings/10 p-3 text-sm flex items-start gap-2">
              <PiggyBank className="h-4 w-4 text-savings mt-0.5 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="font-medium">Los ahorros se gestionan desde Ahorros.</p>
                <p className="text-muted-foreground text-xs">
                  Para reservar, aportar o retirar dinero de una reserva, objetivo
                  o pago futuro, usa la seccion de Ahorros. Asi queda todo
                  registrado en el libro de ahorro.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-1 gap-1"
                  onClick={() => {
                    onCancel?.();
                    router.push("/savings/monthly");
                  }}
                >
                  Ir a /savings/monthly
                </Button>
              </div>
            </div>
          )}

          <FormField label="Concepto" htmlFor="concepto" error={errors.concepto} required>
            <Input
              id="concepto"
              placeholder="Descripcion del movimiento"
              className="h-11"
              {...register("concepto")}
            />
          </FormField>

          <FormField label="Categoria" htmlFor="categoria" error={errors.categoria} required>
            <Select
              id="categoria"
              options={categoryOptions}
              value={watch("categoria") ?? ""}
              onChange={(e) => setValue("categoria", e.target.value)}
              disabled={filteredCategories.length === 0}
              className="h-11"
            />
            {filteredCategories.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Crea categorias en /settings antes de registrar movimientos.
              </p>
            )}
          </FormField>

          <FormField label="Importe (€)" htmlFor="importe" error={errors.importe} required>
            <Input
              id="importe"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="h-11"
              {...register("importe", { valueAsNumber: true })}
            />
          </FormField>

          {showPaymentMethod && (
            <FormField label="Metodo de pago" htmlFor="metodo" error={errors.metodo} required>
              <Select
                id="metodo"
                options={PAYMENT_METHOD_OPTIONS}
                value={watch("metodo") ?? (isTransfer ? PaymentMethod.TRANSFERENCIA : "")}
                onChange={(e) => setValue("metodo", e.target.value)}
                className="h-11"
              />
            </FormField>
          )}

          {showIncomeEmptyAccounts && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="font-medium">No tienes cuentas creadas.</p>
                <p className="text-muted-foreground">
                  Crea al menos una cuenta en /accounts para registrar ingresos.
                </p>
                <Link
                  href="/accounts"
                  className="text-primary font-medium hover:underline"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          )}

          {showExpenseEmptyAccounts && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="font-medium">No tienes cuentas creadas.</p>
                <p className="text-muted-foreground">
                  Crea al menos una cuenta en /accounts para registrar gastos y
                  transferencias.
                </p>
                <Link
                  href="/accounts"
                  className="text-primary font-medium hover:underline"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          )}

          {requireCuentaDestino && !isTransfer && (
            <FormField
              label="Cuenta destino"
              htmlFor="cuentaDestino"
              error={errors.cuentaDestino}
              required
            >
              <Select
                id="cuentaDestino"
                options={accountOptions}
                value={cuentaDestinoValue ?? ""}
                onChange={(e) => setValue("cuentaDestino", e.target.value)}
                disabled={accounts.length === 0}
                className="h-11"
              />
            </FormField>
          )}

          <div
            className={cn(
              "grid gap-4",
              showPaymentMethod && showCuentaOrigen ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {showCuentaOrigen && (
              <FormField
                label={isTransfer ? "Cuenta origen" : "Cuenta origen"}
                htmlFor="cuentaOrigen"
                error={errors.cuentaOrigen}
                required
              >
                <Select
                  id="cuentaOrigen"
                  options={accountOptions}
                  value={cuentaOrigenValue ?? ""}
                  onChange={(e) => setValue("cuentaOrigen", e.target.value)}
                  disabled={accounts.length === 0}
                  className="h-11"
                />
              </FormField>
            )}

            {showPaymentMethod && !isTransfer && (
              <div className="hidden" />
            )}
          </div>

          {showCuentaDestino && (
            <FormField
              label="Cuenta destino"
              htmlFor="cuentaDestino"
              error={errors.cuentaDestino}
              required
            >
              <Select
                id="cuentaDestino"
                options={accountOptions}
                value={cuentaDestinoValue ?? ""}
                onChange={(e) => setValue("cuentaDestino", e.target.value)}
                disabled={accounts.length === 0}
                className="h-11"
              />
            </FormField>
          )}

          <FormField label="Notas" htmlFor="notas" error={errors.notas}>
            <Input
              id="notas"
              placeholder="Opcional"
              className="h-11"
              {...register("notas")}
            />
          </FormField>

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-background border-t pt-4 -mx-4 px-4">
            <Button type="submit" className="flex-1 h-11" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : isEditing
                  ? "Actualizar"
                  : "Guardar"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="h-11">
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}