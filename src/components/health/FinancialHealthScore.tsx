"use client";

import { Activity, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface FinancialHealthData {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  budgetUsage: Record<string, { spent: number; budget: number }>;
  savingsGoals: { currentAmount: number; targetAmount: number }[];
  hasEmergencyFund: boolean;
  totalDebt: number;
}

interface FinancialHealthScoreProps {
  data: FinancialHealthData;
}

export function FinancialHealthScore({ data }: FinancialHealthScoreProps) {
  const scores = {
    savingsRate: data.savingsRate >= 20 ? 100 : data.savingsRate >= 10 ? 70 : data.savingsRate >= 5 ? 40 : 20,
    budgetCompliance: calculateBudgetScore(data.budgetUsage),
    debtLevel: data.totalDebt === 0 ? 100 : data.totalDebt < data.income * 0.5 ? 70 : data.totalDebt < data.income ? 40 : 20,
    emergencyFund: data.hasEmergencyFund ? 100 : 30,
    goalProgress: calculateGoalProgress(data.savingsGoals),
  };

  const overallScore = Math.round(
    (scores.savingsRate + scores.budgetCompliance + scores.debtLevel + scores.emergencyFund + scores.goalProgress) / 5
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  const scoreDetails = [
    { name: "Savings Rate", score: scores.savingsRate, icon: TrendingUp },
    { name: "Budget Compliance", score: scores.budgetCompliance, icon: Activity },
    { name: "Debt Level", score: scores.debtLevel, icon: TrendingDown },
    { name: "Emergency Fund", score: scores.emergencyFund, icon: AlertCircle },
    { name: "Goal Progress", score: scores.goalProgress, icon: CheckCircle },
  ];

  return (
    <Card className="glass animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Financial Health Score
        </CardTitle>
        <CardDescription>A score based on your overall financial wellness</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}
          </div>
          <p className={`text-sm font-medium ${getScoreColor(overallScore)} mt-1`}>
            {getScoreLabel(overallScore)}
          </p>
        </div>

        <div className="space-y-3">
          {scoreDetails.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreColor(item.score)}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <span className={`text-sm font-medium w-8 ${getScoreColor(item.score)}`}>
                  {item.score}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-secondary/50 text-sm">
          {overallScore >= 80 ? (
            <p className="text-emerald-600 dark:text-emerald-400">
              🎉 Your finances are in great shape! Keep up the good work and maintain your healthy habits.
            </p>
          ) : overallScore >= 60 ? (
            <p className="text-amber-600 dark:text-amber-400">
              👍 You&apos;re on the right track. Focus on areas with lower scores to improve your financial health.
            </p>
          ) : (
            <p className="text-rose-600 dark:text-rose-400">
              ⚠️ Your financial health needs attention. Start with the lowest-scoring areas for biggest impact.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function calculateBudgetScore(usage: Record<string, { spent: number; budget: number }>) {
  if (Object.keys(usage).length === 0) return 50;
  
  let totalScore = 0;
  let count = 0;
  
  for (const category in usage) {
    const { spent, budget } = usage[category];
    if (budget <= 0) continue;
    const ratio = spent / budget;
    if (ratio <= 0.8) totalScore += 100;
    else if (ratio <= 1) totalScore += 70;
    else totalScore += 30;
    count++;
  }
  
  return count > 0 ? Math.round(totalScore / count) : 50;
}

function calculateGoalProgress(goals: { currentAmount: number; targetAmount: number }[]) {
  if (goals.length === 0) return 50;
  
  const totalProgress = goals.reduce((sum, goal) => {
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    return sum + Math.min(100, progress);
  }, 0);
  
  return Math.round(totalProgress / goals.length);
}