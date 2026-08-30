import { describe, it, expect } from 'vitest'
import { getAllocatedPaymentTotal, getOutstandingAmount } from '../paymentAllocation'
import type { Payment } from '@/types/accounting.types'
import { DUMMY_INVOICES } from '@/data/dummy/invoices'
import { DUMMY_PAYMENTS } from '@/data/dummy/payments'

describe('paymentAllocation', () => {
  it('supports a single partial payment: Invoice 100000, Payment 40000 -> 60000 outstanding', () => {
    const payments: Payment[] = [
      { id: 'P-1', type: 'invoice', referenceId: 'INV-X', date: '2026-01-10', amount: 40000 },
    ]
    expect(getAllocatedPaymentTotal('INV-X', payments)).toBe(40000)
    expect(getOutstandingAmount(100000, 'INV-X', payments)).toBe(60000)
  })

  it('supports multiple partial payments accumulating: 40000 + 30000 -> 30000 outstanding', () => {
    const payments: Payment[] = [
      { id: 'P-1', type: 'invoice', referenceId: 'INV-X', date: '2026-01-10', amount: 40000 },
      { id: 'P-2', type: 'invoice', referenceId: 'INV-X', date: '2026-01-20', amount: 30000 },
    ]
    expect(getAllocatedPaymentTotal('INV-X', payments)).toBe(70000)
    expect(getOutstandingAmount(100000, 'INV-X', payments)).toBe(30000)
  })

  it('supports a full payment resulting in zero outstanding', () => {
    const payments: Payment[] = [
      { id: 'P-1', type: 'invoice', referenceId: 'INV-X', date: '2026-01-10', amount: 100000 },
    ]
    expect(getOutstandingAmount(100000, 'INV-X', payments)).toBe(0)
  })

  it('ignores payments allocated to other invoices/bills', () => {
    const payments: Payment[] = [
      { id: 'P-1', type: 'invoice', referenceId: 'INV-OTHER', date: '2026-01-10', amount: 999999 },
    ]
    expect(getOutstandingAmount(100000, 'INV-X', payments)).toBe(100000)
  })

  it('returns the full amount outstanding when there are no payments', () => {
    expect(getOutstandingAmount(100000, 'INV-X', [])).toBe(100000)
  })

  it('clamps outstanding at 0 for an over-payment rather than going negative', () => {
    const payments: Payment[] = [
      { id: 'P-1', type: 'invoice', referenceId: 'INV-X', date: '2026-01-10', amount: 120000 },
    ]
    expect(getOutstandingAmount(100000, 'INV-X', payments)).toBe(0)
  })

  it('every real DUMMY_PAYMENTS full payment reconciles invoice total - payment = 0', () => {
    // Real dummy data currently only contains full payments (each Payment
    // amount equals the invoice/bill totalAmount it references). This test
    // proves the invariant holds against the real dataset used by the app.
    const paidInvoices = DUMMY_INVOICES.filter((inv) => inv.status === 'paid')
    expect(paidInvoices.length > 0).toBe(true)

    for (const inv of paidInvoices) {
      const outstanding = getOutstandingAmount(inv.totalAmount, inv.id, DUMMY_PAYMENTS)
      expect(outstanding).toBe(0)
    }
  })
})
