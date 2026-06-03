"use client";

import type { ChartDataSource } from "@/stores/app-store";
import type { TransactionRow, FixedExpenseRow, FuturePaymentRow, InstallmentPaymentRow } from "@/types/models";
import type { ChartEntry } from "@/components/dashboard/chart-renderer";

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

function getSingleSourceData(
  dataSource: ChartDataSource,
  params: {
    transactions: TransactionRow[];
    categories: { nombre: string }[];
    fixedExpenses: FixedExpenseRow[];
    futurePayments: FuturePaymentRow[];
    deferredPayments: InstallmentPaymentRow[];
  },
  colorIndex: number,
): ChartEntry {
  const { transactions, categories, fixedExpenses, futurePayments, deferredPayments } = params;
  const color = COLORS[colorIndex % COLORS.length];

  switch (dataSource) {
    case "categories": {
      const expenseTx = transactions.filter((t) => t.tipo === "Gasto");
      const total = expenseTx.reduce((acc, t) => acc + t.importe, 0);
      const byCat: Record<string, number> = {};
      expenseTx.forEach((t) => { byCat[t.categoria] = (byCat[t.categoria] || 0) + t.importe; });
      const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const other = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(3).reduce((s, [, v]) => s + v, 0);
      const label = topCat.map(([c]) => categories.find((x) => x.nombre === c)?.nombre || c).join(", ");
      return { name: `Gastos por categoria${topCat.length > 0 ? ` (${label}${other > 0 ? ", ..." : ""})` : ""}`, value: total, color };
    }
    case "expenses": {
      const total = fixedExpenses.reduce((acc, e) => acc + e.importe, 0);
      return { name: "Gastos fijos", value: total, color };
    }
    case "savings": {
      const total = transactions.filter((t) => t.tipo === "Ahorro").reduce((acc, t) => acc + t.importe, 0);
      return { name: "Ahorros", value: total, color };
    }
    case "income": {
      const total = transactions.filter((t) => t.tipo === "Ingreso").reduce((acc, t) => acc + t.importe, 0);
      return { name: "Ingresos", value: total, color };
    }
    case "total": {
      const varExp = transactions.filter((t) => t.tipo === "Gasto").reduce((acc, t) => acc + t.importe, 0);
      const fixExp = fixedExpenses.reduce((acc, e) => {
        if (e.frecuencia === "Mensual") return acc + e.importe;
        if (e.frecuencia === "Trimestral") return acc + e.importe / 3;
        return acc;
      }, 0);
      const defExp = deferredPayments.filter((p) => p.estado === "Activo").reduce((acc, p) => acc + p.cuotaMensual, 0);
      return { name: "Gastos total", value: varExp + fixExp + defExp, color };
    }
    case "fixed": {
      const total = fixedExpenses.reduce((acc, e) => acc + e.importe, 0);
      return { name: "Gastos fijos fijos", value: total, color };
    }
    case "deferred": {
      const total = deferredPayments.filter((p) => p.estado === "Activo").reduce((acc, p) => acc + (p.importeTotal - p.importePagado), 0);
      return { name: "Pendiente aplazado", value: total, color };
    }
    case "future": {
      const total = futurePayments.filter((p) => p.activo === "S").reduce((acc, p) => acc + (p.importeObjetivo - p.saldoReservado), 0);
      return { name: "Pendiente futuro", value: total, color };
    }
    default:
      return { name: dataSource, value: 0, color };
  }
}

export function getChartData(
  dataSources: ChartDataSource | ChartDataSource[],
  params: {
    transactions?: TransactionRow[];
    categories?: { nombre: string }[];
    fixedExpenses?: FixedExpenseRow[];
    futurePayments?: FuturePaymentRow[];
    deferredPayments?: InstallmentPaymentRow[];
    savingsPlanData?: { baseIncome: number; totalFixed: number; netForMonth: number; suggestedSavings: number; discretionaryBudget: number };
  },
): ChartEntry[] {
  const { transactions = [], categories = [], fixedExpenses = [], futurePayments = [], deferredPayments = [] } = params;
  const sources = Array.isArray(dataSources) ? dataSources : [dataSources];

  if (sources.length === 1) {
    const ds = sources[0];
    if (ds === "categories") {
      const expenseTx = transactions.filter((t) => t.tipo === "Gasto");
      const byCat: Record<string, number> = {};
      expenseTx.forEach((t) => { byCat[t.categoria] = (byCat[t.categoria] || 0) + t.importe; });
      return Object.entries(byCat).map(([cat, total], i) => {
        const catObj = categories.find((c) => c.nombre === cat);
        return { name: catObj?.nombre || cat || "Sin categoria", value: total, color: COLORS[i % COLORS.length] };
      });
    }
    if (ds === "income") {
      return transactions.filter((t) => t.tipo === "Ingreso").map((t, i) => ({
        name: t.concepto || t.categoria, value: t.importe, color: COLORS[i % COLORS.length],
      }));
    }
    if (ds === "savings") {
      return transactions.filter((t) => t.tipo === "Ahorro").slice(0, 10).map((t, i) => ({
        name: t.concepto || "Ahorro", value: t.importe, color: COLORS[i % COLORS.length],
      }));
    }
    if (ds === "expenses" || ds === "fixed") {
      return fixedExpenses.map((exp, i) => ({
        name: exp.concepto, value: exp.importe, color: COLORS[i % COLORS.length],
      }));
    }
    if (ds === "deferred") {
      return deferredPayments.filter((p) => p.estado === "Activo").map((p, i) => ({
        name: p.concepto, value: p.importeTotal - p.importePagado, color: COLORS[i % COLORS.length],
      }));
    }
    if (ds === "future") {
      return futurePayments.filter((p) => p.activo === "S").map((p, i) => ({
        name: p.concepto, value: p.importeObjetivo - p.saldoReservado, color: COLORS[i % COLORS.length],
      }));
    }
    if (ds === "total") {
      const varExp = transactions.filter((t) => t.tipo === "Gasto").reduce((acc, t) => acc + t.importe, 0);
      const fixExp = fixedExpenses.reduce((acc, e) => {
        if (e.frecuencia === "Mensual") return acc + e.importe;
        if (e.frecuencia === "Trimestral") return acc + e.importe / 3;
        return acc;
      }, 0);
      const defExp = deferredPayments.filter((p) => p.estado === "Activo").reduce((acc, p) => acc + p.cuotaMensual, 0);
      const futExp = futurePayments.filter((p) => p.activo === "S").reduce((acc, p) => acc + p.aporteMensual, 0);
      return [
        { name: "Gastos variables", value: varExp, color: COLORS[0] },
        { name: "Gastos fijos", value: fixExp, color: COLORS[1] },
        { name: "Aplazados", value: defExp, color: COLORS[2] },
        { name: "Futuros", value: futExp, color: COLORS[3] },
      ];
    }
    return [];
  }

  return sources.map((ds, i) => getSingleSourceData(ds, { transactions, categories, fixedExpenses, futurePayments, deferredPayments }, i));
}
