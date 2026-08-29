"use client";

import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

interface Budget {
  id: string;
  category: string;
  month: string;
  amount: number;
}

export function BudgetProgressList({
  budgets,
  expenses,
}: {
  budgets: Budget[];
  expenses: Record<string, number>;
}) {
  if (budgets.length === 0) {
    return <p className="text-sm text-muted-foreground">No budgets set yet.</p>;
  }

  return (
    <div className="space-y-4">
      {budgets.map((budget) => {
        const spent = expenses[budget.category] ?? 0;
        const percent = Math.min(100, (spent / budget.amount) * 100);
        
        const getVariant = () => {
          if (percent >= 100) return "danger";
          if (percent >= 80) return "warning";
          return "success";
        };

        const variant = getVariant();

        return (
          <div key={budget.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{budget.category}</span>
              <span className="text-muted-foreground">
                {formatCurrency(spent)} / {formatCurrency(budget.amount)}
              </span>
            </div>
            <Progress
              value={percent}
              variant={variant}
            />
            {percent >= 100 ? (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Budget exceeded!
              </p>
            ) : percent >= 80 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Approaching budget limit
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
