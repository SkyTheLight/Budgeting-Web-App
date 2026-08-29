"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingDown, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createDebt, deleteDebt, makeDebtPayment } from "@/actions/debtActions";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  currentAmount: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: Date | null;
}

interface DebtTrackerProps {
  debts: Debt[];
}

export function DebtTracker({ debts: initialDebts }: DebtTrackerProps) {
  const router = useRouter();
  const [debts, setDebts] = useState(initialDebts);
  const [open, setOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  async function handleSubmit(formData: FormData) {
    try {
      await createDebt(formData);
      toast.success("Debt added");
      setOpen(false);
      router.refresh();
    } catch (_error) {
      toast.error("Failed to add debt");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this debt?")) return;
    try {
      await deleteDebt(id);
      setDebts(debts.filter(d => d.id !== id));
      toast.success("Debt deleted");
    } catch (_error) {
      toast.error("Failed to delete");
    }
  }

  function openPaymentModal(debt: Debt) {
    setSelectedDebt(debt);
    setPaymentAmount(debt.minimumPayment.toString());
    setPaymentOpen(true);
  }

  async function handlePayment() {
    if (!selectedDebt) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    try {
      const result = await makeDebtPayment(selectedDebt.id, amount);
      if (result.completed) {
        toast.success("Debt paid off! 🎉");
      } else {
        toast.success(`Payment of ${formatCurrency(amount)} recorded`);
      }
      setPaymentOpen(false);
      router.refresh();
    } catch (_error) {
      toast.error("Payment failed");
    }
  }

  const totalDebt = debts.reduce((sum, d) => sum + d.currentAmount, 0);
  const totalOriginal = debts.reduce((sum, d) => sum + d.totalAmount, 0);
  const paidOff = totalOriginal > 0 ? ((totalOriginal - totalDebt) / totalOriginal) * 100 : 0;

  return (
    <Card className="glass animate-fade-in">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Debt Tracker</CardTitle>
          <p className="text-sm text-muted-foreground">
            {totalDebt > 0 ? `Total remaining: ${formatCurrency(totalDebt)}` : "No debts tracked"}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Debt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Debt</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Debt Name</Label>
                <Input id="name" name="name" placeholder="e.g., Credit Card" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Original Amount (₱)</Label>
                <Input id="totalAmount" name="totalAmount" type="number" step="0.01" placeholder="0.00" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentAmount">Current Balance (₱)</Label>
                <Input id="currentAmount" name="currentAmount" type="number" step="0.01" placeholder="0.00" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input id="interestRate" name="interestRate" type="number" step="0.1" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumPayment">Min Payment (₱)</Label>
                  <Input id="minimumPayment" name="minimumPayment" type="number" step="0.01" placeholder="0" />
                </div>
              </div>
              <Button type="submit" className="w-full">Add Debt</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {debts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No debts tracked. Add one to start paying off!</p>
        ) : (
          <>
            <div className="mb-4 p-3 rounded-lg bg-card border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-sm font-medium">{paidOff.toFixed(1)}% paid off</span>
              </div>
              <Progress value={paidOff} variant="success" />
            </div>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {debts.map((debt) => {
                  const progress = ((debt.totalAmount - debt.currentAmount) / debt.totalAmount) * 100;
                  return (
                    <div
                      key={debt.id}
                      className="p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-rose-500" />
                          <span className="font-medium">{debt.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(debt.id)} className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          {formatCurrency(debt.totalAmount - debt.currentAmount)} paid
                        </span>
                        <span className="font-medium">
                          {formatCurrency(debt.currentAmount)} left
                        </span>
                      </div>
                      <Progress value={progress} variant={progress >= 50 ? "success" : "default"} />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          {debt.interestRate > 0 ? `${debt.interestRate}% APR` : "No interest"}
                        </span>
                        <Button size="sm" variant="outline" onClick={() => openPaymentModal(debt)}>
                          <DollarSign className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paying towards: <span className="font-medium text-foreground">{selectedDebt.name}</span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="payment">Payment Amount (₱)</Label>
                <Input
                  id="payment"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPaymentAmount(selectedDebt.minimumPayment.toString())}>
                  Min: {formatCurrency(selectedDebt.minimumPayment)}
                </Button>
                <Button variant="outline" onClick={() => setPaymentAmount(selectedDebt.currentAmount.toString())}>
                  Pay Off: {formatCurrency(selectedDebt.currentAmount)}
                </Button>
              </div>
              <Button onClick={handlePayment} className="w-full">Submit Payment</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}