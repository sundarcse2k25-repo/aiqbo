import type { BaseReportResult } from './reporting.contracts'
import type { AccountType } from '@/types/accounting.types'

/**
 * Report result types for the reporting engine.
 *
 * These types define the shape of data returned by report services.
 * They are independent of any data source (dummy, QBO, Python backend, etc).
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

/** A single line item within a report section */
export interface ReportLineItem {
  accountId: string
  accountName: string
  amount: number
}

// ---------------------------------------------------------------------------
// 1. Profit & Loss Report
// ---------------------------------------------------------------------------

export interface ProfitAndLossReport extends BaseReportResult {
  /** Revenue line items (account type = "revenue") */
  revenueLines: ReportLineItem[]
  /** Total of all revenue lines */
  totalRevenue: number

  /** COGS line items (account type = "cogs") */
  cogsLines: ReportLineItem[]
  /** Total of all COGS lines */
  totalCogs: number

  /** Gross profit = totalRevenue − totalCogs */
  grossProfit: number

  /** Operating expense line items (account type = "expense") */
  expenseLines: ReportLineItem[]
  /** Total of all operating expenses */
  totalExpenses: number

  /** Net profit = grossProfit − totalExpenses */
  netProfit: number
}

// ---------------------------------------------------------------------------
// 2. General Ledger (GL) Report
// ---------------------------------------------------------------------------

export interface LedgerTransactionRow {
  id: string
  date: string
  description: string
  type: 'debit' | 'credit'
  amount: number
  sourceType?: string
  sourceId?: string
  /** Running balance for this account after this transaction */
  runningBalance: number
}

export interface AccountLedgerGroup {
  accountId: string
  accountName: string
  accountType: AccountType
  openingBalance: number
  totalDebits: number
  totalCredits: number
  closingBalance: number
  transactions: LedgerTransactionRow[]
}

export interface GeneralLedgerReport extends BaseReportResult {
  accounts: AccountLedgerGroup[]
  totalDebits: number
  totalCredits: number
  netChange: number
}

// ---------------------------------------------------------------------------
// 3. Balance Sheet Report
// ---------------------------------------------------------------------------

export interface BalanceSheetItem {
  accountId: string
  accountName: string
  amount: number
}

export interface BalanceSheetSection {
  title: string
  items: BalanceSheetItem[]
  total: number
}

export interface BalanceSheetReport extends BaseReportResult {
  asOfDate: string

  /** Assets */
  currentAssets: BalanceSheetSection
  /** Non-current assets such as equipment, content/production assets, etc. (net of any contra accounts, e.g. Accumulated Depreciation) */
  fixedAssets: BalanceSheetSection
  /** Non-current, non-fixed assets such as security deposits or long-term investments */
  otherAssets: BalanceSheetSection
  /** Sum of currentAssets + fixedAssets + otherAssets */
  totalAssets: number

  /** Liabilities */
  currentLiabilities: BalanceSheetSection
  /** Liabilities not due within the current period, e.g. notes payable, long-term loans */
  longTermLiabilities: BalanceSheetSection
  /** Sum of currentLiabilities + longTermLiabilities */
  totalLiabilities: number

  /** Equity */
  equitySection: BalanceSheetSection
  retainedEarnings: number
  totalEquity: number

  /** Total Liabilities & Equity (Must equal Total Assets) */
  totalLiabilitiesAndEquity: number
  isBalanced: boolean
}

// ---------------------------------------------------------------------------
// 4. Sales Report
// ---------------------------------------------------------------------------

export interface CustomerSalesBreakdown {
  customerId: string
  customerName: string
  invoiceCount: number
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
  percentageOfTotal: number
}

export interface ItemSalesBreakdown {
  accountId: string
  description: string
  quantity: number
  totalAmount: number
  percentageOfTotal: number
}

export interface SalesReport extends BaseReportResult {
  totalSales: number
  totalInvoices: number
  paidSales: number
  unpaidSales: number
  averageInvoiceValue: number
  byCustomer: CustomerSalesBreakdown[]
  byItem: ItemSalesBreakdown[]
}

// ---------------------------------------------------------------------------
// 5. Expenses Report
// ---------------------------------------------------------------------------

export interface VendorExpenseBreakdown {
  vendorId: string
  vendorName: string
  billCount: number
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
  percentageOfTotal: number
}

export interface CategoryExpenseBreakdown {
  accountId: string
  accountName: string
  accountType: AccountType
  totalAmount: number
  percentageOfTotal: number
}

export interface ExpenseReport extends BaseReportResult {
  totalExpenses: number
  totalCOGS: number
  totalOperatingExpenses: number
  totalBills: number
  paidExpenses: number
  unpaidExpenses: number
  byVendor: VendorExpenseBreakdown[]
  byCategory: CategoryExpenseBreakdown[]
}

// ---------------------------------------------------------------------------
// 6. AR / AP Aging Reports
// ---------------------------------------------------------------------------

export interface AgingBucketValues {
  current: number      // Not yet due
  days1_30: number     // 1–30 days overdue
  days31_60: number    // 31–60 days overdue
  days61_90: number    // 61–90 days overdue
  over90: number       // 90+ days overdue
  total: number
}

export interface EntityAgingRow extends AgingBucketValues {
  entityId: string
  entityName: string
  documentCount: number
}

export interface AgingReport extends BaseReportResult {
  agingType: 'RECEIVABLES' | 'PAYABLES'
  asOfDate: string
  totalOutstanding: number
  summary: AgingBucketValues
  rows: EntityAgingRow[]
}
