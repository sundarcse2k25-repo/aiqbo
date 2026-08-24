import { describe, it, expect } from 'vitest'
import { generateSalesReport } from '../salesReport.service'
import type { Invoice, Customer } from '@/types/accounting.types'

const testCustomers: Customer[] = [
  { id: 'CUST-1', name: 'Alpha Corp' },
  { id: 'CUST-2', name: 'Beta Ltd' },
]

const testInvoices: Invoice[] = [
  {
    id: 'INV-1',
    customerId: 'CUST-1',
    date: '2026-03-05',
    dueDate: '2026-04-05',
    status: 'paid',
    lines: [
      { id: 'L1', accountId: 'ACC-REV-001', description: 'Licences', quantity: 10, unitPrice: 2000, amount: 20000 },
      { id: 'L2', accountId: 'ACC-REV-002', description: 'Support', quantity: 5, unitPrice: 1000, amount: 5000 },
    ],
    totalAmount: 25000,
  },
  {
    id: 'INV-2',
    customerId: 'CUST-2',
    date: '2026-03-12',
    dueDate: '2026-04-12',
    status: 'sent',
    lines: [
      { id: 'L3', accountId: 'ACC-REV-001', description: 'Licences', quantity: 5, unitPrice: 2000, amount: 10000 },
    ],
    totalAmount: 10000,
  },
]

describe('SalesReportService', () => {
  it('aggregates sales by customer and service line', () => {
    const report = generateSalesReport(testInvoices, testCustomers, '2026-03-01', '2026-03-31', 'March 2026')

    expect(report.reportType).toBe('SALES_REPORT')
    expect(report.totalSales).toBe(35000)
    expect(report.paidSales).toBe(25000)
    expect(report.unpaidSales).toBe(10000)
    expect(report.totalInvoices).toBe(2)
    expect(report.averageInvoiceValue).toBe(17500)

    expect(report.byCustomer.length).toBe(2)
    expect(report.byCustomer[0].customerName).toBe('Alpha Corp')
    expect(report.byCustomer[0].totalAmount).toBe(25000)
    expect(report.byCustomer[0].percentageOfTotal).toBe(71.4)

    expect(report.byItem.length).toBe(2)
    const licenceItem = report.byItem.find((i) => i.description === 'Licences')
    expect(licenceItem?.totalAmount).toBe(30000)
    expect(licenceItem?.quantity).toBe(15)
  })
})
