"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { budgetSchema } from "@/lib/schemas";

export type BudgetFormValues = z.infer<typeof budgetSchema>;

export async function upsertBudget(formData: FormData) {
  const user = await requireAuth();
  
  // Sanitize inputs
  const rawData: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      rawData[key] = value.trim();
    } else {
      rawData[key] = value;
    }
  }
  
  const values = budgetSchema.parse(rawData);

  // Native upsert removes the find-then-create race condition
  await prisma.budget.upsert({
    where: {
      userId_category_month: {
        userId: user.id,
        category: values.category,
        month: values.month,
      },
    },
    update: { amount: values.amount },
    create: { ...values, userId: user.id },
  });

  revalidatePath("/dashboard");
}

export async function deleteBudget(id: string) {
  const user = await requireAuth();
  await prisma.budget.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard");
}
