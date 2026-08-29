import { redirect } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { dateOnlyToDate, dayAfter } from "@/lib/utils";
import { processDueRecurring } from "@/lib/recurring";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NewTransactionButton, PagedTable } from "./TransactionControls";
import { ArrowLeft, Download, Search, X } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getAuthSession();
  if (!session?.user) redirect("/auth/login");
  const userId = session.user.id;

  await processDueRecurring(userId);

  const q = single(searchParams.q).trim();
  const from = single(searchParams.from);
  const to = single(searchParams.to);
  const cursor = single(searchParams.cursor);

  const where: Prisma.TransactionWhereInput = { userId };
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

  // Keyset pagination: newest-first by default; continue with `cursor` = last
  // row id of the current page. Composite order keeps ties deterministic.
  const rows = await prisma.transaction.findMany({
    where,
    orderBy: [{ date: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const items = rows.slice(0, PAGE_SIZE).map((t) => ({ ...t, amount: t.amount.toNumber() }));
  const hasOlder = rows.length > PAGE_SIZE;
  const total = await prisma.transaction.count({ where });

  function link(extra: Record<string, string>) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    for (const [k, v] of Object.entries(extra)) if (v) params.set(k, v);
    const query = params.toString();
    return `/transactions${query ? `?${query}` : ""}`;
  }

  const olderLink = hasOlder && items.length > 0 ? link({ cursor: items[items.length - 1].id }) : null;
  const newestLink = cursor ? link({}) : null;
  const active = Boolean(q || from || to);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Transactions</h1>
      <p className="mb-6 text-sm text-muted-foreground">Search and browse your full history</p>

      <Card className="glass animate-fade-in">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>{total} record{total === 1 ? "" : "s"}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Link href={link({})} prefetch={false}>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </Link>
            <NewTransactionButton />
          </div>
        </CardHeader>
        <CardContent>
          <form action="/transactions" method="get" className="mb-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Search description, category, type..."
                  className="pl-9"
                  aria-label="Search transactions"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                From
                <Input name="from" type="date" defaultValue={from} className="w-36" aria-label="From date" />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                To
                <Input name="to" type="date" defaultValue={to} className="w-36" aria-label="To date" />
              </label>
              <Button type="submit" size="sm">Apply</Button>
              {active && (
                <Link href="/transactions" prefetch={false}>
                  <Button type="button" variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </Link>
              )}
            </div>
          </form>

          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions match{active ? " your filters" : ""}. Try adding one with the New Transaction button.
            </p>
          ) : (
            <>
              <PagedTable transactions={items} />
              <div className="mt-4 flex items-center justify-between">
                <Link href="/dashboard" prefetch={false}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <div className="flex gap-2">
                  {newestLink && (
                    <Link href={newestLink} prefetch={false}>
                      <Button variant="outline" size="sm">Newest</Button>
                    </Link>
                  )}
                  {olderLink && (
                    <Link href={olderLink} prefetch={false}>
                      <Button variant="outline" size="sm">Older</Button>
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}