"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface MonthData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface MonthComparisonChartProps {
  data: MonthData[];
}

export function MonthComparisonChart({ data }: MonthComparisonChartProps) {
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  
  const incomeChange = previousMonth ? ((currentMonth.income - previousMonth.income) / previousMonth.income * 100) : 0;
  const expenseChange = previousMonth ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses * 100) : 0;
  const savingsChange = previousMonth ? ((currentMonth.savings - previousMonth.savings) / Math.abs(previousMonth.savings) * 100) : 0;

  return (
    <Card className="h-80">
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(-6)}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 11, fill: "var(--color-foreground)" }}
              stroke="var(--color-border)"
            />
            <YAxis 
              tick={{ fontSize: 11, fill: "var(--color-foreground)" }}
              stroke="var(--color-border)"
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
            <Legend />
            <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {previousMonth && (
        <div className="absolute bottom-2 left-4 right-4 flex justify-between text-xs">
          <span className={incomeChange >= 0 ? "text-emerald-500" : "text-rose-500"}>
            Income: {incomeChange >= 0 ? "+" : ""}{incomeChange.toFixed(1)}%
          </span>
          <span className={expenseChange <= 0 ? "text-emerald-500" : "text-rose-500"}>
            Expenses: {expenseChange >= 0 ? "+" : ""}{expenseChange.toFixed(1)}%
          </span>
          <span className={savingsChange >= 0 ? "text-emerald-500" : "text-rose-500"}>
            Savings: {savingsChange >= 0 ? "+" : ""}{savingsChange.toFixed(1)}%
          </span>
        </div>
      )}
    </Card>
  );
}