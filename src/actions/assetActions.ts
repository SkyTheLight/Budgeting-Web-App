"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { assetSchema } from "@/lib/schemas";

export type AssetFormValues = import("zod").infer<typeof assetSchema>;

export async function createAsset(data: Record<string, unknown>) {
  const user = await requireAuth();

  const prismaAny = prisma as any;
  if (!prismaAny.asset) return;

  const values = assetSchema.parse(data);

  await prismaAny.asset.create({
    data: { ...values, userId: user.id },
  });
  revalidatePath("/dashboard");
}

export async function updateAsset(id: string, data: Record<string, unknown>) {
  const user = await requireAuth();

  const prismaAny = prisma as any;
  if (!prismaAny.asset) return;

  const parsed = assetSchema.partial().parse(data);

  const result = await prismaAny.asset.updateMany({
    where: { id, userId: user.id },
    data: parsed,
  });

  if (result.count === 0) throw new Error("Asset not found");
  revalidatePath("/dashboard");
}

export async function deleteAsset(id: string) {
  const user = await requireAuth();

  const prismaAny = prisma as any;
  if (!prismaAny.asset) return;

  const result = await prismaAny.asset.deleteMany({
    where: { id, userId: user.id },
  });

  if (result.count === 0) throw new Error("Asset not found");
  revalidatePath("/dashboard");
}