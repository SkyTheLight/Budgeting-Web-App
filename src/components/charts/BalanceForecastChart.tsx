"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface ForecastPoint {
  month: string;
  projected: number;
  optimistic: number;
  pessimistic: number;
}

interface BalanceForecastChartProps {
  data: ForecastPoint[];
}

export function BalanceForecastChart({ data }: BalanceForecastChartProps) {
  const currentBalance = data[0]?.projected || 0;
  const threeMonthForecast = data[data.length - 1]?.projected || 0;
  const growth = ((threeMonthForecast - currentBalance) / Math.abs(currentBalance)) * 100;

  return (
    <Card className="h-80">
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 11, fill: "var(--color-foreground)" }}
              stroke="var(--color-border)"
            />
            <YAxis 
              tick={{ fontSize: 11, fill: "var(--color-foreground)" }}
              stroke="var(--color-border)"
              tickFormatter={(value) => `₱${(value/1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ 
                borderRadius: "8px", 
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-card)",
                color: "var(--color-foreground)",
              }}
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
            <Line 
              type="monotone" 
              dataKey="projected" 
              stroke="#0ea5e9" 
              strokeWidth={2}
              dot={{ fill: "#0ea5e9" }}
              name="Projected"
              animationBegin={0}
              animationDuration={1000}
            />
            <Line 
              type="monotone" 
              dataKey="optimistic" 
              stroke="#22c55e" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Optimistic"
            />
            <Line 
              type="monotone" 
              dataKey="pessimistic" 
              stroke="#f59e0b" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Pessimistic"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute bottom-2 left-4 text-xs text-muted-foreground">
        3-month forecast: {formatCurrency(threeMonthForecast)} ({growth >= 0 ? "+" : ""}{growth.toFixed(1)}%)
      </div>
    </Card>
  );
}