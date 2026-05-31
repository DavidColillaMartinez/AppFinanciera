"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { TransactionRow } from "@/types/models";
import type { CategoryRow } from "@/types/models";
import { calculateExpensesByCategory } from "@/lib/finance/calculations";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

interface ChartWidgetProps {
  transactions: TransactionRow[];
}

export function ChartWidget({ transactions }: ChartWidgetProps) {
  const expensesByCategory = calculateExpensesByCategory(
    transactions.filter((t) => t.tipo === "Gasto"),
    [],
  );
  const chartData = expensesByCategory.map((item, i) => ({
    name: item.categoryName || item.category,
    value: item.total,
    color: COLORS[i % COLORS.length],
  }));

  if (chartData.length === 0) return null;

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-sm font-semibold mb-4">Gastos por categoria</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => Number(value).toFixed(2)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface DetailWidgetProps {
  transactions: TransactionRow[];
  categories: CategoryRow[];
}

export function DetailWidget({
  transactions,
  categories,
}: DetailWidgetProps) {
  const expensesByCategory = calculateExpensesByCategory(
    transactions.filter((t) => t.tipo === "Gasto"),
    categories ?? [],
  );

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-sm font-semibold mb-4">Detalle de gastos</h2>
        <div className="space-y-3">
          {expensesByCategory.slice(0, 5).map((cat) => {
            const catName = cat.categoryName || cat.category;
            const catData = categories?.find((c) => c.nombre === catName);
            const budget = catData?.presupuestoMensual ?? 0;
            const pct =
              budget > 0 ? Math.min((cat.total / budget) * 100, 100) : 0;

            return (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{catName}</span>
                  <span className="font-medium">
                    {cat.total.toFixed(2)}
                  </span>
                </div>
                {budget > 0 && (
                  <>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {pct.toFixed(0)}% del presupuesto ({budget.toFixed(2)})
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
