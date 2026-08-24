import { describe, it, expect } from 'vitest'
import { generateBalanceSheet } from '../balanceSheet.service'
import type { Transaction, Invoice, Bill } from '@/types/accounting.types'

describe('BalanceSheetService', () => {
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

  const transactions: Transaction[] = [
    { id: 'T-1', date: '2026-01-10', accountId: 'ACC-REV-001', accountType: 'revenue', description: 'Inv 1', amount: 100000, type: 'credit' },
    { id: 'T-2', date: '2026-01-20', accountId: 'ACC-REV-001', accountType: 'revenue', description: 'Inv 2', amount: 50000, type: 'credit' },
    { id: 'T-3', date: '2026-01-05', accountId: 'ACC-EXP-001', accountType: 'expense', description: 'Bill 1', amount: 20000, type: 'debit' },
    { id: 'T-4', date: '2026-01-15', accountId: 'ACC-EXP-001', accountType: 'expense', description: 'Bill 2', amount: 10000, type: 'debit' },
  ]

  it('calculates balanced balance sheet (Assets = Liabilities + Equity)', () => {
    const report = generateBalanceSheet(transactions, invoices, bills, '2026-01-31')

    expect(report.reportType).toBe('BALANCE_SHEET')
    // AR = 50,000 (INV-2)
    const arItem = report.currentAssets.items.find((i) => i.accountId === 'ACC-AST-003')
    expect(arItem?.amount).toBe(50000)

    // AP = 10,000 (BILL-2)
    const apItem = report.currentLiabilities.items.find((i) => i.accountId === 'ACC-LIA-001')
    expect(apItem?.amount).toBe(10000)

    // Net Profit = (100k + 50k) - (20k + 10k) = 120k -> Retained Earnings
    expect(report.retainedEarnings).toBe(120000)

    // Total Assets = (Paid Rev 100k - Paid Bill 20k) + AR 50k = 80k + 50k = 130k
    expect(report.totalAssets).toBe(130000)

    // Total Liab & Equity = AP 10k + Equity 120k = 130k
    expect(report.totalLiabilitiesAndEquity).toBe(130000)
    expect(report.isBalanced).toBe(true)
  })
})
