import type { Transaction } from '@/types/accounting.types'
import type { ProfitAndLossReport, ReportLineItem } from '../types/report.types'
import type {
  ReportRequest,
  ReportService,
  DataProvider,
} from '../types/reporting.contracts'
import { filterByDateRange } from '../utils/dateFilters'

/**
 * Aggregates an array of transactions into per-account line items.
 *
 * Transactions with the same accountId are summed together.
 */
function aggregateByAccount(transactions: Transaction[]): ReportLineItem[] {
  const accountTotals = new Map<string, { accountId: string; accountName: string; amount: number }>()

  for (const txn of transactions) {
    const existing = accountTotals.get(txn.accountId)
    if (existing) {
      existing.amount += txn.amount
    } else {
      accountTotals.set(txn.accountId, {
        accountId: txn.accountId,
        accountName: txn.accountId,
        amount: txn.amount,
      })
    }
  }

  return Array.from(accountTotals.values())
}

/**
 * Pure calculation function that produces a ProfitAndLossReport from a list of transactions.
 *
 * Pure function with zero dependencies on React, QuickBooks, or any specific data source.
 *
 * @param transactions  Transactions to evaluate (filtered internally)
 * @param fromDate      Start date (YYYY-MM-DD)
 * @param toDate        End date (YYYY-MM-DD)
 * @param periodLabel   Human-readable period label
 */
export function generateProfitAndLoss(
  transactions: Transaction[],
  fromDate: string,
  toDate: string,
  periodLabel: string = `${fromDate} – ${toDate}`,
): ProfitAndLossReport {
  // Step 1 — Filter by date range
  const filtered = filterByDateRange(transactions, fromDate, toDate)

  // Step 2 — Revenue: credit transactions on revenue accounts
  const revenueTxns = filtered.filter(
    (txn) => txn.accountType === 'revenue' && txn.type === 'credit',
  )
  const revenueLines = aggregateByAccount(revenueTxns)
  const totalRevenue = revenueLines.reduce((sum, line) => sum + line.amount, 0)

  // Step 3 — COGS: debit transactions on cogs accounts
  const cogsTxns = filtered.filter(
    (txn) => txn.accountType === 'cogs' && txn.type === 'debit',
  )
  const cogsLines = aggregateByAccount(cogsTxns)
  const totalCogs = cogsLines.reduce((sum, line) => sum + line.amount, 0)

  // Step 4 — Gross Profit
  const grossProfit = totalRevenue - totalCogs

  // Step 5 — Operating Expenses: debit transactions on expense accounts
  const expenseTxns = filtered.filter(
    (txn) => txn.accountType === 'expense' && txn.type === 'debit',
  )
  const expenseLines = aggregateByAccount(expenseTxns)
  const totalExpenses = expenseLines.reduce((sum, line) => sum + line.amount, 0)

  // Step 6 — Net Profit
  const netProfit = grossProfit - totalExpenses

  return {
    reportType: 'PROFIT_AND_LOSS',
    title: 'Profit & Loss',
    periodLabel,
    fromDate,
    toDate,
    generatedAt: new Date().toISOString(),
    revenueLines,
    totalRevenue,
    cogsLines,
    totalCogs,
    grossProfit,
    expenseLines,
    totalExpenses,
    netProfit,
  }
}

/**
 * Profit and Loss Report Service.
 *
 * Implements the standard ReportService contract.
 * Queries any DataProvider (Dummy, QBO, API) and returns the calculated ProfitAndLossReport.
 */
export class ProfitAndLossService implements ReportService<ReportRequest, ProfitAndLossReport> {
  async generate(request: ReportRequest, provider: DataProvider): Promise<ProfitAndLossReport> {
    const transactions = await provider.getTransactions({
      fromDate: request.fromDate,
      toDate: request.toDate,
    })

    const periodLabel = request.periodLabel || `${request.fromDate} – ${request.toDate}`
    return generateProfitAndLoss(transactions, request.fromDate, request.toDate, periodLabel)
  }

  /** Synchronous generation for in-memory / local providers */
  generateSync(request: ReportRequest, provider: DataProvider): ProfitAndLossReport {
    const transactions = provider.getTransactions({
      fromDate: request.fromDate,
      toDate: request.toDate,
    }) as Transaction[]

    const periodLabel = request.periodLabel || `${request.fromDate} – ${request.toDate}`
    return generateProfitAndLoss(transactions, request.fromDate, request.toDate, periodLabel)
  }
}

/** Singleton instance for application use */
export const profitAndLossService = new ProfitAndLossService()
