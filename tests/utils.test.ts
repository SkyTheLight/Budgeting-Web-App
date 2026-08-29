import { describe, it, expect } from 'vitest'
import { formatCurrency, monthKey, formatDate, cn, dateOnlyToDate, getMonthBounds, nextDueDate } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats number as Philippine Peso', () => {
    expect(formatCurrency(1000)).toContain('₱')
    expect(formatCurrency(1000)).toContain('1,000.00')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toContain('0')
  })

  it('handles decimal values', () => {
    expect(formatCurrency(99.99)).toContain('99.99')
  })
})

describe('monthKey', () => {
  it('returns correct month key format', () => {
    const date = new Date(Date.UTC(2024, 0, 15)) // January 2024
    expect(monthKey(date)).toBe('2024-01')
  })

  it('pads month with zero', () => {
    const date = new Date(Date.UTC(2024, 8, 1)) // September 2024
    expect(monthKey(date)).toBe('2024-09')
  })
})

describe('formatDate', () => {
  it('formats date string correctly', () => {
    const result = formatDate('2024-01-15')
    expect(result).toContain('01')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('handles Date object', () => {
    const result = formatDate(new Date('2024-01-15'))
    expect(result).toContain('01')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    const result = cn('foo', false && 'bar', 'baz')
    expect(result).toBe('foo baz')
  })
})

describe('dateOnlyToDate', () => {
  it('parses a date-only string into the exact calendar day (UTC-exact)', () => {
    const result = dateOnlyToDate('2024-02-29')
    expect(result.getUTCFullYear()).toBe(2024)
    expect(result.getUTCMonth()).toBe(1)
    expect(result.getUTCDate()).toBe(29)
  })

  it('is independent of the machine timezone', () => {
    // The stored instant must always encode the same calendar date, so
    // month bucketing can never shift regardless of where the server runs.
    const formed = dateOnlyToDate('2024-01-01')
    expect(formed.toISOString()).toBe('2024-01-01T00:00:00.000Z')
  })

  it('round-trips through dateToDateOnly-style strings', () => {
    expect(monthKey(dateOnlyToDate('2024-02-01'))).toBe('2024-02')
  })
})

describe('getMonthBounds', () => {
  it('produces an exclusive end that starts the next month', () => {
    const { start, end } = getMonthBounds(dateOnlyToDate('2024-01-15'))
    expect(start.toISOString()).toBe('2024-01-01T00:00:00.000Z')
    expect(end.toISOString()).toBe('2024-02-01T00:00:00.000Z')
  })

  it('handles year boundaries', () => {
    const { start, end } = getMonthBounds(dateOnlyToDate('2023-12-31'))
    expect(start.toISOString()).toBe('2023-12-01T00:00:00.000Z')
    expect(end.toISOString()).toBe('2024-01-01T00:00:00.000Z')
  })
})

describe('nextDueDate', () => {
  const from = dateOnlyToDate('2024-02-15')

  it('returns later this month when the day is still ahead', () => {
    expect(nextDueDate(20, from).toISOString()).toBe('2024-02-20T00:00:00.000Z')
  })

  it('rolls to the next month once the day has passed', () => {
    expect(nextDueDate(10, from).toISOString()).toBe('2024-03-10T00:00:00.000Z')
  })

  it('clamps to the last day of short months', () => {
    expect(nextDueDate(31, dateOnlyToDate('2024-01-15')).toISOString()).toBe('2024-01-31T00:00:00.000Z')
    // February 2024 has 29 days -> 31 clamps to 29
    expect(nextDueDate(31, dateOnlyToDate('2024-02-15')).toISOString()).toBe('2024-02-29T00:00:00.000Z')
  })

  it('wraps across year boundaries', () => {
    expect(nextDueDate(5, dateOnlyToDate('2024-12-20')).toISOString()).toBe('2025-01-05T00:00:00.000Z')
  })
})
