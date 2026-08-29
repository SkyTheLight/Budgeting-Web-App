"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { recurringRuleSchema } from "@/lib/schemas";
import { initialRun } from "@/lib/recurring";
import { dateOnlyToDate } from "@/lib/utils";

export async function createRecurringRule(formData: FormData) {
  const user = await requireAuth();
  const values = recurringRuleSchema.parse(Object.fromEntries(formData.entries()));

  if (values.cadence === "weekly" && values.dayOfWeek == null) {
    throw new Error("dayOfWeek is required for weekly rules");
  }
  if (values.cadence === "monthly" && values.dayOfMonth == null) {
    throw new Error("dayOfMonth is required for monthly rules");
  }

  // Anchor the first occurrence to (optional) start date or today.
  const anchor = values.startDate ? dateOnlyToDate(values.startDate) : new Date();

  const rule = await prisma.recurringRule.create({
    data: {
      userId: user.id,
      name: values.name,
      type: values.type,
      category: values.category,
      amount: values.amount,
      description: values.description ?? null,
      cadence: values.cadence,
      dayOfWeek: values.cadence === "weekly" ? values.dayOfWeek : null,
      dayOfMonth: values.cadence === "monthly" ? values.dayOfMonth : null,
      nextRun: initialRun(
        { cadence: values.cadence, dayOfWeek: values.dayOfWeek, dayOfMonth: values.dayOfMonth },
        anchor
      ),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { rule };
}

export async function deleteRecurringRule(id: string) {
  const user = await requireAuth();
  await prisma.recurringRule.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function toggleRecurringRule(id: string, isActive: boolean) {
  const user = await requireAuth();
  await prisma.recurringRule.updateMany({ where: { id, userId: user.id }, data: { isActive } });
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}