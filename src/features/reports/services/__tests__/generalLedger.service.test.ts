import { describe, it, expect } from 'vitest'
import { generateGeneralLedger } from '../generalLedger.service'
import type { Transaction, Account } from '@/types/accounting.types'

const testAccounts: Account[] = [
  { id: 'ACC-REV-001', name: 'Sales Revenue', type: 'revenue' },
  { id: 'ACC-EXP-001', name: 'Rent Expense', type: 'expense' },
  { id: 'ACC-COGS-001', name: 'Cloud Infra', type: 'cogs' },
]

const testTransactions: Transaction[] = [
  // Opening transaction (before 2026-02-01)
  {
    id: 'T-OLD-1',
    date: '2026-01-15',
    accountId: 'ACC-EXP-001',
    accountType: 'expense',
    description: 'Rent Jan',
    amount: 1000,
    type: 'debit',
  },
  // Period transactions (Feb 2026)
  {
    id: 'T-FEB-1',
    date: '2026-02-05',
    accountId: 'ACC-REV-001',
    accountType: 'revenue',
    description: 'Sale 1',
    amount: 5000,
    type: 'credit',
  },
  {
    id: 'T-FEB-2',
    date: '2026-02-10',
    accountId: 'ACC-EXP-001',
    accountType: 'expense',
    description: 'Rent Feb',
    amount: 1200,
    type: 'debit',
  },
  {
    id: 'T-FEB-3',
    date: '2026-02-20',
    accountId: 'ACC-REV-001',
    accountType: 'revenue',
    description: 'Sale 2',
    amount: 3000,
    type: 'credit',
  },
]

describe('GeneralLedgerService', () => {
  it('groups transactions by account and computes running balance', () => {
    const report = generateGeneralLedger(
      testTransactions,
      testAccounts,
      '2026-02-01',
      '2026-02-28',
      'Feb 2026',
    )

    expect(report.reportType).toBe('GENERAL_LEDGER')
    expect(report.totalCredits).toBe(8000) // 5000 + 3000
    expect(report.totalDebits).toBe(1200)  // 1200

    const revGroup = report.accounts.find((a) => a.accountId === 'ACC-REV-001')
    expect(revGroup).toBeDefined()
    expect(revGroup?.totalCredits).toBe(8000)
    expect(revGroup?.closingBalance).toBe(8000)
    expect(revGroup?.transactions.length).toBe(2)

    const expGroup = report.accounts.find((a) => a.accountId === 'ACC-EXP-001')
    expect(expGroup).toBeDefined()
    expect(expGroup?.openingBalance).toBe(1000) // from Jan
    expect(expGroup?.totalDebits).toBe(1200)
    expect(expGroup?.closingBalance).toBe(2200) // 1000 + 1200
  })

  it('handles empty transactions gracefully', () => {
    const report = generateGeneralLedger([], testAccounts, '2026-01-01', '2026-12-31')
    expect(report.accounts.length).toBe(0)
    expect(report.totalDebits).toBe(0)
    expect(report.totalCredits).toBe(0)
  })
})
