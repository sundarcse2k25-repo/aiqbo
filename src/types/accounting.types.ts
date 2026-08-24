/**
 * Core accounting domain models for the AIQBO reporting system.
 *
 * These models are intentionally minimal — they capture only what the
 * reporting engine needs. They are NOT a full reproduction of the
 * QuickBooks data model.
 *
 * Data sources (current and future) must map their data into these types
 * before passing it to the reporting engine.
 */

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

/** The broad category of an account — drives how the reporting engine buckets it. */
export type AccountType =
  | 'revenue'     // Income / sales
  | 'cogs'        // Cost of Goods Sold
  | 'expense'     // Operating expenses
  | 'asset'       // Cash, AR, Bank, etc.
  | 'liability'   // AP, loans, etc.
  | 'equity'      // Owner equity, retained earnings

export interface Account {
  id: string
  name: string
  type: AccountType
  /** Optional sub-type for further categorisation (e.g. "operating_expense") */
  subType?: string
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  /** Billing address — optional for reporting purposes */
  address?: string
}

// ---------------------------------------------------------------------------
// Vendor
// ---------------------------------------------------------------------------

export interface Vendor {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void'

export interface InvoiceLine {
  id: string
  /** The account (revenue/asset) this line maps to */
  accountId: string
  description: string
  quantity: number
  unitPrice: number
  /** Computed: quantity × unitPrice */
  amount: number
}

export interface Invoice {
  id: string
  customerId: string
  /** ISO date string: YYYY-MM-DD */
  date: string
  /** ISO date string: YYYY-MM-DD */
  dueDate: string
  status: InvoiceStatus
  lines: InvoiceLine[]
  /** Sum of all line amounts */
  totalAmount: number
}

// ---------------------------------------------------------------------------
// Bill
// ---------------------------------------------------------------------------

export type BillStatus = 'draft' | 'received' | 'paid' | 'overdue' | 'void'

export interface BillLine {
  id: string
  /** The account (expense/cogs) this line maps to */
  accountId: string
  description: string
  quantity: number
  unitPrice: number
  /** Computed: quantity × unitPrice */
  amount: number
}

export interface Bill {
  id: string
  vendorId: string
  /** ISO date string: YYYY-MM-DD */
  date: string
  /** ISO date string: YYYY-MM-DD */
  dueDate: string
  status: BillStatus
  lines: BillLine[]
  /** Sum of all line amounts */
  totalAmount: number
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export type PaymentType = 'invoice' | 'bill'

export interface Payment {
  id: string
  /** Whether this payment is against an invoice (received) or a bill (sent) */
  type: PaymentType
  /** The invoice or bill id this payment is for */
  referenceId: string
  /** ISO date string: YYYY-MM-DD */
  date: string
  amount: number
  /** Payment method for auditing purposes */
  method?: 'cash' | 'bank_transfer' | 'credit_card' | 'ach' | 'wire' | 'check' | 'cheque'
}

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------
//
// Transactions are the normalised ledger entries that the reporting engine
// works with. Both invoices and bills are converted into transactions before
// being processed. This keeps the reporting engine decoupled from the
// document types (Invoice, Bill).

export type TransactionType = 'debit' | 'credit'

export interface Transaction {
  id: string
  /** ISO date string: YYYY-MM-DD */
  date: string
  /** Links back to the account for categorisation */
  accountId: string
  accountType: AccountType
  description: string
  amount: number
  /** credit = money in (revenue); debit = money out (expense/cogs) */
  type: TransactionType
  /** Optional reference to the source document */
  sourceType?: 'invoice' | 'bill' | 'payment' | 'journal'
  sourceId?: string
}
