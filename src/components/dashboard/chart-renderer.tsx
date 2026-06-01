"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardChart, ChartDataSource } from "@/stores/app-store";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

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

interface ChartEntry {
  name: string;
  value: number;
  color: string;
}

interface ChartRendererProps {
  chart: DashboardChart;
  data: ChartEntry[];
  monthName?: string;
  className?: string;
}

export function ChartRenderer({ chart, data, monthName, className }: ChartRendererProps) {
  const isEmpty = !data || data.length === 0;

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Sin datos para mostrar
      </div>
    );
  }

  const showLabels = chart.showLabels;
  const animationsEnabled = chart.animations;

  const renderTooltip = (props: Record<string, unknown>) => {
    const label = props.label as string;
    const value = Number(props.value) || 0;
    return (
      <div className="rounded-lg border bg-background shadow-sm px-3 py-2">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value.toFixed(2)} €</p>
      </div>
    );
  };

  const renderLegend = () => (
    <Legend
      formatter={(value) => (
        <span className="text-xs text-muted-foreground">{value}</span>
      )}
      iconType="circle"
      iconSize={8}
    />
  );

  const renderBar = () => (
    <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
      <XAxis
        dataKey="name"
        tick={{ fontSize: 10 }}
        tickLine={false}
        axisLine={false}
        className="text-muted-foreground"
      />
      <YAxis
        tick={{ fontSize: 10 }}
        tickLine={false}
        axisLine={false}
        className="text-muted-foreground"
        tickFormatter={(v) => `${v}`}
      />
      <Tooltip content={renderTooltip} />
      {renderLegend()}
      <Bar
        dataKey="value"
        fill={chart.accentColor}
        radius={[4, 4, 0, 0]}
        animationDuration={animationsEnabled ? 800 : 0}
        label={showLabels ? { position: "top", fontSize: 9, fill: "#666" } : false}
      />
    </BarChart>
  );

  const renderPie = () => (
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={50}
        outerRadius={80}
        paddingAngle={2}
        dataKey="value"
        animationDuration={animationsEnabled ? 800 : 0}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip content={renderTooltip} />
      {renderLegend()}
    </PieChart>
  );

  const renderArea = () => (
    <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
      <defs>
        <linearGradient id={`gradient-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={chart.accentColor} stopOpacity={0.3} />
          <stop offset="95%" stopColor={chart.accentColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
      <XAxis
        dataKey="name"
        tick={{ fontSize: 10 }}
        tickLine={false}
        axisLine={false}
        className="text-muted-foreground"
      />
      <YAxis
        tick={{ fontSize: 10 }}
        tickLine={false}
        axisLine={false}
        className="text-muted-foreground"
      />
      <Tooltip content={renderTooltip} />
      {renderLegend()}
      <Area
        type="monotone"
        dataKey="value"
        stroke={chart.accentColor}
        strokeWidth={2}
        fill={`url(#gradient-${chart.id})`}
        animationDuration={animationsEnabled ? 800 : 0}
        label={showLabels ? { position: "top", fontSize: 9, fill: "#666" } : false}
      />
    </AreaChart>
  );

  const renderLine = () => (
    <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
      <XAxis
        dataKey="name"
        tick={{ fontSize: 10 }}
        tickLine={false}
        axisLine={false}
        className="text-muted-foreground"
      />
      <YAxis
        tick={{ fontSize: 10 }}
        tickLine={false}
        axisLine={false}
        className="text-muted-foreground"
      />
      <Tooltip content={renderTooltip} />
      {renderLegend()}
      <Line
        type="monotone"
        dataKey="value"
        stroke={chart.accentColor}
        strokeWidth={2}
        dot={{ r: 3, fill: chart.accentColor, strokeWidth: 0 }}
        activeDot={{ r: 5, fill: chart.accentColor }}
        animationDuration={animationsEnabled ? 800 : 0}
      />
    </LineChart>
  );

  return (
    <div className={cn("w-full h-full min-h-[200px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        {chart.type === "bar" ? renderBar() :
         chart.type === "area" ? renderArea() :
         chart.type === "line" ? renderLine() :
         renderPie()}
      </ResponsiveContainer>
    </div>
  );
}

export type { ChartEntry };