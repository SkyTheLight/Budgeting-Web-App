import { prisma } from "@/lib/prisma";
import { monthKey } from "@/lib/utils";
import { initialRun } from "@/lib/recurring";

// Three months of believable history so a new user can explore charts,
// budgets, bills, savings, debt, assets and recurring rules immediately.

type TxSeed = {
  dayOffset: number;
  type: "income" | "expense";
  category: string;
  amount: number;
  description?: string;
};

const txSeeds: TxSeed[] = [
  // Income
  { dayOffset: 2, type: "income", category: "Salary", amount: 45000, description: "Monthly salary" },
  { dayOffset: 32, type: "income", category: "Salary", amount: 45000, description: "Monthly salary" },
  { dayOffset: 62, type: "income", category: "Salary", amount: 45000, description: "Monthly salary" },
  { dayOffset: 16, type: "income", category: "Freelance", amount: 2500, description: "Side project" },
  { dayOffset: 46, type: "income", category: "Freelance", amount: 3000, description: "Side project" },
  // Housing
  { dayOffset: 3, type: "expense", category: "Rent", amount: 12000, description: "Monthly rent" },
  { dayOffset: 33, type: "expense", category: "Rent", amount: 12000, description: "Monthly rent" },
  { dayOffset: 63, type: "expense", category: "Rent", amount: 12000, description: "Monthly rent" },
  // Utilities
  { dayOffset: 5, type: "expense", category: "Electricity", amount: 2200 },
  { dayOffset: 35, type: "expense", category: "Electricity", amount: 2100 },
  { dayOffset: 65, type: "expense", category: "Electricity", amount: 2350 },
  { dayOffset: 7, type: "expense", category: "Internet", amount: 1500 },
  { dayOffset: 37, type: "expense", category: "Internet", amount: 1500 },
  { dayOffset: 67, type: "expense", category: "Internet", amount: 1500 },
  // Food
  { dayOffset: 4, type: "expense", category: "Groceries", amount: 3500, description: "Weekly groceries" },
  { dayOffset: 11, type: "expense", category: "Groceries", amount: 2800 },
  { dayOffset: 18, type: "expense", category: "Groceries", amount: 3200 },
  { dayOffset: 25, type: "expense", category: "Groceries", amount: 2600 },
  { dayOffset: 34, type: "expense", category: "Groceries", amount: 3600 },
  { dayOffset: 41, type: "expense", category: "Groceries", amount: 2950 },
  { dayOffset: 48, type: "expense", category: "Groceries", amount: 3100 },
  { dayOffset: 55, type: "expense", category: "Groceries", amount: 2750 },
  { dayOffset: 64, type: "expense", category: "Groceries", amount: 3300 },
  { dayOffset: 71, type: "expense", category: "Groceries", amount: 2900 },
  // Transport
  { dayOffset: 6, type: "expense", category: "Transport", amount: 900 },
  { dayOffset: 13, type: "expense", category: "Transport", amount: 600 },
  { dayOffset: 20, type: "expense", category: "Transport", amount: 750 },
  { dayOffset: 27, type: "expense", category: "Transport", amount: 820 },
  { dayOffset: 36, type: "expense", category: "Transport", amount: 880 },
  { dayOffset: 43, type: "expense", category: "Transport", amount: 540 },
  { dayOffset: 50, type: "expense", category: "Transport", amount: 700 },
  { dayOffset: 57, type: "expense", category: "Transport", amount: 790 },
  { dayOffset: 66, type: "expense", category: "Transport", amount: 620 },
  { dayOffset: 73, type: "expense", category: "Transport", amount: 690 },
  // Dining / shopping / health / subscriptions / misc
  { dayOffset: 9, type: "expense", category: "Dining", amount: 950, description: "Dinner out" },
  { dayOffset: 22, type: "expense", category: "Dining", amount: 650 },
  { dayOffset: 39, type: "expense", category: "Dining", amount: 1100 },
  { dayOffset: 52, type: "expense", category: "Dining", amount: 790 },
  { dayOffset: 69, type: "expense", category: "Dining", amount: 600 },
  { dayOffset: 15, type: "expense", category: "Shopping", amount: 1800, description: "Clothes" },
  { dayOffset: 45, type: "expense", category: "Shopping", amount: 950 },
  { dayOffset: 8, type: "expense", category: "Health", amount: 400, description: "Pharmacy" },
  { dayOffset: 38, type: "expense", category: "Health", amount: 850 },
  { dayOffset: 10, type: "expense", category: "Subscription", amount: 499, description: "Streaming" },
  { dayOffset: 40, type: "expense", category: "Subscription", amount: 499 },
  { dayOffset: 70, type: "expense", category: "Subscription", amount: 499 },
  { dayOffset: 12, type: "expense", category: "Other", amount: 300 },
  { dayOffset: 42, type: "expense", category: "Other", amount: 500 },
  { dayOffset: 72, type: "expense", category: "Other", amount: 250 },
];

const currentBudgets: Array<[string, number]> = [
  ["Rent", 12000],
  ["Groceries", 12000],
  ["Transport", 4000],
  ["Dining", 4000],
  ["Electricity", 3000],
  ["Shopping", 5000],
  ["Health", 2000],
  ["Internet", 1500],
  ["Subscription", 1000],
];

function daysAgo(offset: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
}

// Seeds three months of demo data. Only seeds when the ledger is empty.
export async function seedDemoData(userId: string): Promise<number> {
  const txCount = await prisma.transaction.count({ where: { userId } });
  if (txCount > 0) return 0;

  const transactions = txSeeds.map((t) => ({
    userId,
    type: t.type,
    category: t.category,
    amount: t.amount,
    description: t.description ?? null,
    date: daysAgo(t.dayOffset),
  }));

  const now = new Date();
  const thisMonth = monthKey(now);

  await prisma.$transaction([
    prisma.transaction.createMany({ data: transactions }),
    prisma.budget.createMany({
      data: currentBudgets.map(([category, amount]) => ({
        userId,
        category,
        month: thisMonth,
        amount,
      })),
    }),
    prisma.savingsGoal.create({
      data: {
        userId,
        name: "Emergency Fund",
        targetAmount: 50000,
        currentAmount: 12000,
      },
    }),
    prisma.savingsGoal.create({
      data: {
        userId,
        name: "New Laptop",
        targetAmount: 80000,
        currentAmount: 12500,
      },
    }),
    prisma.billReminder.createMany({
      data: [
        { userId, name: "Rent", amount: 12000, dueDay: 1, category: "Rent" },
        { userId, name: "Internet", amount: 1500, dueDay: 15, category: "Internet" },
        { userId, name: "Electricity", amount: 3000, dueDay: 20, category: "Electricity" },
        { userId, name: "Phone", amount: 900, dueDay: 25, category: "Utilities" },
      ],
    }),
    prisma.debt.create({
      data: {
        userId,
        name: "Credit Card",
        totalAmount: 25000,
        currentAmount: 12500,
        interestRate: 3.5,
        minimumPayment: 1250,
        dueDate: daysAgo(0),
      },
    }),
    prisma.debt.create({
      data: {
        userId,
        name: "Personal Loan",
        totalAmount: 60000,
        currentAmount: 45000,
        interestRate: 12,
        minimumPayment: 3000,
        dueDate: daysAgo(0),
      },
    }),
    prisma.asset.createMany({
      data: [
        { userId, name: "Cash Savings", type: "cash", value: 18500 },
        { userId, name: "Index Fund", type: "investment", value: 35000 },
      ],
    }),
  ]);

  // Rules anchored so the next run lands after today.
  const anchor = new Date();
  const rules = [
    {
      userId,
      name: "Salary",
      type: "income" as const,
      category: "Salary",
      amount: 45000,
      description: "Monthly salary",
      cadence: "monthly",
      dayOfWeek: null,
      dayOfMonth: 1,
    },
    {
      userId,
      name: "Groceries",
      type: "expense" as const,
      category: "Groceries",
      amount: 3000,
      description: "Weekly groceries",
      cadence: "weekly",
      dayOfWeek: 0,
      dayOfMonth: null,
    },
    {
      userId,
      name: "Rent",
      type: "expense" as const,
      category: "Rent",
      amount: 12000,
      description: "Monthly rent",
      cadence: "monthly",
      dayOfWeek: null,
      dayOfMonth: 1,
    },
  ];

  await prisma.recurringRule.createMany({
    data: rules.map((r) => ({
      ...r,
      nextRun: initialRun(
        { cadence: r.cadence as "weekly" | "monthly", dayOfWeek: r.dayOfWeek, dayOfMonth: r.dayOfMonth },
        anchor
      ),
    })),
  });

  return transactions.length;
}