import { describe, it, expect } from 'vitest'
import { generateBalanceSheet, calculateLedgerDerivedBalances } from '../balanceSheet.service'
import { invoicesToJournalEntries, billsToJournalEntries, paymentsToJournalEntries } from '@/data/dummy/journalEntries'
import { resolveControlAccounts } from '../../utils/controlAccounts'
import type { Account, Invoice, Bill, Payment } from '@/types/accounting.types'

describe('BalanceSheetService', () => {
  const accounts: Account[] = [
    { id: 'ACC-REV-001', name: 'Sales Revenue', type: 'revenue' },
    { id: 'ACC-EXP-001', name: 'Rent Expense', type: 'expense' },
    { id: 'ACC-AST-001', name: 'Cash', type: 'asset' },
    { id: 'ACC-AST-002', name: 'Bank', type: 'asset' },
    { id: 'ACC-AST-003', name: 'Accounts Receivable', type: 'asset' },
    { id: 'ACC-LIA-001', name: 'Accounts Payable', type: 'liability' },
    { id: 'ACC-EQU-001', name: 'Retained Earnings', type: 'equity' },
  ]
  const accountMap = new Map(accounts.map((a) => [a.id, a]))
  const controlAccounts = resolveControlAccounts(accounts)

  const invoices: Invoice[] = [
    {
      id: 'INV-1',
      customerId: 'CUST-1',
      date: '2026-01-10',
      dueDate: '2026-02-10',
      status: 'paid',
      lines: [{ id: 'L1', accountId: 'ACC-REV-001', description: 'Consulting', quantity: 1, unitPrice: 100000, amount: 100000 }],
      totalAmount: 100000,
    },
    {
      id: 'INV-2',
      customerId: 'CUST-2',
      date: '2026-01-20',
      dueDate: '2026-02-20',
      status: 'sent', // unpaid -> AR
      lines: [{ id: 'L2', accountId: 'ACC-REV-001', description: 'Support', quantity: 1, unitPrice: 50000, amount: 50000 }],
      totalAmount: 50000,
    },
  ]

  const bills: Bill[] = [
    {
      id: 'BILL-1',
      vendorId: 'VEND-1',
      date: '2026-01-05',
      dueDate: '2026-02-05',
      status: 'paid',
      lines: [{ id: 'BL1', accountId: 'ACC-EXP-001', description: 'Rent', quantity: 1, unitPrice: 20000, amount: 20000 }],
      totalAmount: 20000,
    },
    {
      id: 'BILL-2',
      vendorId: 'VEND-2',
      date: '2026-01-15',
      dueDate: '2026-02-15',
      status: 'received', // unpaid -> AP
      lines: [{ id: 'BL2', accountId: 'ACC-EXP-001', description: 'Electricity', quantity: 1, unitPrice: 10000, amount: 10000 }],
      totalAmount: 10000,
    },
  ]

  const payments: Payment[] = [
    { id: 'PAY-1', type: 'invoice', referenceId: 'INV-1', date: '2026-01-12', amount: 100000, method: 'bank_transfer' },
    { id: 'PAY-2', type: 'bill', referenceId: 'BILL-1', date: '2026-01-06', amount: 20000, method: 'bank_transfer' },
  ]

  const journalEntries = [
    ...invoicesToJournalEntries(invoices, accountMap, controlAccounts),
    ...billsToJournalEntries(bills, accountMap, controlAccounts),
    ...paymentsToJournalEntries(payments, accountMap, controlAccounts),
  ]

  it('calculates balanced balance sheet (Assets = Liabilities + Equity)', () => {
    const report = generateBalanceSheet(journalEntries, accounts, '2026-01-31')

    expect(report.reportType).toBe('BALANCE_SHEET')

    // AR = 50,000 (INV-2, unpaid)
    const arItem = report.currentAssets.items.find((i) => i.accountId === 'ACC-AST-003')
    expect(arItem?.amount).toBe(50000)

    // AP = 10,000 (BILL-2, unpaid)
    const apItem = report.currentLiabilities.items.find((i) => i.accountId === 'ACC-LIA-001')
    expect(apItem?.amount).toBe(10000)

    // Cash = 0 (no cash-method payments), Bank = 100k received - 20k paid = 80,000
    const cashItem = report.currentAssets.items.find((i) => i.accountId === 'ACC-AST-001')
    const bankItem = report.currentAssets.items.find((i) => i.accountId === 'ACC-AST-002')
    expect(cashItem?.amount).toBe(0)
    expect(bankItem?.amount).toBe(80000)

    // Net Profit = (100k + 50k) - (20k + 10k) = 120k -> Retained Earnings
    expect(report.retainedEarnings).toBe(120000)

    // Total Assets = Cash 0 + Bank 80k + AR 50k = 130k
    expect(report.totalAssets).toBe(130000)

    // Total Liab & Equity = AP 10k + Equity 120k = 130k
    expect(report.totalLiabilitiesAndEquity).toBe(130000)
    expect(report.isBalanced).toBe(true)
  })

  it('ledger-derived balances match the balance sheet line items directly', () => {
    const ledger = calculateLedgerDerivedBalances(journalEntries, controlAccounts, '2026-01-31')
    expect(ledger.accountsReceivable).toBe(50000)
    expect(ledger.accountsPayable).toBe(10000)
    expect(ledger.cash).toBe(0)
    expect(ledger.bank).toBe(80000)
  })
})
