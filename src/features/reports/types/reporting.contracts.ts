import type {
  Transaction,
  Account,
  Invoice,
  Bill,
  Customer,
  Vendor,
} from '@/types/accounting.types'

/**
 * Standard parameters required for generating a report.
 */
export interface ReportRequest {
  /** Filter start date (ISO: YYYY-MM-DD) */
  fromDate: string
  /** Filter end date (ISO: YYYY-MM-DD) */
  toDate: string
  /** Optional human-readable period label (e.g. "January 2026") */
  periodLabel?: string
}

/**
 * Base metadata shared by all report results in the system.
 */
export interface BaseReportResult {
  /** Identifier of the report type (e.g. "PROFIT_AND_LOSS", "BALANCE_SHEET") */
  reportType: string
  /** User-facing title */
  title: string
  /** Display label for the period covered */
  periodLabel: string
  /** Start date (ISO: YYYY-MM-DD) */
  fromDate: string
  /** End date (ISO: YYYY-MM-DD) */
  toDate: string
  /** ISO timestamp when the report was calculated */
  generatedAt: string
}

/**
 * Filter options for querying transactions from a DataProvider.
 */
export interface TransactionQueryFilter {
  fromDate?: string
  toDate?: string
  accountIds?: string[]
}

/**
 * Abstract data provider contract.
 *
 * Any source of accounting data (Dummy data, QuickBooks Online,
 * Python backend, Java API, PostgreSQL) must implement this interface.
 * The Reporting Engine only interacts with DataProvider.
 */
export interface DataProvider {
  /** Retrieve normalized transactions, optionally filtered by date range */
  getTransactions(filter?: TransactionQueryFilter): Promise<Transaction[]> | Transaction[]

  /** Retrieve chart of accounts */
  getAccounts?(): Promise<Account[]> | Account[]

  /** Retrieve invoices (Accounts Receivable) */
  getInvoices?(): Promise<Invoice[]> | Invoice[]

  /** Retrieve bills (Accounts Payable) */
  getBills?(): Promise<Bill[]> | Bill[]

  /** Retrieve customers */
  getCustomers?(): Promise<Customer[]> | Customer[]

  /** Retrieve vendors */
  getVendors?(): Promise<Vendor[]> | Vendor[]
}

/**
 * Generic report service contract.
 *
 * Implementations contain the business logic for calculating a specific report.
 * They are completely decoupled from where the data originated.
 */
export interface ReportService<TRequest extends ReportRequest, TResult extends BaseReportResult> {
  generate(request: TRequest, provider: DataProvider): Promise<TResult> | TResult
}
