"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { csvField } from "@/lib/csv";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  category: string;
  date: string | Date;
}

export function ExportTransactionsButton({ transactions }: { transactions: Transaction[] }) {
  function handleExport() {
    const headers = ["Date", "Type", "Category", "Amount", "Description"];
    const csvContent = [
      headers.map(csvField).join(","),
      ...transactions.map((tx) =>
        [
          new Date(tx.date).toLocaleDateString(),
          tx.type,
          tx.category,
          tx.amount.toFixed(2),
          tx.description || "",
        ]
          .map(csvField)
          .join(",")
      ),
    ].join("\n");

    // BOM so Excel opens UTF-8 data correctly
    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={transactions.length === 0}>
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}