"use client";

import { TrendingUp, TrendingDown, Wallet, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface NetWorthCalculatorProps {
  assets: { id: string; name: string; type: string; value: number }[];
  debts: { id: string; name: string; currentAmount: number }[];
}

export function NetWorthCalculator({ assets, debts }: NetWorthCalculatorProps) {
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = debts.reduce((sum, d) => sum + d.currentAmount, 0);
  const netWorth = totalAssets - totalLiabilities;

  const assetsByType = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + a.value;
    return acc;
  }, {});

  const isPositive = netWorth >= 0;

  return (
    <Card className="glass animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Net Worth Calculator
        </CardTitle>
        <CardDescription>Your total assets minus liabilities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`text-center p-6 rounded-lg ${isPositive ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
          <p className="text-sm opacity-70 mb-1">Net Worth</p>
          <p className={`text-3xl font-bold ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
            {formatCurrency(netWorth)}
          </p>
          {isPositive ? (
            <p className="text-sm text-emerald-500 mt-1 flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4" /> Positive net worth - great job!
            </p>
          ) : (
            <p className="text-sm text-rose-500 mt-1 flex items-center justify-center gap-1">
              <TrendingDown className="h-4 w-4" /> Focus on paying down debt
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Total Assets</span>
            </div>
            <p className="text-xl font-bold text-emerald-500">{formatCurrency(totalAssets)}</p>
          </div>
          <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-medium">Total Liabilities</span>
            </div>
            <p className="text-xl font-bold text-rose-500">{formatCurrency(totalLiabilities)}</p>
          </div>
        </div>

        {Object.keys(assetsByType).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Assets Breakdown</p>
            {Object.entries(assetsByType).map(([type, value]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="capitalize opacity-70">{type}</span>
                <span className="font-medium">{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}