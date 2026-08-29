import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  rateLimit,
  getClientIp,
  MAX_BACKUP_FILE_MB,
  MAX_BACKUP_PASSWORD_LENGTH,
  MIN_BACKUP_PASSWORD_LENGTH,
} from "@/lib/rateLimit";
import { importUserData } from "@/lib/backup";

const MAX_IMPORT_BODY_BYTES = 1024 * 1024 + MAX_BACKUP_FILE_MB * 1024 * 1024;
// base64 inflates by ~4/3, so preempt before consuming/decompressing anything
const MAX_BASE64_LENGTH = MAX_IMPORT_BODY_BYTES * 1.5;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit("backup:import", getClientIp(req));
  if (!limited.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const encryptedData = typeof body?.encryptedData === "string" ? body.encryptedData : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!encryptedData || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (password.length < MIN_BACKUP_PASSWORD_LENGTH || password.length > MAX_BACKUP_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be ${MIN_BACKUP_PASSWORD_LENGTH}-${MAX_BACKUP_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  if (encryptedData.length > MAX_BASE64_LENGTH) {
    return NextResponse.json({ error: "Backup file too large" }, { status: 413 });
  }

  try {
    await importUserData(session.user.id, encryptedData, password);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 400 }
    );
  }
}