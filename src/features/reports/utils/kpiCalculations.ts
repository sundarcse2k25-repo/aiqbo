import type { KPIValue, TrendDirection, KPIDirection, KPIStatus, KPIAvailability } from '../types/monthlyPerformance.types'

/**
 * Pure math/date helpers for the Monthly Performance Report.
 *
 * These are generic KPI-arithmetic helpers, not accounting rules — they
 * have no knowledge of JournalEntry, Invoice, or any domain type. Every
 * function here that could divide by zero or operate on missing data
 * returns the KPIValue sentinel 'N/A' instead of NaN/Infinity, per the
 * "do not fabricate values" rule for this report.
 */

/** Pads a 1-based month or day number to two digits. */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Number of calendar days in the given 1-based month of the given year. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export interface MonthRange {
  year: number
  month: number
  fromDate: string
  toDate: string
  daysInMonth: number
  label: string
}

/** Builds the [first day, last day] ISO date range for a given year/month. */
export function getMonthRange(year: number, month: number): MonthRange {
  const days = daysInMonth(year, month)
  const fromDate = `${year}-${pad2(month)}-01`
  const toDate = `${year}-${pad2(month)}-${pad2(days)}`
  const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return { year, month, fromDate, toDate, daysInMonth: days, label }
}

/** The previous calendar month, correctly rolling January back to December of the prior year. */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

/** Divides two numbers, returning 'N/A' instead of NaN/Infinity when the denominator is 0. */
export function safeDivide(numerator: number, denominator: number): KPIValue {
  if (denominator === 0) return 'N/A'
  return numerator / denominator
}

/** (a + b) / 2, used for average-balance KPIs (Average Total Assets, Average Equity, etc). */
export function average(a: number, b: number): number {
  return (a + b) / 2
}

/**
 * Percentage growth between two periods:
 *   (current - previous) / abs(previous) × 100
 * Returns 'N/A' when previous is 0, per the explicit "handle previous = 0
 * without division-by-zero, return N/A" requirement — growth from a zero
 * base is mathematically undefined, not "infinite" or "0%".
 */
export function percentGrowth(current: number, previous: number): KPIValue {
  if (previous === 0) return 'N/A'
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * Determines whether a KPI moved favorably between two periods, taking the
 * KPI's direction into account (a rising AR Days is a NEGATIVE trend, not
 * positive, even though the number went up).
 */
export function determineTrend(
  current: KPIValue,
  previous: KPIValue,
  direction: KPIDirection,
): TrendDirection {
  if (current === 'N/A' || previous === 'N/A') return 'unavailable'
  if (direction === 'neutral') return 'neutral'
  if (current === previous) return 'flat'

  const improved = direction === 'higher_is_better' ? current > previous : current < previous
  return improved ? 'positive' : 'negative'
}

/**
 * Derives a KPI's business-facing status from its trend. 'flat' collapses
 * to 'neutral' — a KPI that hasn't moved is neither good nor bad news.
 * No independent, value-based threshold system exists (see KPIImportance's
 * doc comment) — status is purely a relabeling of trend today.
 */
export function trendToStatus(trend: TrendDirection): KPIStatus {
  if (trend === 'unavailable') return 'unavailable'
  if (trend === 'flat') return 'neutral'
  return trend
}

export function trendToAvailability(current: KPIValue, previous: KPIValue): KPIAvailability {
  return current === 'N/A' || previous === 'N/A' ? 'unavailable' : 'available'
}

/** currentValue − previousValue, or 'N/A' if either side is 'N/A'. */
export function computeChange(current: KPIValue, previous: KPIValue): KPIValue {
  if (current === 'N/A' || previous === 'N/A') return 'N/A'
  return current - previous
}

/** Percentage change between two KPIValues, reusing percentGrowth's zero-previous handling. */
export function computeChangePercentage(current: KPIValue, previous: KPIValue): KPIValue {
  if (current === 'N/A' || previous === 'N/A') return 'N/A'
  return percentGrowth(current, previous)
}
