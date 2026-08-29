"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card } from "@/components/ui/card";

const COLORS = ["#6366f1", "#f43f5e", "#f59e0b", "#10b981", "#14b8a6", "#2563eb", "#7c3aed"];

interface DataPoint {
  category: string;
  value: number;
}

export function ExpensePieChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <Card className="h-full">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No expenses this month
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-96">
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="category"
              outerRadius={90}
              label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
              labelLine={true}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={entry.category} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="transparent"
                  style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))" }}
                />
              ))}
            </Pie>
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
            <Legend 
              wrapperStyle={{ color: "var(--color-foreground)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}