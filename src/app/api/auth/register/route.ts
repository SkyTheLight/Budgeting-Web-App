import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Valid email is required").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  name: z.string().trim().min(1, "Name is required").max(80),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit("auth:register", getClientIp(req));
  if (!limited.success) {
    return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Generic message to avoid account enumeration
    return NextResponse.json({ error: "Registration failed" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({ data: { email, password: hashed, name } });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}