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

/**
 * Recognition rule: 'draft' and 'void' invoices are never recognized as
 * revenue or included in Sales/AR reporting — only 'sent' | 'paid' | 'overdue'
 * represent an issued invoice. When mapping from QuickBooks Online later,
 * QBO's Invoice.EmailStatus/Balance/void state must be mapped onto this
 * same five-value model so recognition rules stay identical across
 * providers (QBO has no native 'draft' invoice status — a QBO invoice
 * that has not been sent/synced should map to 'draft' here).
 */
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

/**
 * Recognition rule: 'draft' and 'void' bills are never recognized as an
 * expense or liability — only 'received' | 'paid' | 'overdue' represent a
 * confirmed bill. Mirrors InvoiceStatus's recognition rule (see above) so
 * a future QBO Bill mapping stays consistent with the invoice mapping.
 */
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
// Journal Entry (double-entry ledger)
// ---------------------------------------------------------------------------
//
// A JournalEntry is the normalized double-entry ledger record the
// reporting engine works with. Each entry groups two or more
// JournalEntryLines that must balance (sum of debits === sum of credits).
// This mirrors QuickBooks Online's own JournalEntry.Line[] shape,
// minimizing future adapter work. Invoices and bills are converted into
// JournalEntries before being processed, keeping the reporting engine
// decoupled from the source document types (Invoice, Bill).
//
// (This model replaced an earlier single-sided Transaction type, which has
// since been removed now that every report — P&L, General Ledger, Balance
// Sheet — runs natively on JournalEntry.)

export type JournalSourceType =
  | 'invoice'
  | 'bill'
  | 'payment'
  | 'credit_memo'
  | 'vendor_credit'
  | 'journal'

export interface JournalEntryLine {
  id: string
  accountId: string
  accountType: AccountType
  /** Exactly one of debit/credit is non-zero for a given line; never both. */
  debit: number
  credit: number
  description: string
  /** For AR/AP lines: which invoice/bill this line creates or settles. */
  documentId?: string
}

export interface JournalEntry {
  id: string
  /** ISO date string: YYYY-MM-DD */
  date: string
  description: string
  sourceType: JournalSourceType
  sourceId: string
  lines: JournalEntryLine[]
}

