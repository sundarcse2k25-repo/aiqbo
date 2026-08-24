import { describe, it, expect } from 'vitest'
import { generateReceivablesAging, generatePayablesAging } from '../agingReport.service'
import type { Invoice, Bill, Customer, Vendor } from '@/types/accounting.types'

describe('AgingReportService', () => {
  const customers: Customer[] = [
    { id: 'CUST-1', name: 'Client A' },
    { id: 'CUST-2', name: 'Client B' },
  ]

  const vendors: Vendor[] = [
    { id: 'VEND-1', name: 'Supplier X' },
  ]

  // asOfDate = 2026-06-30
  const invoices: Invoice[] = [
    {
      id: 'INV-1',
      customerId: 'CUST-1',
      date: '2026-06-01',
      dueDate: '2026-07-01', // due in future relative to 2026-06-30 -> Current
      status: 'sent',
      lines: [],
      totalAmount: 10000,
    },
    {
      id: 'INV-2',
      customerId: 'CUST-1',
      date: '2026-05-15',
      dueDate: '2026-06-15', // 15 days past due -> days1_30
      status: 'sent',
      lines: [],
      totalAmount: 20000,
    },
    {
      id: 'INV-3',
      customerId: 'CUST-2',
      date: '2026-04-01',
      dueDate: '2026-05-01', // 60 days past due -> days31_60
      status: 'sent',
      lines: [],
      totalAmount: 30000,
    },
    {
      id: 'INV-4',
      customerId: 'CUST-2',
      date: '2026-01-01',
      dueDate: '2026-02-01', // 149 days past due -> over90
      status: 'sent',
      lines: [],
      totalAmount: 40000,
    },
  ]

  const bills: Bill[] = [
    {
      id: 'BILL-1',
      vendorId: 'VEND-1',
      date: '2026-05-10',
      dueDate: '2026-06-10', // 20 days past due -> days1_30
      status: 'received',
      lines: [],
      totalAmount: 15000,
    },
  ]

  it('correctly categorizes receivables into aging buckets', () => {
    const report = generateReceivablesAging(invoices, customers, '2026-06-30')

    expect(report.reportType).toBe('AR_AGING')
    expect(report.totalOutstanding).toBe(100000)
    expect(report.summary.current).toBe(10000)
    expect(report.summary.days1_30).toBe(20000)
    expect(report.summary.days31_60).toBe(30000)
    expect(report.summary.days61_90).toBe(0)
    expect(report.summary.over90).toBe(40000)

    expect(report.rows.length).toBe(2)
  })

  it('correctly categorizes payables into aging buckets', () => {
    const report = generatePayablesAging(bills, vendors, '2026-06-30')

    expect(report.reportType).toBe('AP_AGING')
    expect(report.totalOutstanding).toBe(15000)
    expect(report.summary.days1_30).toBe(15000)
    expect(report.rows.length).toBe(1)
  })
})
