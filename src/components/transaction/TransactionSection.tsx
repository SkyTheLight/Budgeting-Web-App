"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TransactionTable } from "./TransactionTable";
import { TransactionFilters } from "./TransactionFilters";
import { ExportTransactionsButton } from "./ExportTransactionsButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TransactionFormDialog } from "./TransactionFormDialog";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  category: string;
  date: string | Date;
}

interface TransactionSectionProps {
  transactions: Transaction[];
}

export function TransactionSection({ transactions: initialTransactions }: TransactionSectionProps) {
  const router = useRouter();
  const [filteredTransactions, setFilteredTransactions] = useState(initialTransactions);

  // Keep client-side list in sync after server mutations / refreshes
  useEffect(() => {
    setFilteredTransactions(initialTransactions);
  }, [initialTransactions]);

  function handleSearchChange(search: string) {
    if (!search) {
      setFilteredTransactions(initialTransactions);
      return;
    }
    const lower = search.toLowerCase();
    setFilteredTransactions(
      initialTransactions.filter(
        (tx) =>
          tx.category.toLowerCase().includes(lower) ||
          tx.description?.toLowerCase().includes(lower) ||
          tx.type.toLowerCase().includes(lower)
      )
    );
  }

  function handleDateRangeChange(start: string, end: string) {
    if (!start && !end) {
      setFilteredTransactions(initialTransactions);
      return;
    }
    // Compare by calendar day using the noon-normalized date comparison
    const endExclusive = end ? new Date(`${end}T12:00:00`) : null;
    const startInclusive = start ? new Date(`${start}T00:00:00`) : null;

    setFilteredTransactions(
      initialTransactions.filter((tx) => {
        const txDate = new Date(tx.date);
        if (startInclusive && startInclusive > txDate) return false;
        if (endExclusive && endExclusive < txDate) return false;
        return true;
      })
    );
  }

  function refresh() {
    router.refresh();
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest activity</CardDescription>
        </div>
        <div className="flex gap-2">
          <ExportTransactionsButton transactions={filteredTransactions} />
          <TransactionFormDialog onSuccess={refresh} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <TransactionFilters
            onSearchChange={handleSearchChange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
        <TransactionTable transactions={filteredTransactions} onChange={refresh} />
      </CardContent>
    </Card>
  );
}