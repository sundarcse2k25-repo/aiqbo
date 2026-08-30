import { describe, it, expect } from 'vitest'
import { generateGeneralLedger } from '../generalLedger.service'
import type { Account, JournalEntry } from '@/types/accounting.types'

const testAccounts: Account[] = [
  { id: 'ACC-REV-001', name: 'Sales Revenue', type: 'revenue' },
  { id: 'ACC-EXP-001', name: 'Rent Expense', type: 'expense' },
  { id: 'ACC-COGS-001', name: 'Cloud Infra', type: 'cogs' },
  { id: 'ACC-AST-002', name: 'Bank', type: 'asset' },
]

/** A simple balanced two-line journal entry: one P&L-side line + one Bank contra line. */
function je(id: string, date: string, plAccountId: string, plType: 'revenue' | 'expense' | 'cogs', amount: number): JournalEntry {
  const isRevenue = plType === 'revenue'
  return {
    id,
    date,
    description: id,
    sourceType: 'journal',
    sourceId: id,
    lines: isRevenue
      ? [
          { id: `${id}-BANK`, accountId: 'ACC-AST-002', accountType: 'asset', debit: amount, credit: 0, description: 'Bank' },
          { id: `${id}-PL`, accountId: plAccountId, accountType: plType, debit: 0, credit: amount, description: id },
        ]
      : [
          { id: `${id}-PL`, accountId: plAccountId, accountType: plType, debit: amount, credit: 0, description: id },
          { id: `${id}-BANK`, accountId: 'ACC-AST-002', accountType: 'asset', debit: 0, credit: amount, description: 'Bank' },
        ],
  }
}

const testEntries: JournalEntry[] = [
  // Opening entry (before 2026-02-01)
  je('JE-OLD-1', '2026-01-15', 'ACC-EXP-001', 'expense', 1000),
  // Period entries (Feb 2026)
  je('JE-FEB-1', '2026-02-05', 'ACC-REV-001', 'revenue', 5000),
  je('JE-FEB-2', '2026-02-10', 'ACC-EXP-001', 'expense', 1200),
  je('JE-FEB-3', '2026-02-20', 'ACC-REV-001', 'revenue', 3000),
]

describe('GeneralLedgerService', () => {
  it('groups journal entry lines by account and computes running balance', () => {
    const report = generateGeneralLedger(
      testEntries,
      testAccounts,
      '2026-02-01',
      '2026-02-28',
      'Feb 2026',
    )

    expect(report.reportType).toBe('GENERAL_LEDGER')

    const revGroup = report.accounts.find((a) => a.accountId === 'ACC-REV-001')
    expect(revGroup).toBeDefined()
    expect(revGroup?.totalCredits).toBe(8000) // 5000 + 3000
    expect(revGroup?.closingBalance).toBe(8000)
    expect(revGroup?.transactions.length).toBe(2)

    const expGroup = report.accounts.find((a) => a.accountId === 'ACC-EXP-001')
    expect(expGroup).toBeDefined()
    expect(expGroup?.openingBalance).toBe(1000) // from Jan
    expect(expGroup?.totalDebits).toBe(1200)
    expect(expGroup?.closingBalance).toBe(2200) // 1000 + 1200

    // The Bank contra account is included too — this is the double-entry
    // activity the old single-sided Transaction model never carried.
    const bankGroup = report.accounts.find((a) => a.accountId === 'ACC-AST-002')
    expect(bankGroup).toBeDefined()
  })

  it('handles empty journal entry data gracefully', () => {
    const report = generateGeneralLedger([], testAccounts, '2026-01-01', '2026-12-31')
    expect(report.accounts.length).toBe(0)
    expect(report.totalDebits).toBe(0)
    expect(report.totalCredits).toBe(0)
  })

  it('throws if a journal entry does not balance', () => {
    const unbalanced: JournalEntry = {
      id: 'JE-BAD',
      date: '2026-02-01',
      description: 'Unbalanced',
      sourceType: 'journal',
      sourceId: 'JE-BAD',
      lines: [
        { id: 'L1', accountId: 'ACC-REV-001', accountType: 'revenue', debit: 0, credit: 100, description: 'Revenue' },
        { id: 'L2', accountId: 'ACC-AST-002', accountType: 'asset', debit: 90, credit: 0, description: 'Bank' },
      ],
    }
    expect(() => generateGeneralLedger([unbalanced], testAccounts, '2026-01-01', '2026-12-31')).toThrow()
  })
})
