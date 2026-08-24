import type { Bill } from '@/types/accounting.types'

/**
 * 12 dummy bills spread across Jan–Aug 2026.
 * Vendors: VEND-001 to VEND-006
 * Expense/COGS accounts: ACC-COGS-001, ACC-EXP-001 to ACC-EXP-005
 */
export const DUMMY_BILLS: Bill[] = [
  // ── January 2026 ──────────────────────────────────────────────────────────
  {
    id: 'BILL-001',
    vendorId: 'VEND-001',
    date: '2026-01-03',
    dueDate: '2026-02-03',
    status: 'paid',
    lines: [
      {
        id: 'BILL-001-L1',
        accountId: 'ACC-COGS-001',
        description: 'AWS infrastructure – Jan',
        quantity: 1,
        unitPrice: 85000,
        amount: 85000,
      },
    ],
    totalAmount: 85000,
  },
  {
    id: 'BILL-002',
    vendorId: 'VEND-003',
    date: '2026-01-01',
    dueDate: '2026-01-31',
    status: 'paid',
    lines: [
      {
        id: 'BILL-002-L1',
        accountId: 'ACC-EXP-001',
        description: 'Office rent – Jan 2026',
        quantity: 1,
        unitPrice: 120000,
        amount: 120000,
      },
    ],
    totalAmount: 120000,
  },
  {
    id: 'BILL-003',
    vendorId: 'VEND-006',
    date: '2026-01-15',
    dueDate: '2026-01-31',
    status: 'paid',
    lines: [
      {
        id: 'BILL-003-L1',
        accountId: 'ACC-EXP-003',
        description: 'Electricity – Jan 2026',
        quantity: 1,
        unitPrice: 18500,
        amount: 18500,
      },
    ],
    totalAmount: 18500,
  },

  // ── February 2026 ─────────────────────────────────────────────────────────
  {
    id: 'BILL-004',
    vendorId: 'VEND-001',
    date: '2026-02-03',
    dueDate: '2026-03-03',
    status: 'paid',
    lines: [
      {
        id: 'BILL-004-L1',
        accountId: 'ACC-COGS-001',
        description: 'AWS infrastructure – Feb',
        quantity: 1,
        unitPrice: 92000,
        amount: 92000,
      },
    ],
    totalAmount: 92000,
  },
  {
    id: 'BILL-005',
    vendorId: 'VEND-003',
    date: '2026-02-01',
    dueDate: '2026-02-28',
    status: 'paid',
    lines: [
      {
        id: 'BILL-005-L1',
        accountId: 'ACC-EXP-001',
        description: 'Office rent – Feb 2026',
        quantity: 1,
        unitPrice: 120000,
        amount: 120000,
      },
    ],
    totalAmount: 120000,
  },

  // ── March 2026 ────────────────────────────────────────────────────────────
  {
    id: 'BILL-006',
    vendorId: 'VEND-002',
    date: '2026-03-05',
    dueDate: '2026-04-05',
    status: 'paid',
    lines: [
      {
        id: 'BILL-006-L1',
        accountId: 'ACC-COGS-001',
        description: 'Microsoft Azure – Mar',
        quantity: 1,
        unitPrice: 45000,
        amount: 45000,
      },
    ],
    totalAmount: 45000,
  },
  {
    id: 'BILL-007',
    vendorId: 'VEND-004',
    date: '2026-03-10',
    dueDate: '2026-04-10',
    status: 'paid',
    lines: [
      {
        id: 'BILL-007-L1',
        accountId: 'ACC-EXP-004',
        description: 'Courier & logistics – Q1',
        quantity: 1,
        unitPrice: 32000,
        amount: 32000,
      },
    ],
    totalAmount: 32000,
  },

  // ── April 2026 ────────────────────────────────────────────────────────────
  {
    id: 'BILL-008',
    vendorId: 'VEND-001',
    date: '2026-04-03',
    dueDate: '2026-05-03',
    status: 'paid',
    lines: [
      {
        id: 'BILL-008-L1',
        accountId: 'ACC-COGS-001',
        description: 'AWS infrastructure – Apr',
        quantity: 1,
        unitPrice: 110000,
        amount: 110000,
      },
    ],
    totalAmount: 110000,
  },
  {
    id: 'BILL-009',
    vendorId: 'VEND-005',
    date: '2026-04-15',
    dueDate: '2026-05-15',
    status: 'paid',
    lines: [
      {
        id: 'BILL-009-L1',
        accountId: 'ACC-EXP-005',
        description: 'Office stationery – Apr',
        quantity: 1,
        unitPrice: 15000,
        amount: 15000,
      },
    ],
    totalAmount: 15000,
  },

  // ── May 2026 ──────────────────────────────────────────────────────────────
  {
    id: 'BILL-010',
    vendorId: 'VEND-001',
    date: '2026-05-03',
    dueDate: '2026-06-03',
    status: 'paid',
    lines: [
      {
        id: 'BILL-010-L1',
        accountId: 'ACC-COGS-001',
        description: 'AWS infrastructure – May',
        quantity: 1,
        unitPrice: 125000,
        amount: 125000,
      },
    ],
    totalAmount: 125000,
  },

  // ── June 2026 ─────────────────────────────────────────────────────────────
  {
    id: 'BILL-011',
    vendorId: 'VEND-003',
    date: '2026-06-01',
    dueDate: '2026-06-30',
    status: 'paid',
    lines: [
      {
        id: 'BILL-011-L1',
        accountId: 'ACC-EXP-001',
        description: 'Office rent – Jun 2026',
        quantity: 1,
        unitPrice: 120000,
        amount: 120000,
      },
    ],
    totalAmount: 120000,
  },

  // ── July 2026 ─────────────────────────────────────────────────────────────
  {
    id: 'BILL-012',
    vendorId: 'VEND-002',
    date: '2026-07-05',
    dueDate: '2026-08-05',
    status: 'received',
    lines: [
      {
        id: 'BILL-012-L1',
        accountId: 'ACC-COGS-001',
        description: 'Microsoft Azure + M365 – Jul',
        quantity: 1,
        unitPrice: 68000,
        amount: 68000,
      },
    ],
    totalAmount: 68000,
  },
]
