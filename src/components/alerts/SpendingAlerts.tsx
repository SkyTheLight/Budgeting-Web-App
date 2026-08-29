"use client";

import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Alert {
  type: "warning" | "danger" | "info";
  category: string;
  message: string;
  amount?: number;
  percentage?: number;
}

interface SpendingAlertsProps {
  alerts: Alert[];
  budgetUsage: Record<string, { spent: number; budget: number }>;
}

export function SpendingAlerts({ alerts, budgetUsage }: SpendingAlertsProps) {
  const categoryAlerts = Object.entries(budgetUsage).map(([category, { spent, budget }]) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) {
      return {
        type: "danger" as const,
        category,
        message: "Budget exceeded!",
        amount: spent - budget,
        percentage
      };
    } else if (percentage >= 80) {
      return {
        type: "warning" as const,
        category,
        message: "Approaching budget limit",
        amount: budget - spent,
        percentage
      };
    }
    return null;
  }).filter(Boolean) as Alert[];

  const allAlerts = [...alerts, ...categoryAlerts].slice(0, 5);

  if (allAlerts.length === 0) {
    return (
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-emerald-500" />
            Spending Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No spending alerts. You are doing great!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Spending Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {allAlerts.map((alert, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg flex items-start gap-3 ${
              alert.type === "danger" 
                ? "bg-rose-500/10 border border-rose-500/30" 
                : alert.type === "warning"
                ? "bg-amber-500/10 border border-amber-500/30"
                : "bg-blue-500/10 border border-blue-500/30"
            }`}
          >
            {alert.type === "danger" ? (
              <TrendingUp className="h-4 w-4 text-rose-500 mt-0.5" />
            ) : alert.type === "warning" ? (
              <TrendingDown className="h-4 w-4 text-amber-500 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{alert.category}</p>
              <p className="text-xs text-muted-foreground">{alert.message}</p>
              {alert.amount !== undefined && (
                <p className="text-xs font-medium mt-1">
                  {alert.type === "danger" ? "Over by " : "Left: "}
                  {formatCurrency(Math.abs(alert.amount))}
                </p>
              )}
            </div>
            {alert.percentage !== undefined && (
              <span className={`text-sm font-bold ${
                alert.percentage >= 100 ? "text-rose-500" : "text-amber-500"
              }`}>
                {alert.percentage.toFixed(0)}%
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}