"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { dateOnlyToDate } from "@/lib/utils";
import { debtSchema, paymentSchema } from "@/lib/schemas";

export type DebtFormValues = z.infer<typeof debtSchema>;

export async function createDebt(formData: FormData) {
  const user = await requireAuth();
  
  const rawData: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      rawData[key] = value.trim();
    } else {
      rawData[key] = value;
    }
  }
  
  const values = debtSchema.parse(rawData);

  if (values.currentAmount > values.totalAmount) {
    throw new Error("Remaining balance cannot exceed the total amount");
  }

  const debt = await prisma.debt.create({
    data: {
      userId: user.id,
      name: values.name,
      totalAmount: values.totalAmount,
      currentAmount: values.currentAmount,
      interestRate: values.interestRate,
      minimumPayment: values.minimumPayment,
      dueDate: values.dueDate ? dateOnlyToDate(values.dueDate) : null,
    },
  });

  revalidatePath("/dashboard");
  return debt;
}

export async function updateDebt(formData: FormData) {
  const user = await requireAuth();
  const values = debtSchema.parse(Object.fromEntries(formData.entries()));
  
  if (!values.id) throw new Error("Missing debt id");

  if (values.currentAmount > values.totalAmount) {
    throw new Error("Remaining balance cannot exceed the total amount");
  }
  
  const debt = await prisma.debt.updateMany({
    where: { id: values.id, userId: user.id },
    data: {
      name: values.name,
      totalAmount: values.totalAmount,
      currentAmount: values.currentAmount,
      interestRate: values.interestRate,
      minimumPayment: values.minimumPayment,
      dueDate: values.dueDate ? dateOnlyToDate(values.dueDate) : null,
    },
  });

  revalidatePath("/dashboard");
  return debt;
}

export async function makeDebtPayment(id: string, amount: number) {
  const user = await requireAuth();
  const { amount: payment } = paymentSchema.parse({ amount });

  // Atomic, guarded decrement prevents over-payment and lost updates
  const result = await prisma.debt.updateMany({
    where: { id, userId: user.id, currentAmount: { gte: payment } },
    data: {
      currentAmount: { decrement: payment },
      updatedAt: new Date(),
    },
  });

  if (result.count === 0) {
    const exists = await prisma.debt.findFirst({ where: { id, userId: user.id } });
    if (!exists) throw new Error("Debt not found");
    throw new Error("Payment exceeds remaining balance");
  }

  const updated = await prisma.debt.findUnique({
    where: { id },
    select: { currentAmount: true },
  });
  const completed = updated ? updated.currentAmount.lte(0) : false;

  revalidatePath("/dashboard");
  return { success: true, completed };
}

export async function deleteDebt(id: string) {
  const user = await requireAuth();
  
  await prisma.debt.deleteMany({
    where: { id, userId: user.id },
  });
  
  revalidatePath("/dashboard");
}