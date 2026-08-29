"use client";

import { Target, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface GoalSuggestion {
  title: string;
  description: string;
  targetAmount: number;
  timeline: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

interface GoalSuggestionsProps {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  totalDebt: number;
  hasEmergencyFund: boolean;
}

export function GoalSuggestions({
  income,
  expenses: _expenses,
  balance,
  savingsRate,
  totalDebt,
  hasEmergencyFund,
}: GoalSuggestionsProps) {
  const suggestions: GoalSuggestion[] = [];

  if (!hasEmergencyFund && totalDebt > 0) {
    suggestions.push({
      title: "Emergency Fund First",
      description: "Build a 3-6 month emergency fund before paying off debt",
      targetAmount: income * 3,
      timeline: "6-12 months",
      priority: "high",
      reason: "An emergency fund prevents you from going deeper into debt when unexpected expenses arise.",
    });
  }

  if (totalDebt > 0) {
    suggestions.push({
      title: "Pay Off High-Interest Debt",
      description: "Focus on credit cards and high-interest loans",
      targetAmount: totalDebt,
      timeline: "12-24 months",
      priority: "high",
      reason: "High-interest debt costs you money every month. Paying it off is like getting a guaranteed return.",
    });
  }

  if (balance > 0 && savingsRate < 20) {
    suggestions.push({
      title: "Increase Savings Rate",
      description: "Try to save at least 20% of your income",
      targetAmount: income * 0.2 * 12,
      timeline: "Ongoing",
      priority: "medium",
      reason: "A 20% savings rate gives you flexibility for future goals and financial security.",
    });
  }

  if (balance > 5000) {
    suggestions.push({
      title: "Short-Term Goal",
      description: "Something you want to achieve in the next 3-6 months",
      targetAmount: Math.min(balance * 2, income * 2),
      timeline: "3-6 months",
      priority: "low",
      reason: "A short-term goal helps build momentum and good savings habits.",
    });
  }

  if (income > 0) {
    const retirementTarget = income * 12 * 20 * 0.15;
    suggestions.push({
      title: "Retirement Fund",
      description: "Build long-term wealth for retirement",
      targetAmount: retirementTarget,
      timeline: "20+ years",
      priority: "low",
      reason: "Starting early with retirement gives compound interest more time to work.",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: "General Savings",
      description: "Build your financial foundation",
      targetAmount: income * 6,
      timeline: "6-12 months",
      priority: "medium",
      reason: "Even without specific goals, building savings provides security and options.",
    });
  }

  const priorityColors = {
    high: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  };

  return (
    <Card className="glass animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          AI Goal Suggestions
        </CardTitle>
        <CardDescription>Personalized recommendations based on your financial data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${priorityColors[suggestion.priority]}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${priorityColors[suggestion.priority]} bg-opacity-20`}>
                <Target className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{suggestion.title}</h4>
                  <span className="text-xs uppercase font-medium">{suggestion.priority}</span>
                </div>
                <p className="text-sm mt-1 opacity-80">{suggestion.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="font-semibold">Target: {formatCurrency(suggestion.targetAmount)}</span>
                  <span className="opacity-70">{suggestion.timeline}</span>
                </div>
                <p className="text-xs mt-2 opacity-70">{suggestion.reason}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}