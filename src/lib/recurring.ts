import { prisma } from "@/lib/prisma";

// Lazy recurring engine. Rules store a precomputed `nextRun` (UTC midnight of
// the next due calendar day). Any page that shows ledger data calls
// `processDueRecurring` first, so missed cycles are reconciled on access
// without needing a cron job.

export const MAX_CATCH_UP = 6;

function lastDayOfMonth(year: number, month: number): number {
  // month is 0-indexed; day 0 of the next month = last day of this month
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function addDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

// Keep 29/30/31 rules anchored to the end of short months so they never drift.
export function clampToMonth(date: Date): Date {
  const dim = lastDayOfMonth(date.getUTCFullYear(), date.getUTCMonth());
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), Math.min(date.getUTCDate(), dim)));
}

// First future occurrence of a rule relative to `from` (strictly after today).
export function initialRun(rule: {
  cadence: string;
  dayOfWeek: number | null | undefined;
  dayOfMonth: number | null | undefined;
}, from: Date): Date {
  if (rule.cadence === "weekly") {
    const target = rule.dayOfWeek ?? 0;
    // from.getUTCDay() === target -> next week (delta 7), not today.
    const days = (((target - from.getUTCDay()) % 7) + 7) % 7 || 7;
    return addDays(from, days);
  }
  const day = Math.max(1, Math.min(31, rule.dayOfMonth ?? 1));
  const sameMonth = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), day));
  if (sameMonth.getTime() > from.getTime()) return clampToMonth(sameMonth);
  return clampToMonth(new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, day)));
}

// Advance a rule one cycle past `after`.
export function advanceRule(rule: {
  cadence: string;
  dayOfMonth: number | null | undefined;
}, after: Date): Date {
  if (rule.cadence === "weekly") return addDays(after, 7);
  const day = Math.max(1, Math.min(31, rule.dayOfMonth ?? 1));
  return clampToMonth(new Date(Date.UTC(after.getUTCFullYear(), after.getUTCMonth() + 1, day)));
}

// Reconcile every due rule: create a transaction dated at each missed cycle
// day, then roll `nextRun` forward. Returns how many transactions were created.
export async function processDueRecurring(userId: string): Promise<number> {
  const now = new Date();
  const rules = await prisma.recurringRule.findMany({
    where: { userId, isActive: true, nextRun: { lte: now } },
    orderBy: { nextRun: "asc" },
  });

  let created = 0;

  for (const rule of rules) {
    let nextRun = rule.nextRun;
    let cycles = 0;
    while (nextRun.getTime() <= now.getTime() && cycles < MAX_CATCH_UP) {
      const processed = await prisma.$transaction(async (tx) => {
        // Guard against a concurrent run already reconciling this rule.
        const fresh = await tx.recurringRule.findFirst({
          where: { id: rule.id, userId, isActive: true, nextRun: { lte: now } },
        });
        if (!fresh) return false;

        const advanced = advanceRule(rule, nextRun);
        await tx.transaction.create({
          data: {
            userId,
            type: rule.type,
            category: rule.category,
            amount: rule.amount,
            description: rule.description,
            date: nextRun,
          },
        });
        await tx.recurringRule.update({
          where: { id: rule.id },
          data: { nextRun: advanced, lastRunAt: nextRun },
        });
        nextRun = advanced;
        return true;
      });

      if (!processed) break;
      created += 1;
      cycles += 1;
    }
  }

  return created;
}