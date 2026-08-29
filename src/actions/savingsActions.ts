"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { dateOnlyToDate } from "@/lib/utils";
import { savingsGoalSchema, depositSchema } from "@/lib/schemas";

export type SavingsGoalFormValues = z.infer<typeof savingsGoalSchema>;

export async function createSavingsGoal(formData: FormData) {
  const user = await requireAuth();
  const values = savingsGoalSchema.parse(Object.fromEntries(formData.entries()));

  await prisma.savingsGoal.create({
    data: {
      name: values.name,
      targetAmount: values.targetAmount,
      currentAmount: values.currentAmount || 0,
      deadline: values.deadline ? dateOnlyToDate(values.deadline) : null,
      userId: user.id,
    },
  });

  revalidatePath("/dashboard");
}

export async function updateSavingsGoal(formData: FormData) {
  const user = await requireAuth();
  const values = savingsGoalSchema.parse(Object.fromEntries(formData.entries()));

  if (!values.id) throw new Error("Missing savings goal id");

  await prisma.savingsGoal.updateMany({
    where: { id: values.id, userId: user.id },
    data: {
      name: values.name,
      targetAmount: values.targetAmount,
      currentAmount: values.currentAmount,
      completed: values.currentAmount >= values.targetAmount,
      deadline: values.deadline ? dateOnlyToDate(values.deadline) : null,
    },
  });

  revalidatePath("/dashboard");
}

export async function addToSavingsGoal(id: string, amount: number) {
  const user = await requireAuth();
  const { amount: deposit } = depositSchema.parse({ amount });

  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId: user.id },
    select: { id: true, targetAmount: true },
  });

  if (!goal) throw new Error("Savings goal not found");

  // Atomic increment avoids lost updates from concurrent requests
  await prisma.savingsGoal.update({
    where: { id },
    data: { currentAmount: { increment: deposit } },
  });

  if (goal.targetAmount.gt(0)) {
    const updated = await prisma.savingsGoal.findUnique({
      where: { id },
      select: { currentAmount: true },
    });
    if (updated && updated.currentAmount >= goal.targetAmount) {
      await prisma.savingsGoal.update({
        where: { id },
        data: { completed: true },
      });
    }
  }

  revalidatePath("/dashboard");
}

export async function deleteSavingsGoal(id: string) {
  const user = await requireAuth();

  await prisma.savingsGoal.deleteMany({
    where: { id, userId: user.id },
  });

  revalidatePath("/dashboard");
}
