import { describe, it, expect } from 'vitest'
import {
  transactionSchema,
  budgetSchema,
  savingsGoalSchema,
  debtSchema,
  billReminderSchema,
  assetSchema,
  depositSchema,
  paymentSchema,
} from '@/lib/schemas'

describe('Transaction Validation', () => {
  it('validates valid transaction', () => {
    expect(() =>
      transactionSchema.parse({ type: 'expense', amount: '100.50', category: 'Food' })
    ).not.toThrow()
  })

  it('rejects invalid type', () => {
    expect(() =>
      transactionSchema.parse({ type: 'invalid', amount: '100', category: 'Food' })
    ).toThrow()
  })

  it('rejects negative amount', () => {
    expect(() =>
      transactionSchema.parse({ type: 'expense', amount: '-100', category: 'Food' })
    ).toThrow()
  })

  it('rejects zero amount', () => {
    expect(() =>
      transactionSchema.parse({ type: 'expense', amount: '0', category: 'Food' })
    ).toThrow()
  })

  it('rejects empty category', () => {
    expect(() =>
      transactionSchema.parse({ type: 'expense', amount: '100', category: '' })
    ).toThrow()
  })

  it('rejects whitespace-only category', () => {
    expect(() =>
      transactionSchema.parse({ type: 'expense', amount: '100', category: '   ' })
    ).toThrow()
  })

  it('trims surrounding whitespace from category', () => {
    const parsed = transactionSchema.parse({ type: 'expense', amount: '100', category: '  Food  ' })
    expect(parsed.category).toBe('Food')
  })

  it('treats whitespace-only description as empty string (allowed)', () => {
    const parsed = transactionSchema.parse({
      type: 'expense',
      amount: '100',
      category: 'Food',
      description: '   ',
    })
    expect(parsed.description).toBe('')
  })

  it('rejects category too long', () => {
    expect(() =>
      transactionSchema.parse({ type: 'expense', amount: '100', category: 'a'.repeat(51) })
    ).toThrow()
  })

  it('rejects NaN and Infinity amounts', () => {
    expect(() => transactionSchema.parse({ type: 'expense', amount: 'NaN', category: 'Food' })).toThrow()
    expect(() => transactionSchema.parse({ type: 'expense', amount: 'Infinity', category: 'Food' })).toThrow()
    expect(() => transactionSchema.parse({ type: 'expense', amount: '1e309', category: 'Food' })).toThrow()
  })

  it('rejects unknown extra fields (mass-assignment guard)', () => {
    expect(() =>
      transactionSchema.parse({
        type: 'expense',
        amount: '100',
        category: 'Food',
        isAdmin: true,
        userId: 'attacker',
      })
    ).toThrow()
  })
})

describe('Budget Validation', () => {
  it('validates valid budget', () => {
    expect(() => budgetSchema.parse({ category: 'Food', month: '2024-01', amount: '500' })).not.toThrow()
  })

  it('rejects invalid month format', () => {
    expect(() => budgetSchema.parse({ category: 'Food', month: '01-2024', amount: '500' })).toThrow()
  })

  it('rejects month out of range', () => {
    expect(() => budgetSchema.parse({ category: 'Food', month: '2024-13', amount: '500' })).toThrow()
  })

  it('rejects whitespace-only category', () => {
    expect(() => budgetSchema.parse({ category: '   ', month: '2024-01', amount: '500' })).toThrow()
  })

  it('rejects zero and negative amount', () => {
    expect(() => budgetSchema.parse({ category: 'Food', month: '2024-01', amount: '0' })).toThrow()
    expect(() => budgetSchema.parse({ category: 'Food', month: '2024-01', amount: '-100' })).toThrow()
  })
})

describe('Savings Goal Validation', () => {
  it('validates valid goal', () => {
    expect(() => savingsGoalSchema.parse({ name: 'Emergency Fund', targetAmount: '10000', deadline: '2025-12-31' })).not.toThrow()
  })

  it('rejects whitespace-only name', () => {
    expect(() => savingsGoalSchema.parse({ name: '   ', targetAmount: '10000' })).toThrow()
  })

  it('trims the name', () => {
    const parsed = savingsGoalSchema.parse({ name: '  Trip  ', targetAmount: '10000' })
    expect(parsed.name).toBe('Trip')
  })

  it('rejects non-positive target', () => {
    expect(() => savingsGoalSchema.parse({ name: 'Goal', targetAmount: '0' })).toThrow()
  })
})

describe('Bill Reminder / Debt / Asset / Deposit / Payment', () => {
  it('bill reminder rejects whitespace-only name and category', () => {
    expect(() => billReminderSchema.parse({ name: '  ', amount: '500', dueDay: '15', category: 'Rent' })).toThrow()
    expect(() => billReminderSchema.parse({ name: 'Rent', amount: '500', dueDay: '15', category: '   ' })).toThrow()
  })

  it('bill reminder rejects invalid due day', () => {
    expect(() => billReminderSchema.parse({ name: 'Rent', amount: '500', dueDay: '0', category: 'Rent' })).toThrow()
    expect(() => billReminderSchema.parse({ name: 'Rent', amount: '500', dueDay: '32', category: 'Rent' })).toThrow()
  })

  it('debt rejects whitespace-only name', () => {
    expect(() =>
      debtSchema.parse({
        name: '   ',
        totalAmount: '1000',
        currentAmount: '500',
        interestRate: '0',
        minimumPayment: '100',
      })
    ).toThrow()
  })

  it('asset rejects empty or whitespace-only name and invalid type', () => {
    expect(() => assetSchema.parse({ name: '  ', type: 'cash', value: '100' })).toThrow()
    expect(() => assetSchema.parse({ name: 'Wallet', type: 'crypto', value: '100' })).toThrow()
  })

  it('deposit/payment reject zero, negative and NaN', () => {
    expect(() => depositSchema.parse({ amount: 0 })).toThrow()
    expect(() => paymentSchema.parse({ amount: -1 })).toThrow()
    expect(() => paymentSchema.parse({ amount: NaN })).toThrow()
    expect(() => depositSchema.parse({ amount: 'NaN' })).toThrow()
  })
})