import { describe, it, expect } from 'vitest'
import { generateExpenseReport } from '../expenseReport.service'
import type { Bill, Vendor, Account } from '@/types/accounting.types'

const testVendors: Vendor[] = [
  { id: 'VEND-1', name: 'Cloud Provider' },
  { id: 'VEND-2', name: 'Landlord Corp' },
]

const testAccounts: Account[] = [
  { id: 'ACC-COGS-001', name: 'Hosting', type: 'cogs' },
  { id: 'ACC-EXP-001', name: 'Rent', type: 'expense' },
]

const testBills: Bill[] = [
  {
    id: 'B-1',
    vendorId: 'VEND-1',
    date: '2026-04-05',
    dueDate: '2026-05-05',
    status: 'paid',
    lines: [{ id: 'BL-1', accountId: 'ACC-COGS-001', description: 'Servers', quantity: 1, unitPrice: 30000, amount: 30000 }],
    totalAmount: 30000,
  },
  {
    id: 'B-2',
    vendorId: 'VEND-2',
    date: '2026-04-10',
    dueDate: '2026-05-10',
    status: 'received',
    lines: [{ id: 'BL-2', accountId: 'ACC-EXP-001', description: 'Rent Apr', quantity: 1, unitPrice: 50000, amount: 50000 }],
    totalAmount: 50000,
  },
]

describe('ExpenseReportService', () => {
  it('aggregates expenses by vendor, category, and separates COGS vs OPEX', () => {
    const report = generateExpenseReport(testBills, testVendors, testAccounts, '2026-04-01', '2026-04-30', 'Apr 2026')

    expect(report.reportType).toBe('EXPENSE_REPORT')
    expect(report.totalExpenses).toBe(80000)
    expect(report.totalCOGS).toBe(30000)
    expect(report.totalOperatingExpenses).toBe(50000)
    expect(report.paidExpenses).toBe(30000)
    expect(report.unpaidExpenses).toBe(50000)

    expect(report.byVendor.length).toBe(2)
    expect(report.byVendor[0].vendorName).toBe('Landlord Corp')
    expect(report.byVendor[0].totalAmount).toBe(50000)

    expect(report.byCategory.length).toBe(2)
    const rentCategory = report.byCategory.find((c) => c.accountId === 'ACC-EXP-001')
    expect(rentCategory?.totalAmount).toBe(50000)
  })
})
