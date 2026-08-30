import { describe, it, expect } from 'vitest'
import { generateProfitAndLoss } from '../profitAndLoss.service'
import type { Account, JournalEntry } from '@/types/accounting.types'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------
//
// Each helper builds a balanced JournalEntry (a P&L-side line plus a contra
// AR/AP/Bank line), matching what invoicesToJournalEntries/billsToJournalEntries
// actually generate. The pure P&L calculation only reads the P&L-side line
// (revenue-credit / cogs-debit / expense-debit); contra lines are ignored,
// exactly like non-P&L transactions were ignored under the old model.

function invoiceEntry(id: string, date: string, accountId: string, amount: number): JournalEntry {
  return {
    id,
    date,
    description: id,
    sourceType: 'invoice',
    sourceId: id,
    lines: [
      { id: `${id}-AR`, accountId: 'ACC-AST-003', accountType: 'asset', debit: amount, credit: 0, description: 'AR' },
      { id: `${id}-REV`, accountId, accountType: 'revenue', debit: 0, credit: amount, description: id },
    ],
  }
}

function billEntry(id: string, date: string, accountId: string, accountType: 'cogs' | 'expense', amount: number): JournalEntry {
  return {
    id,
    date,
    description: id,
    sourceType: 'bill',
    sourceId: id,
    lines: [
      { id: `${id}-DR`, accountId, accountType, debit: amount, credit: 0, description: id },
      { id: `${id}-AP`, accountId: 'ACC-LIA-001', accountType: 'liability', debit: 0, credit: amount, description: 'AP' },
    ],
  }
}

/** A revenue-account line on the DEBIT side (e.g. a reversal) — should be excluded from revenue. */
function revenueDebitEntry(id: string, date: string, accountId: string, amount: number): JournalEntry {
  return {
    id,
    date,
    description: id,
    sourceType: 'journal',
    sourceId: id,
    lines: [
      { id: `${id}-REV-DR`, accountId, accountType: 'revenue', debit: amount, credit: 0, description: id },
      { id: `${id}-BANK`, accountId: 'ACC-AST-002', accountType: 'asset', debit: 0, credit: amount, description: 'Bank' },
    ],
  }
}

/** A minimal set of journal entries for controlled testing */
const baseEntries: JournalEntry[] = [
  invoiceEntry('JE-REV-001', '2026-01-10', 'ACC-REV-001', 500000),
  invoiceEntry('JE-REV-002', '2026-02-15', 'ACC-REV-002', 300000),
  billEntry('JE-COGS-001', '2026-01-12', 'ACC-COGS-001', 'cogs', 150000),
  billEntry('JE-COGS-002', '2026-02-12', 'ACC-COGS-001', 'cogs', 100000),
  billEntry('JE-EXP-001', '2026-01-01', 'ACC-EXP-001', 'expense', 120000),
  billEntry('JE-EXP-002', '2026-02-01', 'ACC-EXP-002', 'expense', 80000),
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateProfitAndLoss (JournalEntry-based)', () => {
  describe('1. Revenue calculation', () => {
    it('sums all revenue credit lines in range', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-12-31', 'Full Year 2026')
      // 500,000 + 300,000 = 800,000
      expect(report.totalRevenue).toBe(800000)
    })

    it('returns revenue line items per account', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-12-31', 'Full Year 2026')
      expect(report.revenueLines).toHaveLength(2)
    })

    it('does NOT include debit-side revenue lines in revenue', () => {
      const entries: JournalEntry[] = [
        revenueDebitEntry('JE-REV-REVERSAL', '2026-01-05', 'ACC-REV-001', 50000),
        ...baseEntries,
      ]
      const report = generateProfitAndLoss(entries, '2026-01-01', '2026-12-31', 'Test')
      // Still 800,000 (debit-side revenue not counted)
      expect(report.totalRevenue).toBe(800000)
    })

    it('handles debit/credit direction correctly (a revenue debit line is not netted against credits)', () => {
      // If direction were mishandled, this debit line could reduce revenue
      // instead of being excluded outright.
      const entries: JournalEntry[] = [
        invoiceEntry('JE-REV-ONLY', '2026-03-01', 'ACC-REV-001', 200000),
        revenueDebitEntry('JE-REV-REVERSAL-2', '2026-03-05', 'ACC-REV-001', 200000),
      ]
      const report = generateProfitAndLoss(entries, '2026-03-01', '2026-03-31', 'March 2026')
      expect(report.totalRevenue).toBe(200000)
    })
  })

  describe('2. COGS calculation', () => {
    it('sums all COGS debit lines in range', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-12-31', 'Full Year 2026')
      // 150,000 + 100,000 = 250,000
      expect(report.totalCogs).toBe(250000)
    })

    it('returns COGS line items per account', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-12-31', 'Full Year 2026')
      // Both COGS entries are on the same account → aggregated into 1 line
      expect(report.cogsLines).toHaveLength(1)
      expect(report.cogsLines[0].amount).toBe(250000)
    })
  })

  describe('3. Gross profit calculation', () => {
    it('calculates gross profit as revenue minus COGS', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-12-31', 'Full Year 2026')
      // 800,000 − 250,000 = 550,000
      expect(report.grossProfit).toBe(report.totalRevenue - report.totalCogs)
      expect(report.grossProfit).toBe(550000)
    })

    it('is negative when COGS exceeds revenue', () => {
      const entries: JournalEntry[] = [
        invoiceEntry('JE-REV-SMALL', '2026-01-10', 'ACC-REV-001', 10000),
        billEntry('JE-COGS-LARGE', '2026-01-12', 'ACC-COGS-001', 'cogs', 50000),
      ]
      const report = generateProfitAndLoss(entries, '2026-01-01', '2026-12-31', 'Test')
      expect(report.grossProfit).toBe(-40000)
    })
  })

  describe('4. Expense calculation', () => {
    it('sums all operating expense debit lines in range', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-12-31', 'Full Year 2026')
      // 120,000 + 80,000 = 200,000
      expect(report.totalExpenses).toBe(200000)
    })

    it('returns expense line items per account', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-12-31', 'Full Year 2026')
      expect(report.expenseLines).toHaveLength(2)
    })
  })

  describe('5. Net profit calculation', () => {
    it('calculates net profit as gross profit minus total expenses', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-12-31', 'Full Year 2026')
      // 550,000 − 200,000 = 350,000
      expect(report.netProfit).toBe(report.grossProfit - report.totalExpenses)
      expect(report.netProfit).toBe(350000)
    })

    it('is negative when expenses exceed gross profit', () => {
      const entries: JournalEntry[] = [
        invoiceEntry('JE-REV', '2026-01-10', 'ACC-REV-001', 100000),
        billEntry('JE-EXP', '2026-01-15', 'ACC-EXP-001', 'expense', 200000),
      ]
      const report = generateProfitAndLoss(entries, '2026-01-01', '2026-12-31', 'Test')
      expect(report.netProfit).toBe(-100000)
    })
  })

  describe('6. Date filtering', () => {
    it('only includes entries within the specified date range', () => {
      // Jan only — should exclude the Feb entries
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-01-31', 'January 2026')
      expect(report.totalRevenue).toBe(500000)
      expect(report.totalCogs).toBe(150000)
      expect(report.totalExpenses).toBe(120000)
    })

    it('includes entries on the fromDate boundary', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-01-01', 'Jan 1 only')
      expect(report.totalExpenses).toBe(120000)
    })

    it('includes entries on the toDate boundary', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-02-15', '2026-02-15', 'Feb 15 only')
      expect(report.totalRevenue).toBe(300000)
    })

    it('excludes entries strictly outside the range', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-03-01', '2026-03-31', 'March 2026')
      expect(report.totalRevenue).toBe(0)
      expect(report.totalCogs).toBe(0)
      expect(report.totalExpenses).toBe(0)
    })
  })

  describe('7. Empty journal entry data', () => {
    it('returns all zeros when no journal entries are provided', () => {
      const report = generateProfitAndLoss([], '2026-01-01', '2026-12-31', 'Empty')
      expect(report.totalRevenue).toBe(0)
      expect(report.totalCogs).toBe(0)
      expect(report.grossProfit).toBe(0)
      expect(report.totalExpenses).toBe(0)
      expect(report.netProfit).toBe(0)
    })

    it('returns empty line item arrays when no journal entries', () => {
      const report = generateProfitAndLoss([], '2026-01-01', '2026-12-31', 'Empty')
      expect(report.revenueLines).toHaveLength(0)
      expect(report.cogsLines).toHaveLength(0)
      expect(report.expenseLines).toHaveLength(0)
    })
  })

  describe('8. Multiple entries on the same date', () => {
    it('sums multiple revenue entries on the same date', () => {
      const entries: JournalEntry[] = [
        invoiceEntry('JE-SAME-1', '2026-06-15', 'ACC-REV-001', 100000),
        invoiceEntry('JE-SAME-2', '2026-06-15', 'ACC-REV-001', 200000),
        invoiceEntry('JE-SAME-3', '2026-06-15', 'ACC-REV-001', 50000),
      ]
      const report = generateProfitAndLoss(entries, '2026-06-01', '2026-06-30', 'June 2026')
      expect(report.totalRevenue).toBe(350000)
      // All on same account → 1 line item
      expect(report.revenueLines).toHaveLength(1)
      expect(report.revenueLines[0].amount).toBe(350000)
    })

    it('sums multiple expense entries on the same date', () => {
      const entries: JournalEntry[] = [
        billEntry('JE-EXP-SAME-1', '2026-06-01', 'ACC-EXP-001', 'expense', 30000),
        billEntry('JE-EXP-SAME-2', '2026-06-01', 'ACC-EXP-002', 'expense', 45000),
      ]
      const report = generateProfitAndLoss(entries, '2026-06-01', '2026-06-30', 'June 2026')
      expect(report.totalExpenses).toBe(75000)
      // Two different accounts → 2 line items
      expect(report.expenseLines).toHaveLength(2)
    })
  })

  describe('9. Account name resolution', () => {
    const accounts: Account[] = [
      { id: 'ACC-REV-001', name: 'Sales Revenue', type: 'revenue' },
      { id: 'ACC-COGS-001', name: 'Cost of Goods Sold', type: 'cogs' },
      { id: 'ACC-EXP-001', name: 'Rent Expense', type: 'expense' },
    ]

    it('resolves accountName from the provided chart of accounts', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-12-31', 'Full Year 2026', accounts)
      expect(report.revenueLines.find((l) => l.accountId === 'ACC-REV-001')?.accountName).toBe('Sales Revenue')
      expect(report.cogsLines.find((l) => l.accountId === 'ACC-COGS-001')?.accountName).toBe('Cost of Goods Sold')
      expect(report.expenseLines.find((l) => l.accountId === 'ACC-EXP-001')?.accountName).toBe('Rent Expense')
    })

    it('falls back to accountId when no matching account is found', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-12-31', 'Full Year 2026')
      expect(report.revenueLines.find((l) => l.accountId === 'ACC-REV-001')?.accountName).toBe('ACC-REV-001')
    })
  })

  describe('Metadata', () => {
    it('preserves fromDate, toDate, and periodLabel in the result', () => {
      const report = generateProfitAndLoss(baseEntries, '2026-01-01', '2026-01-31', 'January 2026')
      expect(report.fromDate).toBe('2026-01-01')
      expect(report.toDate).toBe('2026-01-31')
      expect(report.periodLabel).toBe('January 2026')
    })
  })
})

