import { prisma } from "@/lib/prisma";

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const BACKUP_VERSION = 1;
// Defense-in-depth cap (matches the route-level check): the encoded payload
// must never exceed ~5.5MB, bounding allocation + PBKDF2/AES work per request.
const MAX_ENCODED_BYTES = 6_000_000;

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  category: string;
  date: Date;
}

interface BudgetData {
  id: string;
  category: string;
  month: string;
  amount: number;
}

interface SavingsGoalData {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
  completed: boolean;
}

interface BillReminderData {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  isPaid: boolean;
  lastPaid: Date | null;
}

interface DebtData {
  id: string;
  name: string;
  totalAmount: number;
  currentAmount: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: Date | null;
}

interface AssetData {
  id: string;
  name: string;
  type: string;
  value: number;
}

interface BackupPayload {
  version: number;
  transactions: TransactionData[];
  budgets: BudgetData[];
  savingsGoals: SavingsGoalData[];
  billReminders: BillReminderData[];
  debts: DebtData[];
  assets: AssetData[];
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 150000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

// Chunked base64 to avoid the JS spread-argument limit for large backups
function encodeBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

function decodeBase64(data: string): Uint8Array {
  if (data.length > MAX_ENCODED_BYTES) {
    throw new Error("Backup file too large");
  }
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStringId(value: unknown): value is { id: string } {
  return isRecord(value) && typeof value.id === "string";
}

function sanitizeCollection<T extends { id: string }>(items: unknown): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is T => hasStringId(item)) as T[];
}

export async function exportUserData(userId: string, password: string) {
  const transactions = await prisma.transaction.findMany({ where: { userId } });
  const budgets = await prisma.budget.findMany({ where: { userId } });
  const savingsGoals = await prisma.savingsGoal.findMany({ where: { userId } });
  const billReminders = await prisma.billReminder.findMany({ where: { userId } });
  const debts = await prisma.debt.findMany({ where: { userId } });
  const assets = (prisma as any).asset?.findMany
    ? await (prisma as any).asset.findMany({ where: { userId } })
    : [];

  // Keep a stable shape: strip DB-only fields and add export timestamp
  const strip = (rows: Array<Record<string, unknown>>) =>
    rows.map((row) => {
      const copy = { ...row };
      delete copy.userId;
      delete copy.createdAt;
      delete copy.updatedAt;
      return copy;
    });

  const payload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    transactions: strip(transactions),
    budgets: strip(budgets),
    savingsGoals: strip(savingsGoals),
    billReminders: strip(billReminders),
    debts: strip(debts),
    assets: strip(assets),
  };

  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(JSON.stringify(payload))
  );

  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return encodeBase64(combined);
}

export async function importUserData(userId: string, encryptedData: string, password: string) {
  const combined = decodeBase64(encryptedData);

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  const key = await deriveKey(password, salt);

  let decrypted: ArrayBuffer;
  try {
    decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, encrypted);
  } catch {
    throw new Error("Invalid password or corrupted data");
  }

  const decoder = new TextDecoder();
  const raw = JSON.parse(decoder.decode(decrypted));

  if (!isRecord(raw) || raw.version !== BACKUP_VERSION) {
    throw new Error("Unsupported or corrupted backup format");
  }

  // Validate the payload fully BEFORE touching the database so a malformed
  // (but correctly decrypted) backup can never wipe user data.
  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    transactions: sanitizeCollection<TransactionData>(raw.transactions),
    budgets: sanitizeCollection<BudgetData>(raw.budgets),
    savingsGoals: sanitizeCollection<SavingsGoalData>(raw.savingsGoals),
    billReminders: sanitizeCollection<BillReminderData>(raw.billReminders),
    debts: sanitizeCollection<DebtData>(raw.debts),
    assets: sanitizeCollection<AssetData>(raw.assets),
  };

  const { transactions, budgets, savingsGoals, billReminders, debts, assets } = payload;

  const rebind = async <T extends object>(
    model: {
      createMany: (args: { data: Array<T & { userId: string; id?: string }> }) => Promise<unknown>;
    },
    rows: T[]
  ) => {
    if (rows.length === 0) return;
    // `id: undefined` makes Prisma generate a fresh id for every row
    await model.createMany({
      data: rows.map((row) => ({ ...row, userId, id: undefined })),
    });
  };

  await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { userId } });
    await tx.budget.deleteMany({ where: { userId } });
    await tx.savingsGoal.deleteMany({ where: { userId } });
    await tx.billReminder.deleteMany({ where: { userId } });
    await tx.debt.deleteMany({ where: { userId } });
    if ((tx as any).asset) {
      await (tx as any).asset.deleteMany({ where: { userId } });
    }

    await rebind(tx.transaction, transactions);
    await rebind(tx.budget, budgets);
    await rebind(tx.savingsGoal, savingsGoals);
    await rebind(tx.billReminder, billReminders);
    await rebind(tx.debt, debts);
    if ((tx as any).asset) {
      await rebind((tx as any).asset, assets);
    }
  });

  return { imported: true };
}