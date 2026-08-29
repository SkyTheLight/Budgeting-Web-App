"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { deleteSavingsGoal, addToSavingsGoal } from "@/actions/savingsActions";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | Date | null;
  completed: boolean;
}

export function SavingsGoalCard({ goal }: { goal: SavingsGoal }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [addAmount, setAddAmount] = useState("");

  const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  async function handleAdd() {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await addToSavingsGoal(goal.id, amount);
      toast.success(`Added ${formatCurrency(amount)} to ${goal.name}`);
      setAddAmount("");
      setShowAdd(false);
      router.refresh();
    } catch (_error) {
      toast.error("Failed to add to savings");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${goal.name}" savings goal?`)) return;
    try {
      await deleteSavingsGoal(goal.id);
      toast.success("Savings goal deleted");
      router.refresh();
    } catch (_error) {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              goal.completed ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-primary/10"
            }`}
          >
            <Target
              className={`h-5 w-5 ${goal.completed ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}
            />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{goal.name}</h3>
            <p className="text-sm text-muted-foreground">
              {goal.completed ? (
                <span className="text-emerald-600 dark:text-emerald-400">Goal reached!</span>
              ) : (
                <span>{formatCurrency(remaining)} remaining</span>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-muted-foreground hover:text-rose-500"
          aria-label={`Delete ${goal.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">
            {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
          </span>
          <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
        </div>
        <Progress
          value={progress}
          variant={goal.completed ? "success" : progress >= 75 ? "warning" : "default"}
        />
      </div>

      {goal.deadline && (
        <p className="mt-3 text-xs text-muted-foreground">
          Deadline: {new Date(goal.deadline).toLocaleDateString()}
        </p>
      )}

      {!goal.completed && (
        <div className="mt-3">
          {showAdd ? (
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="h-8"
                aria-label="Amount to add"
              />
              <Button size="sm" onClick={handleAdd} className="h-8">
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="h-8">
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdd(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add savings
            </Button>
          )}
        </div>
      )}
    </div>
  );
}