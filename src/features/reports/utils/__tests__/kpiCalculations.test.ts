import { describe, it, expect } from 'vitest'
import {
  daysInMonth,
  getMonthRange,
  getPreviousMonth,
  safeDivide,
  average,
  percentGrowth,
  determineTrend,
  trendToStatus,
  trendToAvailability,
  computeChange,
  computeChangePercentage,
} from '../kpiCalculations'

describe('daysInMonth / getMonthRange', () => {
  it('computes January correctly', () => {
    const r = getMonthRange(2026, 1)
    expect(r.fromDate).toBe('2026-01-01')
    expect(r.toDate).toBe('2026-01-31')
    expect(r.daysInMonth).toBe(31)
  })

  it('computes February in a non-leap year correctly', () => {
    const r = getMonthRange(2026, 2)
    expect(r.toDate).toBe('2026-02-28')
    expect(r.daysInMonth).toBe(28)
  })

  it('computes February in a leap year correctly', () => {
    expect(daysInMonth(2028, 2)).toBe(29)
  })

  it('computes December correctly', () => {
    const r = getMonthRange(2026, 12)
    expect(r.fromDate).toBe('2026-12-01')
    expect(r.toDate).toBe('2026-12-31')
  })
})

describe('getPreviousMonth', () => {
  it('rolls January back to December of the previous year', () => {
    expect(getPreviousMonth(2026, 1)).toEqual({ year: 2025, month: 12 })
  })

  it('handles a normal mid-year month', () => {
    expect(getPreviousMonth(2026, 6)).toEqual({ year: 2026, month: 5 })
  })

  it('handles December to November of the same year', () => {
    expect(getPreviousMonth(2026, 12)).toEqual({ year: 2026, month: 11 })
  })
})

describe('safeDivide', () => {
  it('divides normally', () => {
    expect(safeDivide(100, 4)).toBe(25)
  })

  it('returns N/A for division by zero instead of Infinity/NaN', () => {
    expect(safeDivide(100, 0)).toBe('N/A')
  })
})

describe('average', () => {
  it('averages two numbers', () => {
    expect(average(100, 200)).toBe(150)
  })
})

describe('percentGrowth', () => {
  it('computes positive growth', () => {
    expect(percentGrowth(150, 100)).toBe(50)
  })

  it('computes negative growth', () => {
    expect(percentGrowth(50, 100)).toBe(-50)
  })

  it('returns N/A when previous is 0, not Infinity', () => {
    expect(percentGrowth(100, 0)).toBe('N/A')
  })

  it('handles a negative previous value using abs() in the denominator', () => {
    expect(percentGrowth(-50, -100)).toBe(50)
  })
})

describe('determineTrend', () => {
  it('is positive when a higher-is-better KPI increases', () => {
    expect(determineTrend(120, 100, 'higher_is_better')).toBe('positive')
  })

  it('is negative when a higher-is-better KPI decreases', () => {
    expect(determineTrend(80, 100, 'higher_is_better')).toBe('negative')
  })

  it('is positive when a lower-is-better KPI decreases (e.g. AR Days improving)', () => {
    expect(determineTrend(20, 30, 'lower_is_better')).toBe('positive')
  })

  it('is negative when a lower-is-better KPI increases', () => {
    expect(determineTrend(40, 30, 'lower_is_better')).toBe('negative')
  })

  it('is flat when values are equal', () => {
    expect(determineTrend(50, 50, 'higher_is_better')).toBe('flat')
  })

  it('is neutral for context-dependent KPIs regardless of movement', () => {
    expect(determineTrend(100, 50, 'neutral')).toBe('neutral')
  })

  it('is unavailable when either value is N/A', () => {
    expect(determineTrend('N/A', 50, 'higher_is_better')).toBe('unavailable')
    expect(determineTrend(50, 'N/A', 'higher_is_better')).toBe('unavailable')
  })
})

describe('trendToStatus', () => {
  it('passes positive/negative/neutral through unchanged', () => {
    expect(trendToStatus('positive')).toBe('positive')
    expect(trendToStatus('negative')).toBe('negative')
    expect(trendToStatus('neutral')).toBe('neutral')
  })

  it('collapses flat to neutral', () => {
    expect(trendToStatus('flat')).toBe('neutral')
  })

  it('passes unavailable through unchanged', () => {
    expect(trendToStatus('unavailable')).toBe('unavailable')
  })
})

describe('trendToAvailability', () => {
  it('is available when both values are numeric', () => {
    expect(trendToAvailability(100, 50)).toBe('available')
  })

  it('is unavailable when either value is N/A', () => {
    expect(trendToAvailability('N/A', 50)).toBe('unavailable')
    expect(trendToAvailability(50, 'N/A')).toBe('unavailable')
  })
})

describe('computeChange', () => {
  it('subtracts previous from current', () => {
    expect(computeChange(120, 100)).toBe(20)
  })

  it('handles negative change', () => {
    expect(computeChange(80, 100)).toBe(-20)
  })

  it('returns N/A when either side is N/A, not NaN', () => {
    expect(computeChange('N/A', 100)).toBe('N/A')
    expect(computeChange(100, 'N/A')).toBe('N/A')
  })
})

describe('computeChangePercentage', () => {
  it('computes percentage change', () => {
    expect(computeChangePercentage(150, 100)).toBe(50)
  })

  it('returns N/A when previous is 0', () => {
    expect(computeChangePercentage(100, 0)).toBe('N/A')
  })

  it('returns N/A when either side is N/A', () => {
    expect(computeChangePercentage('N/A', 100)).toBe('N/A')
    expect(computeChangePercentage(100, 'N/A')).toBe('N/A')
  })
})
