"use client";

import type { ChartDataSource } from "@/stores/app-store";
import type { TransactionRow, FixedExpenseRow, FuturePaymentRow, InstallmentPaymentRow } from "@/types/models";
import type { ChartEntry } from "@/components/dashboard/chart-renderer";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

export function getChartData(
  dataSource: ChartDataSource,
  params: {
    transactions?: TransactionRow[];
    categories?: { nombre: string }[];
    fixedExpenses?: FixedExpenseRow[];
    futurePayments?: FuturePaymentRow[];
    deferredPayments?: InstallmentPaymentRow[];
    savingsPlanData?: {
      baseIncome: number;
      totalFixed: number;
      netForMonth: number;
      suggestedSavings: number;
      discretionaryBudget: number;
    };
  }
): ChartEntry[] {
  const { transactions = [], categories = [], fixedExpenses = [], futurePayments = [], deferredPayments = [] } = params;

  switch (dataSource) {
    case "categories": {
      const expenseTransactions = transactions.filter((t) => t.tipo === "Gasto");
      const byCategory: Record<string, number> = {};
      expenseTransactions.forEach((t) => {
        byCategory[t.categoria] = (byCategory[t.categoria] || 0) + t.importe;
      });
      return Object.entries(byCategory).map(([cat, total], i) => {
        const catObj = categories.find((c) => c.nombre === cat);
        return {
          name: catObj?.nombre || cat || "Sin categoria",
          value: total,
          color: COLORS[i % COLORS.length],
        };
      });
    }

    case "expenses": {
      return (fixedExpenses || []).map((exp, i) => ({
        name: exp.concepto,
        value: exp.frecuencia === "Mensual" ? exp.importe : exp.importe / 3,
        color: COLORS[i % COLORS.length],
      }));
    }

    case "savings": {
      return (transactions || [])
        .filter((t) => t.tipo === "Ahorro")
        .slice(0, 10)
        .map((t, i) => ({
          name: t.concepto || "Ahorro",
          value: t.importe,
          color: COLORS[i % COLORS.length],
        }));
    }

    case "income": {
      return (transactions || [])
        .filter((t) => t.tipo === "Ingreso")
        .map((t, i) => ({
          name: t.concepto || t.categoria,
          value: t.importe,
          color: COLORS[i % COLORS.length],
        }));
    }

    case "total": {
      const variableExpenses = (transactions || [])
        .filter((t) => t.tipo === "Gasto")
        .reduce((acc, t) => acc + t.importe, 0);
      const fixedMonthly = (fixedExpenses || []).reduce((acc, exp) => {
        if (exp.frecuencia === "Mensual") return acc + exp.importe;
        if (exp.frecuencia === "Trimestral") return acc + exp.importe / 3;
        if (exp.frecuencia === "Anual") return acc + exp.importe / 12;
        return acc;
      }, 0);
      const deferredMonthly = (deferredPayments || [])
        .filter((p) => p.estado === "Activo")
        .reduce((acc, p) => acc + p.cuotaMensual, 0);
      const futureMonthly = (futurePayments || [])
        .filter((p) => p.activo === "S")
        .reduce((acc, p) => acc + p.aporteMensual, 0);
      return [
        { name: "Gastos variables", value: variableExpenses, color: COLORS[0] },
        { name: "Gastos fijos", value: fixedMonthly, color: COLORS[1] },
        { name: "Aplazados", value: deferredMonthly, color: COLORS[2] },
        { name: "Futuros", value: futureMonthly, color: COLORS[3] },
      ];
    }

    case "fixed": {
      return (fixedExpenses || []).map((exp, i) => ({
        name: exp.concepto,
        value: exp.importe,
        color: COLORS[i % COLORS.length],
      }));
    }

    case "deferred": {
      return (deferredPayments || [])
        .filter((p) => p.estado === "Activo")
        .map((p, i) => ({
          name: p.concepto,
          value: p.importeTotal - p.importePagado,
          color: COLORS[i % COLORS.length],
        }));
    }

    case "future": {
      return (futurePayments || [])
        .filter((p) => p.activo === "S")
        .map((p, i) => ({
          name: p.concepto,
          value: p.importeObjetivo - p.saldoReservado,
          color: COLORS[i % COLORS.length],
        }));
    }

    default:
      return [];
  }
}