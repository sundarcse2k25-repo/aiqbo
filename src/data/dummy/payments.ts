import type { Payment } from '@/types/accounting.types'

/** Payments against invoices and bills */
export const DUMMY_PAYMENTS: Payment[] = [
  // Invoice payments (received from customers)
  { id: 'PAY-001', type: 'invoice', referenceId: 'INV-001', date: '2026-01-28', amount: 200000, method: 'bank_transfer' },
  { id: 'PAY-002', type: 'invoice', referenceId: 'INV-002', date: '2026-02-10', amount: 280000, method: 'bank_transfer' },
  { id: 'PAY-003', type: 'invoice', referenceId: 'INV-003', date: '2026-02-18', amount: 200000, method: 'cheque' },
  { id: 'PAY-004', type: 'invoice', referenceId: 'INV-004', date: '2026-02-28', amount: 420000, method: 'bank_transfer' },
  { id: 'PAY-005', type: 'invoice', referenceId: 'INV-005', date: '2026-03-15', amount: 300000, method: 'credit_card' },
  { id: 'PAY-006', type: 'invoice', referenceId: 'INV-006', date: '2026-03-28', amount: 180000, method: 'bank_transfer' },
  { id: 'PAY-007', type: 'invoice', referenceId: 'INV-007', date: '2026-04-12', amount: 350000, method: 'bank_transfer' },
  { id: 'PAY-008', type: 'invoice', referenceId: 'INV-008', date: '2026-05-05', amount: 250000, method: 'cheque' },
  { id: 'PAY-009', type: 'invoice', referenceId: 'INV-009', date: '2026-05-20', amount: 144000, method: 'bank_transfer' },
  { id: 'PAY-010', type: 'invoice', referenceId: 'INV-010', date: '2026-06-03', amount: 342000, method: 'credit_card' },
  { id: 'PAY-011', type: 'invoice', referenceId: 'INV-012', date: '2026-07-08', amount: 220000, method: 'bank_transfer' },
  { id: 'PAY-012', type: 'invoice', referenceId: 'INV-013', date: '2026-08-05', amount: 210000, method: 'bank_transfer' },

  // Bill payments (sent to vendors)
  { id: 'PAY-101', type: 'bill', referenceId: 'BILL-001', date: '2026-02-01', amount: 85000, method: 'bank_transfer' },
  { id: 'PAY-102', type: 'bill', referenceId: 'BILL-002', date: '2026-01-28', amount: 120000, method: 'cheque' },
  { id: 'PAY-103', type: 'bill', referenceId: 'BILL-003', date: '2026-01-29', amount: 18500, method: 'credit_card' },
  { id: 'PAY-104', type: 'bill', referenceId: 'BILL-004', date: '2026-03-01', amount: 92000, method: 'bank_transfer' },
  { id: 'PAY-105', type: 'bill', referenceId: 'BILL-005', date: '2026-02-26', amount: 120000, method: 'cheque' },
  { id: 'PAY-106', type: 'bill', referenceId: 'BILL-006', date: '2026-04-03', amount: 45000, method: 'bank_transfer' },
  { id: 'PAY-107', type: 'bill', referenceId: 'BILL-007', date: '2026-04-08', amount: 32000, method: 'bank_transfer' },
  { id: 'PAY-108', type: 'bill', referenceId: 'BILL-008', date: '2026-05-01', amount: 110000, method: 'bank_transfer' },
  { id: 'PAY-109', type: 'bill', referenceId: 'BILL-009', date: '2026-05-13', amount: 15000, method: 'credit_card' },
  { id: 'PAY-110', type: 'bill', referenceId: 'BILL-010', date: '2026-06-01', amount: 125000, method: 'bank_transfer' },
  { id: 'PAY-111', type: 'bill', referenceId: 'BILL-011', date: '2026-06-28', amount: 120000, method: 'cheque' },
]
