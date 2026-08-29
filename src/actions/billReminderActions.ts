"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { billReminderSchema } from "@/lib/schemas";

export type BillReminderFormValues = z.infer<typeof billReminderSchema>;

export async function createBillReminder(formData: FormData) {
  const user = await requireAuth();
  
  const rawData: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      rawData[key] = value.trim();
    } else {
      rawData[key] = value;
    }
  }
  
  const values = billReminderSchema.parse(rawData);
  
  const reminder = await prisma.billReminder.create({
    data: {
      userId: user.id,
      name: values.name,
      amount: values.amount,
      dueDay: values.dueDay,
      category: values.category,
    },
  });
  
  revalidatePath("/dashboard");
  return reminder;
}

export async function updateBillReminder(formData: FormData) {
  const user = await requireAuth();
  const values = billReminderSchema.parse(Object.fromEntries(formData.entries()));
  
  if (!values.id) throw new Error("Missing reminder id");
  
  const result = await prisma.billReminder.updateMany({
    where: { id: values.id, userId: user.id },
    data: {
      name: values.name,
      amount: values.amount,
      dueDay: values.dueDay,
      category: values.category,
    },
  });

  if (result.count === 0) throw new Error("Bill reminder not found");
  
  revalidatePath("/dashboard");
  return result;
}

export async function markBillPaid(id: string) {
  const user = await requireAuth();

  const reminder = await prisma.billReminder.findFirst({
    where: { id, userId: user.id },
    select: { id: true, name: true, amount: true, category: true, isPaid: true },
  });

  if (!reminder) {
    throw new Error("Bill reminder not found");
  }

  if (reminder.isPaid) {
    return { success: true, message: "Bill was already marked as paid" };
  }

  const transactionId = randomUUID();

  // Atomic: only one concurrent caller can flip isPaid -> false guard, so only
  // one expense transaction is ever created for a given bill.
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.billReminder.updateMany({
      where: { id, userId: user.id, isPaid: false },
      data: {
        isPaid: true,
        lastPaid: new Date(),
        paidTransactionId: transactionId,
      },
    });

    if (updated.count === 0) {
      return { created: false as const };
    }

    await tx.transaction.create({
      data: {
        id: transactionId,
        userId: user.id,
        type: "expense",
        amount: reminder.amount,
        description: `Bill paid: ${reminder.name}`,
        category: reminder.category,
        date: new Date(),
      },
    });

    return { created: true as const };
  });

  revalidatePath("/dashboard");
  return {
    success: true,
    message: result.created
      ? "Bill marked as paid and added to transactions"
      : "Bill was already marked as paid",
  };
}

export async function markBillUnpaid(id: string) {
  const user = await requireAuth();

  const reminder = await prisma.billReminder.findFirst({
    where: { id, userId: user.id },
    select: { id: true, isPaid: true, paidTransactionId: true },
  });

  if (!reminder) return;

  if (!reminder.isPaid) return;

  await prisma.$transaction([
    prisma.billReminder.updateMany({
      where: { id, userId: user.id },
      data: { isPaid: false, lastPaid: null, paidTransactionId: null },
    }),
    ...(reminder.paidTransactionId
      ? [
          prisma.transaction.deleteMany({
            where: { id: reminder.paidTransactionId, userId: user.id },
          }),
        ]
      : []),
  ]);

  revalidatePath("/dashboard");
}

export async function deleteBillReminder(id: string) {
  const user = await requireAuth();
  
  await prisma.billReminder.deleteMany({
    where: { id, userId: user.id },
  });
  
  revalidatePath("/dashboard");
}