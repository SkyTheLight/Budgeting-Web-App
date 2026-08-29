"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { seedDemoData } from "@/lib/demo";

export async function loadDemoData() {
  const user = await requireAuth();
  const created = await seedDemoData(user.id);
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { created };
}