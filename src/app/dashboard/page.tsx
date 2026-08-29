import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { formatCurrency, monthKey, getMonthBounds } from "@/lib/utils";
import { processDueRecurring } from "@/lib/recurring";
import { ExpensePieChart } from "@/components/charts/ExpensePieChart";
import { IncomeExpenseBar } from "@/components/charts/IncomeExpenseBar";
import { SavingsTrendChart } from "@/components/charts/SavingsTrendChart";
import { WeeklySpendingChart } from "@/components/charts/WeeklySpendingChart";
import { MonthComparisonChart } from "@/components/charts/MonthComparisonChart";
import { BalanceForecastChart } from "@/components/charts/BalanceForecastChart";
import { SpendingAlerts } from "@/components/alerts/SpendingAlerts";
import { BudgetProgressList } from "@/components/budget/BudgetProgressList";
import { TransactionSection } from "@/components/transaction/TransactionSection";
import { BudgetFormDialog } from "@/components/budget/BudgetFormDialog";
import { SavingsGoalCard } from "@/components/savings/SavingsGoalCard";
import { SavingsGoalFormDialog } from "@/components/savings/SavingsGoalFormDialog";
import { BillReminderList } from "@/components/bills/BillReminderList";
import { RecurringList } from "@/components/recurring/RecurringList";
import { DemoDataBanner } from "@/components/onboarding/DemoDataBanner";
import { DebtTracker } from "@/components/debt/DebtTracker";
import { FinancialReport } from "@/components/reports/FinancialReport";
import { HeaderActions } from "@/components/auth/HeaderActions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AssetList } from "@/components/assets/AssetList";
import { BackupManager } from "@/components/backup/BackupManager";
import { GoalSuggestions } from "@/components/goals/GoalSuggestions";
import { NetWorthCalculator } from "@/components/networth/NetWorthCalculator";
import { FinancialHealthScore } from "@/components/health/FinancialHealthScore";
import { AIChat, type UserFinancialContext } from "@/components/ai/AIChat";
import { TrendingUp, TrendingDown, PiggyBank, Target, Wallet } from "lucide-react";

// Reads the auth session from cookies/headers per request — never statically prerender
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/auth/login");


  const userId = session.user.id;
  const now = new Date();
  const thisMonth = monthKey(now);
  const { start: monthStart, end: monthEnd } = getMonthBounds(now);

  const months = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - idx, 1));
    return monthKey(d);
  }).reverse();

  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  // Reconcile any due recurring rules before anything reads the ledger.
  const recurringCreated = await processDueRecurring(userId);

  const [rawTransactions, rawBudgets, rawSavingsGoals, rawBillReminders, rawDebts, rawAssets, rawMonthlyTransactions, monthTransactions, recRules] =
    await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.budget.findMany({
        where: { userId },
        orderBy: { category: "asc" },
      }),
      prisma.savingsGoal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.billReminder.findMany({
        where: { userId },
        orderBy: { dueDay: "asc" },
      }),
      prisma.debt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      (prisma as any).asset?.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }) || Promise.resolve([]),
      prisma.transaction.findMany({
        where: { userId, date: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.transaction.groupBy({
        by: ["date", "type"],
        where: { userId, date: { gte: sixMonthsAgo } },
        _sum: { amount: true },
      }),
      prisma.recurringRule.findMany({
        where: { userId },
        orderBy: [{ isActive: "desc" }, { nextRun: "asc" }],
      }),
    ]);

  // Decimal -> number at the boundary; only plain numbers reach the client components
  const transactions = rawTransactions.map((t) => ({ ...t, amount: t.amount.toNumber() }));
  const budgets = rawBudgets.map((b) => ({ ...b, amount: b.amount.toNumber() }));
  const savingsGoals = rawSavingsGoals.map((g) => ({
    ...g,
    targetAmount: g.targetAmount.toNumber(),
    currentAmount: g.currentAmount.toNumber(),
  }));
  const billReminders = rawBillReminders.map((r) => ({ ...r, amount: r.amount.toNumber() }));
  const debts = rawDebts.map((d) => ({
    ...d,
    totalAmount: d.totalAmount.toNumber(),
    currentAmount: d.currentAmount.toNumber(),
    minimumPayment: d.minimumPayment.toNumber(),
  }));
  const assets = ((rawAssets || []) as { id: string; name: string; type: string; value: Prisma.Decimal }[]).map((a) => ({
    ...a,
    value: a.value.toNumber(),
  }));
  const monthlyTransactions = rawMonthlyTransactions.map((t) => ({ ...t, amount: t.amount.toNumber() }));

  const isEmptyLedger = transactions.length === 0 && budgets.length === 0;

  const recurringRules = recRules.map((r) => ({
    ...r,
    amount: r.amount.toNumber(),
    dayOfWeek: r.dayOfWeek,
    dayOfMonth: r.dayOfMonth,
    nextRun: r.nextRun,
    lastRunAt: r.lastRunAt,
  }));

  const incomeThisMonth = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const expenseThisMonth = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = incomeThisMonth - expenseThisMonth;
  const savingsRate = incomeThisMonth > 0 ? (balance / incomeThisMonth) * 100 : 0;
  const totalDebt = debts.reduce((sum, d) => sum + d.currentAmount, 0);

  const totalsByCategory = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += t.amount;
      return acc;
    }, {});

  const chartData = Object.entries(totalsByCategory).map(([category, value]) => ({
    category,
    value,
  }));

  const incomeByMonth = new Map<string, number>();
  const expenseByMonth = new Map<string, number>();

  monthTransactions.forEach((group) => {
    const month = monthKey(group.date);
    const sum = group._sum.amount?.toNumber() ?? 0;
    if (group.type === "income") incomeByMonth.set(month, sum);
    if (group.type === "expense") expenseByMonth.set(month, sum);
  });

  const trendChartData = months.map((month) => ({
    month,
    income: incomeByMonth.get(month) ?? 0,
    expense: expenseByMonth.get(month) ?? 0,
  }));

  const savingsTrendData = months.map((month) => ({
    month,
    income: incomeByMonth.get(month) ?? 0,
    expense: expenseByMonth.get(month) ?? 0,
    savings: (incomeByMonth.get(month) ?? 0) - (expenseByMonth.get(month) ?? 0),
  }));

  const budgetUsageMap: Record<string, { spent: number; budget: number }> = {};
  budgets.forEach(budget => {
    budgetUsageMap[budget.category] = {
      spent: totalsByCategory[budget.category] ?? 0,
      budget: budget.amount,
    };
  });

  const weeklyData = monthlyTransactions
    .filter(t => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      const day = new Date(t.date).toLocaleDateString("en-US", { weekday: "short" });
      const shortDay = day.substring(0, 3);
      if (!acc[shortDay]) acc[shortDay] = 0;
      acc[shortDay] += t.amount;
      return acc;
    }, {});

  const weeklyChartData = Object.entries(weeklyData).map(([day, amount]) => ({ day, amount }));

  const monthComparisonData = months.map((month) => ({
    month,
    income: incomeByMonth.get(month) ?? 0,
    expenses: expenseByMonth.get(month) ?? 0,
    savings: (incomeByMonth.get(month) ?? 0) - (expenseByMonth.get(month) ?? 0),
  }));

  const avgMonthlyIncome = Array.from(incomeByMonth.values()).reduce((a, b) => a + b, 0) / Math.max(1, incomeByMonth.size);
  const avgMonthlyExpense = Array.from(expenseByMonth.values()).reduce((a, b) => a + b, 0) / Math.max(1, expenseByMonth.size);
  const avgMonthlySavings = avgMonthlyIncome - avgMonthlyExpense;

  // Emergency fund = liquid assets covering 3x monthly expenses (never true on zero income)
  const liquidAssetTypes = new Set(["cash", "investment"]);
  const liquidAssets = (assets || []).reduce(
    (sum: number, a: { type: string; value: number }) =>
      liquidAssetTypes.has(a.type) ? sum + a.value : sum,
    0
  );
  const monthlyExpensesForEF = expenseThisMonth > 0 ? expenseThisMonth : avgMonthlyExpense;
  const hasEmergencyFund = monthlyExpensesForEF > 0 && liquidAssets >= monthlyExpensesForEF * 3;
  
  const forecastMonths = Array.from({ length: 3 }).map((_, idx) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + idx + 1, 1));
    return monthKey(d);
  });

  const forecastData = forecastMonths.map((month, idx) => {
    return {
      month,
      projected: balance + (avgMonthlySavings * (idx + 1)),
      optimistic: balance + (avgMonthlySavings * 1.2 * (idx + 1)),
      pessimistic: balance + (avgMonthlySavings * 0.8 * (idx + 1)),
    };
  });

  const aiContext: UserFinancialContext = {
    incomeThisMonth,
    expensesThisMonth: expenseThisMonth,
    balance,
    savingsRate,
    topCategories: chartData.map(({ category, value }) => ({ category, amount: value })),
    budgetsOver: budgets
      .filter((b) => totalsByCategory[b.category] > b.amount)
      .map((b) => b.category),
    savingsGoals: savingsGoals.map((g) => ({
      name: g.name,
      progress: g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0,
    })),
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">BudgetPro</h1>
              <p className="text-xs text-muted-foreground">Financial Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/transactions" prefetch={false}>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                Transactions
              </Button>
            </Link>
            <HeaderActions />
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {isEmptyLedger && <DemoDataBanner userName={session.user.name ?? ""} />}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="gradient-border animate-fade-in stagger-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardDescription className="font-medium">Total Income</CardDescription>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">{formatCurrency(incomeThisMonth)}</div>
              <p className="text-xs text-muted-foreground mt-1">{thisMonth}</p>
            </CardContent>
          </Card>

          <Card className="gradient-border animate-fade-in stagger-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardDescription className="font-medium">Total Expenses</CardDescription>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-500">{formatCurrency(expenseThisMonth)}</div>
              <p className="text-xs text-muted-foreground mt-1">{thisMonth}</p>
            </CardContent>
          </Card>

          <Card className="gradient-border animate-fade-in stagger-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardDescription className="font-medium">Net Balance</CardDescription>
              <PiggyBank className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? "text-primary" : "text-rose-500"}`}>
                {formatCurrency(balance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{thisMonth}</p>
            </CardContent>
          </Card>

          <Card className="gradient-border animate-fade-in stagger-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardDescription className="font-medium">Savings Rate</CardDescription>
              <Target className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">
                {incomeThisMonth > 0 ? ((balance / incomeThisMonth) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Of income saved</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 glass animate-fade-in stagger-5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Financial Overview</CardTitle>
              <CardDescription>Expense breakdown and income vs expense trends</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <ExpensePieChart data={chartData} />
              <IncomeExpenseBar data={trendChartData} />
            </CardContent>
          </Card>
          
          <Card className="glass animate-fade-in stagger-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Savings Trend</CardTitle>
              <CardDescription>Monthly savings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <SavingsTrendChart data={savingsTrendData} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Balance Forecast</CardTitle>
              <CardDescription>Projected balance for next 3 months</CardDescription>
            </CardHeader>
            <CardContent>
              <BalanceForecastChart data={forecastData} />
            </CardContent>
          </Card>

          <Card className="glass animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Monthly Comparison</CardTitle>
              <CardDescription>Compare income and expenses across months</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthComparisonChart data={monthComparisonData} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Weekly Spending</CardTitle>
              <CardDescription>Your spending patterns by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklySpendingChart data={weeklyChartData} />
            </CardContent>
          </Card>

          <SpendingAlerts alerts={[]} budgetUsage={budgetUsageMap} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass animate-fade-in">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Budget Usage</CardTitle>
                <CardDescription>Monthly budget progress</CardDescription>
              </div>
              <BudgetFormDialog />
            </CardHeader>
            <CardContent>
              <BudgetProgressList budgets={budgets} expenses={totalsByCategory} />
            </CardContent>
          </Card>

          <Card className="glass animate-fade-in">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Savings Goals</CardTitle>
                <CardDescription>Track your progress</CardDescription>
              </div>
              <SavingsGoalFormDialog />
            </CardHeader>
            <CardContent>
              {savingsGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No savings goals yet. Create one to start tracking!</p>
              ) : (
                <div className="space-y-3">
                  {savingsGoals.map((goal) => (
                    <SavingsGoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass animate-fade-in">
            <BillReminderList reminders={billReminders} />
          </Card>

          <Card className="glass animate-fade-in">
            <RecurringList rules={recurringRules} created={recurringCreated} />
          </Card>

          <Card className="glass animate-fade-in">
            <DebtTracker debts={debts} />
          </Card>

          <Card className="glass animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Assets</CardTitle>
              <CardDescription>Track your assets and net worth</CardDescription>
            </CardHeader>
            <CardContent>
              <AssetList assets={assets || []} />
            </CardContent>
          </Card>

          <Card className="glass animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Data Backup</CardTitle>
              <CardDescription>Export or import your encrypted data</CardDescription>
            </CardHeader>
            <CardContent>
              <BackupManager />
            </CardContent>
          </Card>

          <Card className="glass animate-fade-in">
            <FinancialReport 
              data={{
                transactions: monthlyTransactions,
                income: incomeThisMonth,
                expenses: expenseThisMonth,
                balance,
                savingsRate,
                topCategories: Object.entries(totalsByCategory).map(([category, amount]) => ({ category, amount })),
              }} 
            />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <GoalSuggestions
              income={incomeThisMonth}
              expenses={expenseThisMonth}
              balance={balance}
              savingsRate={savingsRate}
              totalDebt={totalDebt}
              hasEmergencyFund={hasEmergencyFund}
            />
            <FinancialHealthScore
              data={{
                income: incomeThisMonth,
                expenses: expenseThisMonth,
                balance,
                savingsRate,
                budgetUsage: budgetUsageMap,
                savingsGoals: savingsGoals.map(g => ({ currentAmount: g.currentAmount, targetAmount: g.targetAmount })),
                hasEmergencyFund,
                totalDebt,
              }}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <NetWorthCalculator
              assets={assets || []}
              debts={debts}
            />
          </div>

          <Card className="lg:col-span-2 glass animate-fade-in">
            <TransactionSection transactions={transactions} />
          </Card>
        </div>
      </main>
      <AIChat context={aiContext} />
    </div>
  );
}
