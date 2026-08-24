import { describe, it, expect } from 'vitest'
import { generateProfitAndLoss } from '../profitAndLoss.service'
import type { Transaction } from '@/types/accounting.types'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** A minimal set of transactions for controlled testing */
const baseTransactions: Transaction[] = [
  // Revenue
  {
    id: 'T-REV-001',
    date: '2026-01-10',
    accountId: 'ACC-REV-001',
    accountType: 'revenue',
    description: 'Sales revenue Jan',
    amount: 500000,
    type: 'credit',
  },
  {
    id: 'T-REV-002',
    date: '2026-02-15',
    accountId: 'ACC-REV-002',
    accountType: 'revenue',
    description: 'Service revenue Feb',
    amount: 300000,
    type: 'credit',
  },

  // COGS
  {
    id: 'T-COGS-001',
    date: '2026-01-12',
    accountId: 'ACC-COGS-001',
    accountType: 'cogs',
    description: 'AWS infra Jan',
    amount: 150000,
    type: 'debit',
  },
  {
    id: 'T-COGS-002',
    date: '2026-02-12',
    accountId: 'ACC-COGS-001',
    accountType: 'cogs',
    description: 'AWS infra Feb',
    amount: 100000,
    type: 'debit',
  },

  // Expenses
  {
    id: 'T-EXP-001',
    date: '2026-01-01',
    accountId: 'ACC-EXP-001',
    accountType: 'expense',
    description: 'Rent Jan',
    amount: 120000,
    type: 'debit',
  },
  {
    id: 'T-EXP-002',
    date: '2026-02-01',
    accountId: 'ACC-EXP-002',
    accountType: 'expense',
    description: 'Salary Feb',
    amount: 80000,
    type: 'debit',
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateProfitAndLoss', () => {
  describe('1. Revenue calculation', () => {
    it('sums all revenue credit transactions in range', () => {
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-01-01',
        '2026-12-31',
        'Full Year 2026',
      )
      // 500,000 + 300,000 = 800,000
      expect(report.totalRevenue).toBe(800000)
    })

    it('returns revenue line items per account', () => {
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-01-01',
        '2026-12-31',
        'Full Year 2026',
      )
      expect(report.revenueLines).toHaveLength(2)
    })

    it('does NOT include debit revenue transactions in revenue', () => {
      const txns: Transaction[] = [
        {
          id: 'T-REV-DEBIT',
          date: '2026-01-05',
          accountId: 'ACC-REV-001',
          accountType: 'revenue',
          description: 'Revenue reversal',
          amount: 50000,
          type: 'debit', // should be excluded from revenue
        },
        ...baseTransactions,
      ]
      const report = generateProfitAndLoss(txns, '2026-01-01', '2026-12-31', 'Test')
      // Still 800,000 (debit revenue not counted)
      expect(report.totalRevenue).toBe(800000)
    })
  })

  describe('2. COGS calculation', () => {
    it('sums all COGS debit transactions in range', () => {
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-01-01',
        '2026-12-31',
        'Full Year 2026',
      )
      // 150,000 + 100,000 = 250,000
      expect(report.totalCogs).toBe(250000)
    })

    it('returns COGS line items per account', () => {
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-01-01',
        '2026-12-31',
        'Full Year 2026',
      )
      // Both COGS txns are on the same account → aggregated into 1 line
      expect(report.cogsLines).toHaveLength(1)
      expect(report.cogsLines[0].amount).toBe(250000)
    })
  })

  describe('3. Gross profit calculation', () => {
    it('calculates gross profit as revenue minus COGS', () => {
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-01-01',
        '2026-12-31',
        'Full Year 2026',
      )
      // 800,000 − 250,000 = 550,000
      expect(report.grossProfit).toBe(report.totalRevenue - report.totalCogs)
      expect(report.grossProfit).toBe(550000)
    })

    it('is negative when COGS exceeds revenue', () => {
      const highCogsTxns: Transaction[] = [
        {
          id: 'T-REV-SMALL',
          date: '2026-01-10',
          accountId: 'ACC-REV-001',
          accountType: 'revenue',
          description: 'Small revenue',
          amount: 10000,
          type: 'credit',
        },
        {
          id: 'T-COGS-LARGE',
          date: '2026-01-12',
          accountId: 'ACC-COGS-001',
          accountType: 'cogs',
          description: 'Large COGS',
          amount: 50000,
          type: 'debit',
        },
      ]
      const report = generateProfitAndLoss(highCogsTxns, '2026-01-01', '2026-12-31', 'Test')
      expect(report.grossProfit).toBe(-40000)
    })
  })

  describe('4. Expense calculation', () => {
    it('sums all operating expense debit transactions in range', () => {
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-01-01',
        '2026-12-31',
        'Full Year 2026',
      )
      // 120,000 + 80,000 = 200,000
      expect(report.totalExpenses).toBe(200000)
    })

    it('returns expense line items per account', () => {
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-01-01',
        '2026-12-31',
        'Full Year 2026',
      )
      expect(report.expenseLines).toHaveLength(2)
    })
  })

  describe('5. Net profit calculation', () => {
    it('calculates net profit as gross profit minus total expenses', () => {
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-01-01',
        '2026-12-31',
        'Full Year 2026',
      )
      // 550,000 − 200,000 = 350,000
      expect(report.netProfit).toBe(report.grossProfit - report.totalExpenses)
      expect(report.netProfit).toBe(350000)
    })

    it('is negative when expenses exceed gross profit', () => {
      const heavyExpenseTxns: Transaction[] = [
        {
          id: 'T-REV',
          date: '2026-01-10',
          accountId: 'ACC-REV-001',
          accountType: 'revenue',
          description: 'Revenue',
          amount: 100000,
          type: 'credit',
        },
        {
          id: 'T-EXP',
          date: '2026-01-15',
          accountId: 'ACC-EXP-001',
          accountType: 'expense',
          description: 'Heavy expense',
          amount: 200000,
          type: 'debit',
        },
      ]
      const report = generateProfitAndLoss(heavyExpenseTxns, '2026-01-01', '2026-12-31', 'Test')
      expect(report.netProfit).toBe(-100000)
    })
  })

  describe('6. Date filtering', () => {
    it('only includes transactions within the specified date range', () => {
      // Jan only — should exclude the Feb transactions
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-01-01',
        '2026-01-31',
        'January 2026',
      )
      // Jan revenue only: 500,000
      expect(report.totalRevenue).toBe(500000)
      // Jan COGS only: 150,000
      expect(report.totalCogs).toBe(150000)
      // Jan expenses only: 120,000 (rent)
      expect(report.totalExpenses).toBe(120000)
    })

    it('includes transactions on the fromDate boundary', () => {
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-01-01', // exact boundary
        '2026-01-01',
        'Jan 1 only',
      )
      // Only the rent expense is on 2026-01-01
      expect(report.totalExpenses).toBe(120000)
    })

    it('includes transactions on the toDate boundary', () => {
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-02-15',
        '2026-02-15', // exact boundary
        'Feb 15 only',
      )
      // Only the service revenue on 2026-02-15
      expect(report.totalRevenue).toBe(300000)
    })

    it('excludes transactions strictly outside the range', () => {
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-03-01',
        '2026-03-31',
        'March 2026',
      )
      // No transactions in March → all zeros
      expect(report.totalRevenue).toBe(0)
      expect(report.totalCogs).toBe(0)
      expect(report.totalExpenses).toBe(0)
    })
  })

  describe('7. Empty transaction data', () => {
    it('returns all zeros when no transactions are provided', () => {
      const report = generateProfitAndLoss([], '2026-01-01', '2026-12-31', 'Empty')
      expect(report.totalRevenue).toBe(0)
      expect(report.totalCogs).toBe(0)
      expect(report.grossProfit).toBe(0)
      expect(report.totalExpenses).toBe(0)
      expect(report.netProfit).toBe(0)
    })

    it('returns empty line item arrays when no transactions', () => {
      const report = generateProfitAndLoss([], '2026-01-01', '2026-12-31', 'Empty')
      expect(report.revenueLines).toHaveLength(0)
      expect(report.cogsLines).toHaveLength(0)
      expect(report.expenseLines).toHaveLength(0)
    })
  })

  describe('8. Multiple transactions on the same date', () => {
    it('sums multiple revenue transactions on the same date', () => {
      const sameDayTxns: Transaction[] = [
        {
          id: 'T-SAME-1',
          date: '2026-06-15',
          accountId: 'ACC-REV-001',
          accountType: 'revenue',
          description: 'Sale A',
          amount: 100000,
          type: 'credit',
        },
        {
          id: 'T-SAME-2',
          date: '2026-06-15',
          accountId: 'ACC-REV-001',
          accountType: 'revenue',
          description: 'Sale B',
          amount: 200000,
          type: 'credit',
        },
        {
          id: 'T-SAME-3',
          date: '2026-06-15',
          accountId: 'ACC-REV-001',
          accountType: 'revenue',
          description: 'Sale C',
          amount: 50000,
          type: 'credit',
        },
      ]
      const report = generateProfitAndLoss(sameDayTxns, '2026-06-01', '2026-06-30', 'June 2026')
      expect(report.totalRevenue).toBe(350000)
      // All on same account → 1 line item
      expect(report.revenueLines).toHaveLength(1)
      expect(report.revenueLines[0].amount).toBe(350000)
    })

    it('sums multiple expense transactions on the same date', () => {
      const sameDayExpenses: Transaction[] = [
        {
          id: 'T-EXP-SAME-1',
          date: '2026-06-01',
          accountId: 'ACC-EXP-001',
          accountType: 'expense',
          description: 'Expense A',
          amount: 30000,
          type: 'debit',
        },
        {
          id: 'T-EXP-SAME-2',
          date: '2026-06-01',
          accountId: 'ACC-EXP-002',
          accountType: 'expense',
          description: 'Expense B',
          amount: 45000,
          type: 'debit',
        },
      ]
      const report = generateProfitAndLoss(sameDayExpenses, '2026-06-01', '2026-06-30', 'June 2026')
      expect(report.totalExpenses).toBe(75000)
      // Two different accounts → 2 line items
      expect(report.expenseLines).toHaveLength(2)
    })
  })

  describe('Metadata', () => {
    it('preserves fromDate, toDate, and periodLabel in the result', () => {
      const report = generateProfitAndLoss(
        baseTransactions,
        '2026-01-01',
        '2026-01-31',
        'January 2026',
      )
      expect(report.fromDate).toBe('2026-01-01')
      expect(report.toDate).toBe('2026-01-31')
      expect(report.periodLabel).toBe('January 2026')
    })
  })
})
