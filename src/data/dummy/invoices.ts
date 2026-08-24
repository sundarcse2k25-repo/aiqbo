import type { Invoice } from '@/types/accounting.types'

/**
 * 16 dummy invoices spread across Jan–Aug 2026.
 * Customers: CUST-001 to CUST-006
 * Revenue accounts: ACC-REV-001 (Sales), ACC-REV-002 (Services)
 * COGS account: ACC-COGS-001
 */
export const DUMMY_INVOICES: Invoice[] = [
  // ── January 2026 ──────────────────────────────────────────────────────────
  {
    id: 'INV-001',
    customerId: 'CUST-001',
    date: '2026-01-05',
    dueDate: '2026-02-05',
    status: 'paid',
    lines: [
      {
        id: 'INV-001-L1',
        accountId: 'ACC-REV-001',
        description: 'Software licences Q1',
        quantity: 50,
        unitPrice: 4000,
        amount: 200000,
      },
    ],
    totalAmount: 200000,
  },
  {
    id: 'INV-002',
    customerId: 'CUST-002',
    date: '2026-01-12',
    dueDate: '2026-02-12',
    status: 'paid',
    lines: [
      {
        id: 'INV-002-L1',
        accountId: 'ACC-REV-002',
        description: 'Implementation consulting – Jan',
        quantity: 80,
        unitPrice: 3500,
        amount: 280000,
      },
    ],
    totalAmount: 280000,
  },
  {
    id: 'INV-003',
    customerId: 'CUST-003',
    date: '2026-01-20',
    dueDate: '2026-02-20',
    status: 'paid',
    lines: [
      {
        id: 'INV-003-L1',
        accountId: 'ACC-REV-001',
        description: 'Hardware supply – batch A',
        quantity: 10,
        unitPrice: 15000,
        amount: 150000,
      },
      {
        id: 'INV-003-L2',
        accountId: 'ACC-REV-002',
        description: 'Installation services',
        quantity: 20,
        unitPrice: 2500,
        amount: 50000,
      },
    ],
    totalAmount: 200000,
  },

  // ── February 2026 ─────────────────────────────────────────────────────────
  {
    id: 'INV-004',
    customerId: 'CUST-004',
    date: '2026-02-03',
    dueDate: '2026-03-03',
    status: 'paid',
    lines: [
      {
        id: 'INV-004-L1',
        accountId: 'ACC-REV-002',
        description: 'Cloud migration consulting',
        quantity: 100,
        unitPrice: 4200,
        amount: 420000,
      },
    ],
    totalAmount: 420000,
  },
  {
    id: 'INV-005',
    customerId: 'CUST-005',
    date: '2026-02-18',
    dueDate: '2026-03-18',
    status: 'paid',
    lines: [
      {
        id: 'INV-005-L1',
        accountId: 'ACC-REV-001',
        description: 'ERP modules – Feb',
        quantity: 5,
        unitPrice: 60000,
        amount: 300000,
      },
    ],
    totalAmount: 300000,
  },

  // ── March 2026 ────────────────────────────────────────────────────────────
  {
    id: 'INV-006',
    customerId: 'CUST-006',
    date: '2026-03-01',
    dueDate: '2026-03-31',
    status: 'paid',
    lines: [
      {
        id: 'INV-006-L1',
        accountId: 'ACC-REV-002',
        description: 'Training services – Mar',
        quantity: 60,
        unitPrice: 3000,
        amount: 180000,
      },
    ],
    totalAmount: 180000,
  },
  {
    id: 'INV-007',
    customerId: 'CUST-001',
    date: '2026-03-15',
    dueDate: '2026-04-15',
    status: 'paid',
    lines: [
      {
        id: 'INV-007-L1',
        accountId: 'ACC-REV-001',
        description: 'Annual maintenance contract',
        quantity: 1,
        unitPrice: 350000,
        amount: 350000,
      },
    ],
    totalAmount: 350000,
  },

  // ── April 2026 ────────────────────────────────────────────────────────────
  {
    id: 'INV-008',
    customerId: 'CUST-002',
    date: '2026-04-07',
    dueDate: '2026-05-07',
    status: 'paid',
    lines: [
      {
        id: 'INV-008-L1',
        accountId: 'ACC-REV-002',
        description: 'Managed services – Apr',
        quantity: 1,
        unitPrice: 250000,
        amount: 250000,
      },
    ],
    totalAmount: 250000,
  },
  {
    id: 'INV-009',
    customerId: 'CUST-003',
    date: '2026-04-22',
    dueDate: '2026-05-22',
    status: 'paid',
    lines: [
      {
        id: 'INV-009-L1',
        accountId: 'ACC-REV-001',
        description: 'Hardware supply – batch B',
        quantity: 8,
        unitPrice: 18000,
        amount: 144000,
      },
    ],
    totalAmount: 144000,
  },

  // ── May 2026 ──────────────────────────────────────────────────────────────
  {
    id: 'INV-010',
    customerId: 'CUST-004',
    date: '2026-05-05',
    dueDate: '2026-06-05',
    status: 'paid',
    lines: [
      {
        id: 'INV-010-L1',
        accountId: 'ACC-REV-002',
        description: 'DevOps consulting – May',
        quantity: 90,
        unitPrice: 3800,
        amount: 342000,
      },
    ],
    totalAmount: 342000,
  },
  {
    id: 'INV-011',
    customerId: 'CUST-005',
    date: '2026-05-20',
    dueDate: '2026-06-20',
    status: 'sent',
    lines: [
      {
        id: 'INV-011-L1',
        accountId: 'ACC-REV-001',
        description: 'ERP modules – May',
        quantity: 3,
        unitPrice: 60000,
        amount: 180000,
      },
    ],
    totalAmount: 180000,
  },

  // ── June 2026 ─────────────────────────────────────────────────────────────
  {
    id: 'INV-012',
    customerId: 'CUST-006',
    date: '2026-06-10',
    dueDate: '2026-07-10',
    status: 'paid',
    lines: [
      {
        id: 'INV-012-L1',
        accountId: 'ACC-REV-002',
        description: 'Support & maintenance – Jun',
        quantity: 1,
        unitPrice: 220000,
        amount: 220000,
      },
    ],
    totalAmount: 220000,
  },

  // ── July 2026 ─────────────────────────────────────────────────────────────
  {
    id: 'INV-013',
    customerId: 'CUST-001',
    date: '2026-07-08',
    dueDate: '2026-08-08',
    status: 'paid',
    lines: [
      {
        id: 'INV-013-L1',
        accountId: 'ACC-REV-001',
        description: 'Software licences Q3',
        quantity: 50,
        unitPrice: 4200,
        amount: 210000,
      },
    ],
    totalAmount: 210000,
  },
  {
    id: 'INV-014',
    customerId: 'CUST-002',
    date: '2026-07-25',
    dueDate: '2026-08-25',
    status: 'sent',
    lines: [
      {
        id: 'INV-014-L1',
        accountId: 'ACC-REV-002',
        description: 'Consulting retainer – Jul',
        quantity: 1,
        unitPrice: 300000,
        amount: 300000,
      },
    ],
    totalAmount: 300000,
  },

  // ── August 2026 ───────────────────────────────────────────────────────────
  {
    id: 'INV-015',
    customerId: 'CUST-003',
    date: '2026-08-01',
    dueDate: '2026-09-01',
    status: 'sent',
    lines: [
      {
        id: 'INV-015-L1',
        accountId: 'ACC-REV-001',
        description: 'Hardware supply – batch C',
        quantity: 12,
        unitPrice: 16500,
        amount: 198000,
      },
    ],
    totalAmount: 198000,
  },
  {
    id: 'INV-016',
    customerId: 'CUST-004',
    date: '2026-08-15',
    dueDate: '2026-09-15',
    status: 'draft',
    lines: [
      {
        id: 'INV-016-L1',
        accountId: 'ACC-REV-002',
        description: 'AI/ML project kick-off',
        quantity: 40,
        unitPrice: 5000,
        amount: 200000,
      },
    ],
    totalAmount: 200000,
  },
]
