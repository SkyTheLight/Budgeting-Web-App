import { z } from "zod";

// Single source of truth for every server-side input schema. Imported by both
// server actions and their unit tests so tests can never drift from behavior.

export const transactionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive().max(999999999),
  description: z.string().trim().max(250).optional(),
  category: z.string().trim().min(1, "Category is required").max(50),
  date: z.string().optional(),
}).strict();

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const budgetSchema = z.object({
  id: z.string().optional(),
  category: z.string().trim().min(1, "Category is required").max(50),
  month: z.string().min(1, "Month is required").regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  amount: z.coerce.number().positive("Amount must be positive").min(0.01).max(999999999),
}).strict();

export type BudgetFormValues = z.infer<typeof budgetSchema>;

export const savingsGoalSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  targetAmount: z.coerce.number().positive("Target amount must be positive").min(0.01),
  currentAmount: z.coerce.number().min(0).default(0),
  deadline: z.string().optional(),
});

export type SavingsGoalFormValues = z.infer<typeof savingsGoalSchema>;

export const depositSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .max(999_999_999),
});

export const debtSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(100),
  totalAmount: z.coerce.number().positive().max(999999),
  currentAmount: z.coerce.number().min(0).max(999999),
  interestRate: z.coerce.number().min(0).max(100),
  minimumPayment: z.coerce.number().positive().max(99999),
  dueDate: z.string().optional(),
}).strict();

export type DebtFormValues = z.infer<typeof debtSchema>;

export const paymentSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .max(999_999_999),
});

export const billReminderSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(100),
  amount: z.coerce.number().positive().max(999999),
  dueDay: z.coerce.number().min(1).max(31),
  category: z.string().trim().min(1).max(50),
}).strict();

export type BillReminderFormValues = z.infer<typeof billReminderSchema>;

export const assetSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  type: z.enum(["cash", "investment", "property", "vehicle", "other"]),
  value: z.coerce.number().min(0, "Value cannot be negative").max(999_999_999),
});

export type AssetFormValues = z.infer<typeof assetSchema>;

export const recurringRuleSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Name is required").max(120),
    type: z.enum(["income", "expense"]),
    category: z.string().trim().min(1, "Category is required").max(50),
    amount: z.coerce.number().positive("Amount must be positive").max(999_999_999),
    description: z.string().trim().max(250).optional(),
    startDate: z.string().optional(),
    cadence: z.enum(["weekly", "monthly"]),
    dayOfWeek: z.coerce.number().int().min(0).max(6).nullable().optional(),
    dayOfMonth: z.coerce.number().int().min(1).max(31).nullable().optional(),
  })
  .strict();

export type RecurringRuleFormValues = z.infer<typeof recurringRuleSchema>;