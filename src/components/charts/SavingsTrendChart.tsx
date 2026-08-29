"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/card";

interface DataPoint {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

interface SavingsTrendChartProps {
  data: DataPoint[];
}

export function SavingsTrendChart({ data }: SavingsTrendChartProps) {
  return (
    <Card className="h-80">
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: "var(--color-foreground)" }}
              stroke="var(--color-muted-foreground)"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "var(--color-foreground)" }}
              stroke="var(--color-muted-foreground)"
            />
            <Tooltip 
              formatter={(value: number) => `₱${value.toFixed(2)}`}
              contentStyle={{ 
                borderRadius: "8px", 
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-card)",
                color: "var(--color-foreground)"
              }}
              itemStyle={{ color: "var(--color-foreground)" }}
              labelStyle={{ color: "var(--color-foreground)" }}
            />
            <Area 
              type="monotone" 
              dataKey="savings" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorSavings)"
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
              name="Savings"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}