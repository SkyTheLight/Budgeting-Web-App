"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRecurringRule, deleteRecurringRule, toggleRecurringRule } from "@/actions/recurringActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { categoryList } from "@/lib/categories";
import { Plus, Repeat, Trash2, Pause, Play } from "lucide-react";

const ruleFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().max(250).optional(),
  cadence: z.enum(["weekly", "monthly"]),
  dayOfWeek: z.string().optional(),
  dayOfMonth: z.string().optional(),
  startDate: z.string().optional(),
});

type RuleFormValues = z.infer<typeof ruleFormSchema>;

export interface RecurringRule {
  id: string;
  name: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  cadence: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  isActive: boolean;
  nextRun: string | Date;
  lastRunAt: string | Date | null;
}

const WEEKDAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

function todayInput(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().split("T")[0];
}

function scheduleLabel(rule: RecurringRule): string {
  if (rule.cadence === "weekly" && rule.dayOfWeek != null) {
    return `Every ${WEEKDAYS.find((w) => w.value === String(rule.dayOfWeek))?.label ?? rule.dayOfWeek}`;
  }
  if (rule.cadence === "monthly" && rule.dayOfMonth != null) {
    return `Monthly on day ${rule.dayOfMonth}`;
  }
  return rule.cadence;
}

export function RecurringList({
  rules: initialRules,
  created,
}: {
  rules: RecurringRule[];
  created: number;
}) {
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: "",
      type: "expense",
      category: "Food",
      amount: 100,
      description: "",
      cadence: "monthly",
      dayOfWeek: String(new Date().getDay()),
      dayOfMonth: String(new Date().getDate()),
      startDate: todayInput(),
    },
  });

  const cadence = watch("cadence");
  const type = watch("type");
  const category = watch("category");

  function refresh() {
    router.refresh();
  }

  async function onSubmit(data: RuleFormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("type", data.type);
    formData.append("category", data.category);
    formData.append("amount", String(data.amount));
    if (data.description) formData.append("description", data.description);
    formData.append("cadence", data.cadence);
    if (data.dayOfWeek !== undefined && data.dayOfWeek !== "") formData.append("dayOfWeek", data.dayOfWeek);
    if (data.dayOfMonth !== undefined && data.dayOfMonth !== "") formData.append("dayOfMonth", data.dayOfMonth);
    if (data.startDate) formData.append("startDate", data.startDate);
    try {
      await createRecurringRule(formData);
      toast.success("Recurring transaction added");
      reset();
      setOpen(false);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add recurring transaction");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onToggle(rule: RecurringRule) {
    const previous = rules;
    const next = !rule.isActive;
    setRules(rules.map((r) => (r.id === rule.id ? { ...r, isActive: next } : r)));
    try {
      await toggleRecurringRule(rule.id, next);
      toast.success(next ? "Recurring transaction resumed" : "Recurring transaction paused");
      refresh();
    } catch {
      setRules(previous);
      toast.error("Could not update recurring transaction");
    }
  }

  async function onDelete(rule: RecurringRule) {
    if (!confirm(`Delete recurring transaction "${rule.name}"?`)) return;
    try {
      await deleteRecurringRule(rule.id);
      setRules(rules.filter((r) => r.id !== rule.id));
      toast.success("Recurring transaction deleted");
      refresh();
    } catch {
      toast.error("Could not delete recurring transaction");
    }
  }
const dueSoon = rules.filter((r) => r.isActive && new Date(r.nextRun) <= new Date()).length;
  const totalUpcoming = rules.filter((r) => r.isActive).reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="h-full">
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Repeat className="h-4 w-4 text-primary" />
            Recurring Transactions
          </h2>
          <p className="text-xs text-muted-foreground">
            {created > 0
              ? `Auto-created ${created} due transaction${created === 1 ? "" : "s"} just now`
              : dueSoon > 0
                ? `${dueSoon} currently due — will be recorded on your next visit`
                : "Automatically records income and bills"}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Recurring Transaction</DialogTitle>
              <DialogDescription>Income or bills that repeat on a schedule</DialogDescription>
            </DialogHeader>
            <form className="space-y-4 py-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="rule-name">Name</Label>
                <Input id="rule-name" placeholder="e.g. Salary, Rent" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive px-2">{errors.name.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rule-type">Type</Label>
                  <Select onValueChange={(v) => setValue("type", v as "income" | "expense")} value={type}>
                    <SelectTrigger id="rule-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-cadence">Cadence</Label>
                  <Select onValueChange={(v) => setValue("cadence", v as "weekly" | "monthly")} value={cadence}>
                    <SelectTrigger id="rule-cadence">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rule-category">Category</Label>
                  <Select onValueChange={(v) => setValue("category", v)} value={category}>
                    <SelectTrigger id="rule-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryList.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      <SelectItem value="Custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                  {category === "Custom" && (
                    <Input id="custom-rule-category" {...register("category")} placeholder="Custom category" className="mt-2" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-amount">Amount</Label>
                  <Input id="rule-amount" type="number" step="0.01" min="0.01" {...register("amount", { valueAsNumber: true })} />
                  {errors.amount && <p className="text-sm text-destructive px-2">{errors.amount.message}</p>}
                </div>
              </div>
              {cadence === "weekly" ? (
                <div className="space-y-2">
                  <Label htmlFor="rule-dow">Repeat on</Label>
                  <Select onValueChange={(v) => setValue("dayOfWeek", v)} value={watch("dayOfWeek")}>
                    <SelectTrigger id="rule-dow">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((w) => (
                        <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="rule-dom">Day of month</Label>
                  <Input id="rule-dom" type="number" min={1} max={31} {...register("dayOfMonth")} />
                  <p className="text-xs text-muted-foreground">
                    Days beyond the month&apos;s length fall to the last day (e.g. 31 → Feb 28/29)
                  </p>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rule-start">First due on</Label>
                  <Input id="rule-start" type="date" {...register("startDate")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-desc">Description</Label>
                  <Input id="rule-desc" placeholder="Optional note" {...register("description")} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">
          No recurring transactions yet. Add your salary or monthly bills and they&apos;ll be recorded automatically.
        </p>
      ) : (
        <div className="max-h-[420px] overflow-y-auto p-4 space-y-2">
          {rules.map((rule) => {
            const imminent = rule.isActive && new Date(rule.nextRun) <= new Date();
            return (
              <div
                key={rule.id}
                className={`rounded-lg border border-border/60 p-3 transition-opacity ${!rule.isActive ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{rule.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {scheduleLabel(rule)} · {rule.category}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      rule.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {rule.type === "income" ? "+" : "−"}
                    {formatCurrency(rule.amount)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className={`text-xs ${imminent ? "font-medium text-amber-500" : "text-muted-foreground"}`}>
                    {imminent
                      ? "Due now — will be recorded"
                      : `Next: ${formatDate(rule.nextRun)}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {rule.isActive && (
                      <span className="text-xs text-muted-foreground px-2">
                        {rule.cadence === "weekly" ? "weekly" : "monthly"}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggle(rule)}
                      aria-label={`${rule.isActive ? "Pause" : "Resume"} ${rule.name}`}
                    >
                      {rule.isActive ? (
                        <>
                          <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 mr-1" /> Resume
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(rule)}
                      aria-label={`Delete ${rule.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rules.some((r) => r.isActive) && (
        <div className="border-t border-border/50 px-6 py-3 text-xs text-muted-foreground">
          Upcoming commitments: {formatCurrency(totalUpcoming)} per cycle
        </div>
      )}
    </div>
  );
}