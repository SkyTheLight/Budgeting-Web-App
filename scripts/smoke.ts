import { prisma } from "@/lib/prisma";
import { seedDemoData } from "@/lib/demo";
import { processDueRecurring } from "@/lib/recurring";

async function main() {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  }

  const email = `smoke-${Date.now()}@test.local`;
  const user = await prisma.user.create({
    data: { email, password: "x", name: "Smoke" },
  });

  const first = await seedDemoData(user.id);
  if (first <= 0) throw new Error("seedDemoData created nothing on empty ledger");
  const second = await seedDemoData(user.id);
  if (second !== 0) throw new Error("seedDemoData is not idempotent");

  const txs = await prisma.transaction.count({ where: { userId: user.id } });
  if (txs !== first) throw new Error(`expected ${first} txs, got ${txs}`);

  // Force one rule due in the past
  const rule = await prisma.recurringRule.findFirstOrThrow({ where: { userId: user.id, cadence: "monthly" } });
  const due = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  due.setUTCDate(due.getUTCDate() - 2);
  await prisma.recurringRule.update({ where: { id: rule.id }, data: { nextRun: due } });

  const before = await prisma.transaction.count({ where: { userId: user.id } });
  const created = await processDueRecurring(user.id);
  const after = await prisma.transaction.count({ where: { userId: user.id } });
  if (created < 1 || after <= before) throw new Error("processDueRecurring created no transaction");

  const freshRule = await prisma.recurringRule.findUniqueOrThrow({ where: { id: rule.id } });
  if (freshRule.nextRun.getTime() <= new Date().getTime()) throw new Error("nextRun did not roll forward");
  if (!freshRule.lastRunAt) throw new Error("lastRunAt not set");

  // Double-invoke must not duplicate the due transaction
  await prisma.recurringRule.update({ where: { id: rule.id }, data: { nextRun: due } });
  const created2 = await processDueRecurring(user.id);
  const after2 = await prisma.transaction.count({ where: { userId: user.id } });
  if (created2 < 1 || after2 !== after + created2) throw new Error("re-enqueue double-counted");

  // cleanup
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.savingsGoal.deleteMany({ where: { userId: user.id } });
  await prisma.billReminder.deleteMany({ where: { userId: user.id } });
  await prisma.debt.deleteMany({ where: { userId: user.id } });
  await prisma.asset.deleteMany({ where: { userId: user.id } });
  await prisma.recurringRule.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log(`SMOKE OK: ${first} demo txs, recurring created ${created}, re-run created ${created2}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});