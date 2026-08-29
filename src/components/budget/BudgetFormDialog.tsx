"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { upsertBudget } from '@/actions/budgetActions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { monthKey } from '@/lib/utils';
import { categoryList } from '@/lib/categories';

const budgetFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  month: z.string().min(1, "Month is required"),
  amount: z.coerce.number().positive("Amount must be positive").min(0.01),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export function BudgetFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const now = monthKey(new Date());
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: 'Food',
      month: now,
      amount: 100,
    },
  });

  const watchedCategory = watch('category');

  async function onSubmit(data: BudgetFormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('category', data.category);
    formData.append('month', data.month);
    formData.append('amount', String(data.amount));
    try {
      await upsertBudget(formData);
      toast.success('Budget saved');
      reset();
      setOpen(false);
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save budget');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New budget</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Set Budget</DialogTitle>
          <DialogDescription>
            Create or update monthly budget for a category
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(val) => setValue('category', val)} value={watchedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryList.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value="Custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {watchedCategory === 'Custom' && (
                <Input
                  id="custom-category"
                  {...register('category')}
                  placeholder="Enter custom category"
                  className="mt-2"
                />
              )}
              {errors.category && (
                <p className="text-sm text-destructive px-2">{errors.category.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                max={(() => {
                  const now = new Date();
                  now.setFullYear(now.getFullYear() + 10);
                  return now.toISOString().slice(0, 7);
                })()}
                {...register('month')}
              />
              {errors.month && (
                <p className="text-sm text-destructive px-2">{errors.month.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive px-2">{errors.amount.message}</p>
            )}
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
              {isSubmitting ? 'Saving...' : 'Save Budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
