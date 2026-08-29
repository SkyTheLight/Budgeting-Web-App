"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  day: string;
  amount: number;
}

interface WeeklySpendingChartProps {
  data: DataPoint[];
}

export function WeeklySpendingChart({ data }: WeeklySpendingChartProps) {
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sortedData = dayOrder.map(day => {
    const found = data.find(d => d.day === day);
    return {
      day,
      amount: found?.amount || 0
    };
  });

  const avgSpending = data.reduce((sum, d) => sum + d.amount, 0) / (data.filter(d => d.amount > 0).length || 1);
  const totalSpending = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card className="h-80">
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData}>
            <defs>
              <linearGradient id="dayGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12, fill: "var(--color-foreground)" }}
              stroke="var(--color-muted-foreground)"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "var(--color-foreground)" }}
              stroke="var(--color-muted-foreground)"
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ 
                borderRadius: "8px", 
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-card)",
                color: "var(--color-foreground)"
              }}
              itemStyle={{ color: "var(--color-foreground)" }}
              labelStyle={{ color: "var(--color-foreground)" }}
            />
            <Bar 
              dataKey="amount" 
              fill="url(#dayGradient)"
              radius={[4, 4, 0, 0]}
              animationBegin={0}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute bottom-2 left-4 text-xs text-muted-foreground">
        Avg: {formatCurrency(avgSpending)} | Total: {formatCurrency(totalSpending)}
      </div>
    </Card>
  );
}