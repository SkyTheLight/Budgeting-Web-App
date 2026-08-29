"use client";

import { useState } from "react";
import { Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TransactionFiltersProps {
  onSearchChange: (search: string) => void;
  onDateRangeChange: (start: string, end: string) => void;
}

export function TransactionFilters({ onSearchChange, onDateRangeChange }: TransactionFiltersProps) {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    onSearchChange(e.target.value);
  }

  function handleApply() {
    onDateRangeChange(startDate, endDate);
  }

  function handleClear() {
    setStartDate("");
    setEndDate("");
    onDateRangeChange("", "");
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={search}
          onChange={handleSearchChange}
          className="pl-9"
        />
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-36"
          aria-label="Start date"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-36"
          aria-label="End date"
        />
        <Button size="sm" onClick={handleApply}>Apply</Button>
        <Button size="sm" variant="outline" onClick={handleClear}>Clear</Button>
      </div>
    </div>
  );
}