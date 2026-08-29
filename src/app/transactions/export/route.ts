import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { dateOnlyToDate, dayAfter } from "@/lib/utils";
import { csvField } from "@/lib/csv";
import { processDueRecurring } from "@/lib/recurring";

export const dynamic = "force-dynamic";

const EXPORT_LIMIT = 5000;

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  await processDueRecurring(session.user.id);

  const url = new URL(request.url);
  const q = single(url.searchParams.get("q") ?? undefined).trim();
  const from = single(url.searchParams.get("from") ?? undefined);
  const to = single(url.searchParams.get("to") ?? undefined);

  const where: Prisma.TransactionWhereInput = { userId: session.user.id };
  if (q) {
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { type: { contains: q, mode: "insensitive" } },
    ];
  }
  const dateFilter: Prisma.DateTimeFilter = {};
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) dateFilter.gte = dateOnlyToDate(from);
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) dateFilter.lt = dayAfter(to);
  if (from || to) where.date = dateFilter;

  const txs = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    take: EXPORT_LIMIT,
    select: { date: true, type: true, category: true, amount: true, description: true },
  });

  const headers = ["Date", "Type", "Category", "Amount", "Description"];
  const lines = [
    headers.join(","),
    ...txs.map((t) =>
      [
        t.date.toISOString().slice(0, 10),
        t.type,
        t.category,
        t.amount.toNumber().toFixed(2),
        t.description || "",
      ]
        .map(csvField)
        .join(",")
    ),
  ];

  const csv = lines.join("\r\n");
  const truncated = txs.length === EXPORT_LIMIT ? "\r\n# Exported limit reached; narrow your filters to export more.\r\n" : "";
  const body = `\uFEFF${csv}${truncated}`;
  const filename = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}