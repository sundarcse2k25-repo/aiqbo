import type { Account } from '@/types/accounting.types'

/**
 * Dummy chart of accounts.
 *
 * These accounts are referenced by invoice lines, bill lines, and
 * transactions. Each account has a type that the reporting engine uses
 * to categorise amounts correctly.
 */
export const DUMMY_ACCOUNTS: Account[] = [
  // ── Revenue ───────────────────────────────────────────────────────────────
  {
    id: 'ACC-REV-001',
    name: 'Sales Revenue',
    type: 'revenue',
    subType: 'sales',
  },
  {
    id: 'ACC-REV-002',
    name: 'Service Revenue',
    type: 'revenue',
    subType: 'services',
  },

  // ── Cost of Goods Sold ────────────────────────────────────────────────────
  {
    id: 'ACC-COGS-001',
    name: 'Cost of Goods Sold',
    type: 'cogs',
  },

  // ── Operating Expenses ────────────────────────────────────────────────────
  {
    id: 'ACC-EXP-001',
    name: 'Rent Expense',
    type: 'expense',
    subType: 'operating',
  },
  {
    id: 'ACC-EXP-002',
    name: 'Salary Expense',
    type: 'expense',
    subType: 'operating',
  },
  {
    id: 'ACC-EXP-003',
    name: 'Electricity Expense',
    type: 'expense',
    subType: 'operating',
  },
  {
    id: 'ACC-EXP-004',
    name: 'Transportation Expense',
    type: 'expense',
    subType: 'operating',
  },
  {
    id: 'ACC-EXP-005',
    name: 'Office Expense',
    type: 'expense',
    subType: 'operating',
  },

  // ── Assets ────────────────────────────────────────────────────────────────
  {
    id: 'ACC-AST-001',
    name: 'Cash',
    type: 'asset',
    subType: 'current',
  },
  {
    id: 'ACC-AST-002',
    name: 'Bank',
    type: 'asset',
    subType: 'current',
  },
  {
    id: 'ACC-AST-003',
    name: 'Accounts Receivable',
    type: 'asset',
    subType: 'current',
  },

  // ── Liabilities ───────────────────────────────────────────────────────────
  {
    id: 'ACC-LIA-001',
    name: 'Accounts Payable',
    type: 'liability',
    subType: 'current',
  },
]
