import type { Transaction, Invoice, Bill } from '@/types/accounting.types'
import type {
  BalanceSheetReport,
  BalanceSheetItem,
  BalanceSheetSection,
} from '../types/report.types'
import type {
  ReportRequest,
  ReportService,
  DataProvider,
} from '../types/reporting.contracts'
import { generateProfitAndLoss } from './profitAndLoss.service'

/**
 * Generates a Balance Sheet as of a specific date.
 *
 * Fundamental equation: Assets = Liabilities + Equity
 *
 * Current Assets:
 *   - Accounts Receivable (Unpaid invoices up to asOfDate)
 *   - Cash & Bank (Derived from revenue payments minus expense payments)
 *
 * Current Liabilities:
 *   - Accounts Payable (Unpaid bills up to asOfDate)
 *
 * Equity:
 *   - Retained Earnings (Net Profit from beginning of records up to asOfDate)
 */
export function generateBalanceSheet(
  transactions: Transaction[],
  invoices: Invoice[],
  bills: Bill[],
  asOfDate: string,
  periodLabel: string = `As of ${asOfDate}`,
): BalanceSheetReport {
  // 1. Calculate Accounts Receivable (Unpaid/Partially paid invoices on or before asOfDate)
  const effectiveInvoices = invoices.filter((inv) => inv.date <= asOfDate && inv.status !== 'void')
  const accountsReceivableAmount = effectiveInvoices
    .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)

  // 2. Calculate Accounts Payable (Unpaid/Received bills on or before asOfDate)
  const effectiveBills = bills.filter((b) => b.date <= asOfDate && b.status !== 'void')
  const accountsPayableAmount = effectiveBills
    .filter((b) => b.status === 'received' || b.status === 'overdue')
    .reduce((sum, b) => sum + b.totalAmount, 0)

  // 3. Calculate Retained Earnings (Cumulative Net Profit up to asOfDate from P&L)
  const pnl = generateProfitAndLoss(transactions, '1970-01-01', asOfDate, periodLabel)
  const retainedEarnings = pnl.netProfit

  // 4. Calculate Cash & Bank: Cash = (Paid Revenue - Paid Bills)
  const paidRevenue = effectiveInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)

  const paidBills = effectiveBills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.totalAmount, 0)

  const totalCashAndBank = paidRevenue - paidBills
  const cashAmount = Math.round(totalCashAndBank * 0.2)
  const bankAmount = totalCashAndBank - cashAmount

  // Asset Items
  const assetItems: BalanceSheetItem[] = [
    { accountId: 'ACC-AST-001', accountName: 'Cash on Hand', amount: cashAmount },
    { accountId: 'ACC-AST-002', accountName: 'Operating Bank Account', amount: bankAmount },
    { accountId: 'ACC-AST-003', accountName: 'Accounts Receivable (AR)', amount: accountsReceivableAmount },
  ]
  const totalAssets = assetItems.reduce((sum, item) => sum + item.amount, 0)

  const currentAssets: BalanceSheetSection = {
    title: 'Current Assets',
    items: assetItems,
    total: totalAssets,
  }

  // Liability Items
  const liabilityItems: BalanceSheetItem[] = [
    { accountId: 'ACC-LIA-001', accountName: 'Accounts Payable (AP)', amount: accountsPayableAmount },
  ]
  const totalLiabilities = liabilityItems.reduce((sum, item) => sum + item.amount, 0)

  const currentLiabilities: BalanceSheetSection = {
    title: 'Current Liabilities',
    items: liabilityItems,
    total: totalLiabilities,
  }

  // Equity Items
  const equityItems: BalanceSheetItem[] = [
    { accountId: 'ACC-EQU-001', accountName: 'Retained Earnings (from P&L)', amount: retainedEarnings },
  ]
  const totalEquity = retainedEarnings

  const equitySection: BalanceSheetSection = {
    title: 'Equity',
    items: equityItems,
    total: totalEquity,
  }

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1

  return {
    reportType: 'BALANCE_SHEET',
    title: 'Balance Sheet',
    periodLabel,
    fromDate: '1970-01-01',
    toDate: asOfDate,
    asOfDate,
    generatedAt: new Date().toISOString(),
    currentAssets,
    totalAssets,
    currentLiabilities,
    totalLiabilities,
    equitySection,
    retainedEarnings,
    totalEquity,
    totalLiabilitiesAndEquity,
    isBalanced,
  }
}

/**
 * Balance Sheet Report Service.
 */
export class BalanceSheetService implements ReportService<ReportRequest, BalanceSheetReport> {
  async generate(request: ReportRequest, provider: DataProvider): Promise<BalanceSheetReport> {
    const transactions = await provider.getTransactions()
    const invoices = provider.getInvoices ? await provider.getInvoices() : []
    const bills = provider.getBills ? await provider.getBills() : []
    const periodLabel = request.periodLabel || `As of ${request.toDate}`

    return generateBalanceSheet(transactions, invoices, bills, request.toDate, periodLabel)
  }

  generateSync(request: ReportRequest, provider: DataProvider): BalanceSheetReport {
    const transactions = provider.getTransactions() as Transaction[]
    const invoices = (provider.getInvoices ? provider.getInvoices() : []) as Invoice[]
    const bills = (provider.getBills ? provider.getBills() : []) as Bill[]
    const periodLabel = request.periodLabel || `As of ${request.toDate}`

    return generateBalanceSheet(transactions, invoices, bills, request.toDate, periodLabel)
  }
}

export const balanceSheetService = new BalanceSheetService()
