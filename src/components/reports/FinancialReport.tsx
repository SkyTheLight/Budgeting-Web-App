"use client";

import { useMemo, useState } from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";

type Period = "this-month" | "last-month" | "this-year";

interface ReportData {
  transactions: Array<{
    date: Date;
    type: string;
    category: string;
    amount: number;
    description: string | null;
  }>;
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  topCategories: Array<{ category: string; amount: number }>;
}

interface FinancialReportProps {
  data: ReportData;
}

function getPeriodBounds(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  switch (period) {
    case "last-month":
      return {
        start: new Date(Date.UTC(year, month - 1, 1)),
        end: new Date(Date.UTC(year, month, 1)),
      };
    case "this-year":
      return {
        start: new Date(Date.UTC(year, 0, 1)),
        end: new Date(Date.UTC(year + 1, 0, 1)),
      };
    default:
      return {
        start: new Date(Date.UTC(year, month, 1)),
        end: new Date(Date.UTC(year, month + 1, 1)),
      };
  }
}

export function FinancialReport({ data }: FinancialReportProps) {
  const [period, setPeriod] = useState<Period>("this-month");
  const [isGenerating, setIsGenerating] = useState(false);

  const report = useMemo(() => {
    const { start, end } = getPeriodBounds(period);
    const txns = data.transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d < end;
    });

    const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? (balance / income) * 100 : 0;

    const byCategory = txns
      .filter((t) => t.type === "expense")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {});

    const topCategories = Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return { transactions: txns, income, expenses, balance, savingsRate, topCategories };
  }, [data, period]);

  function generateReport() {
    setIsGenerating(true);
    const content = generateReportContent(report);
    downloadFile(content, `financial-report-${new Date().toISOString().split('T')[0]}.txt`);
    setIsGenerating(false);
  }

  function generateReportContent(r: typeof report): string {
    const date = new Date().toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const periodLabel = {
      "this-month": "This Month",
      "last-month": "Last Month",
      "this-year": "This Year",
    }[period];

    let content = `
═══════════════════════════════════════════════════════════════
                    BUDGETPRO FINANCIAL REPORT
═══════════════════════════════════════════════════════════════
Generated: ${date}
Period:    ${periodLabel}
────────────────────────────────────────────────────────────────

                    SUMMARY
────────────────────────────────────────────────────────────────

  Total Income:        ${formatCurrency(r.income)}
  Total Expenses:      ${formatCurrency(r.expenses)}
  Net Balance:         ${formatCurrency(r.balance)}
  Savings Rate:        ${r.savingsRate.toFixed(1)}%

────────────────────────────────────────────────────────────────

                    EXPENSE BREAKDOWN
------------------------------------------------------------`;

    if (r.topCategories.length === 0) {
      content += "\n  No expenses recorded.";
    } else {
      r.topCategories.forEach(cat => {
        content += `\n  ${cat.category.padEnd(15)} ${formatCurrency(cat.amount).padStart(12)}`;
      });
    }

    content += `

────────────────────────────────────────────────────────────────

                    TRANSACTION DETAILS
------------------------------------------------------------`;

    if (r.transactions.length === 0) {
      content += "\n  No transactions recorded.";
    } else {
      r.transactions.forEach(tx => {
        const dateStr = new Date(tx.date).toLocaleDateString('en-PH');
        const type = tx.type === 'income' ? '+' : '-';
        content += `\n  ${dateStr}  ${type} ${formatCurrency(tx.amount).padStart(10)}  ${tx.category}`;
        if (tx.description) {
          content += `\n               ${tx.description}`;
        }
      });
    }

    content += `

────────────────────────────────────────────────────────────────
                    END OF REPORT
═══════════════════════════════════════════════════════════════
`;

    return content;
  }

  function downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="glass animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Financial Report
        </CardTitle>
        <CardDescription>Export your financial summary</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="text-sm text-muted-foreground">Income</p>
              <p className={cn("text-lg font-semibold", report.income > 0 ? "text-emerald-500" : "text-muted-foreground")}>
                {formatCurrency(report.income)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className={cn("text-lg font-semibold", report.expenses > 0 ? "text-rose-500" : "text-muted-foreground")}>
                {formatCurrency(report.expenses)}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-card border border-border">
            <p className="text-sm text-muted-foreground">Net Balance</p>
            <p className={cn("text-xl font-bold", report.balance >= 0 ? "text-primary" : "text-rose-500")}>
              {formatCurrency(report.balance)}
            </p>
          </div>

          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger aria-label="Report period">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={generateReport} disabled={isGenerating} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Download Report"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}