"use client";

import { useRouter } from "next/navigation";
import { TransactionTable } from "@/components/transaction/TransactionTable";
import { TransactionFormDialog } from "@/components/transaction/TransactionFormDialog";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  category: string;
  date: string | Date;
}

export function NewTransactionButton() {
  const router = useRouter();
  return <TransactionFormDialog onSuccess={() => router.refresh()} />;
}

export function PagedTable({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter();
  return <TransactionTable transactions={transactions} onChange={() => router.refresh()} />;
}