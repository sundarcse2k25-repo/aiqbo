import type { Account, JournalEntry } from '@/types/accounting.types'
import type { ProfitAndLossReport, ReportLineItem } from '../types/report.types'
import type {
  ReportRequest,
  ReportService,
  DataProvider,
} from '../types/reporting.contracts'

interface AccountAmount {
  accountId: string
  amount: number
}

/**
 * Aggregates per-account amounts into per-account line items.
 *
 * Entries with the same accountId are summed together. Account names are
 * resolved from the chart of accounts when available, falling back to the
 * accountId if the account is not found.
 */
function aggregateByAccount(
  items: AccountAmount[],
  accountMap: Map<string, Account>,
): ReportLineItem[] {
  const accountTotals = new Map<string, { accountId: string; accountName: string; amount: number }>()

  for (const item of items) {
    const existing = accountTotals.get(item.accountId)
    if (existing) {
      existing.amount += item.amount
    } else {
      accountTotals.set(item.accountId, {
        accountId: item.accountId,
        accountName: accountMap.get(item.accountId)?.name || item.accountId,
        amount: item.amount,
      })
    }
  }

  return Array.from(accountTotals.values())
}

/**
 * Collects amounts from journal entry lines matching an accountType and a
 * debit/credit direction (e.g. revenue-credit lines, expense-debit lines).
 */
function collectLineAmounts(
  entries: JournalEntry[],
  accountType: Account['type'],
  direction: 'debit' | 'credit',
): AccountAmount[] {
  const result: AccountAmount[] = []
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (line.accountType !== accountType) continue
      const amount = direction === 'debit' ? line.debit : line.credit
      if (amount <= 0) continue
      result.push({ accountId: line.accountId, amount })
    }
  }
  return result
}

/**
 * Pure calculation function that produces a ProfitAndLossReport from
 * double-entry journal entries.
 *
 * Pure function with zero dependencies on React, QuickBooks, or any specific
 * data source. Reads only the revenue-credit, cogs-debit, and expense-debit
 * lines of each entry — contra lines (AR/AP/Cash/Bank) are ignored. Totals
 * are pinned against the previously validated figures in the regression
 * test in journalEntries.test.ts.
 *
 * @param journalEntries  Journal entries to evaluate (filtered internally)
 * @param fromDate        Start date (YYYY-MM-DD)
 * @param toDate          End date (YYYY-MM-DD)
 * @param periodLabel     Human-readable period label
 * @param accounts        Chart of accounts, used to resolve account names on each line item
 */
export function generateProfitAndLoss(
  journalEntries: JournalEntry[],
  fromDate: string,
  toDate: string,
  periodLabel: string = `${fromDate} – ${toDate}`,
  accounts: Account[] = [],
): ProfitAndLossReport {
  const accountMap = new Map<string, Account>(accounts.map((a) => [a.id, a]))

  // Step 1 — Filter by date range
  const filtered = journalEntries.filter((entry) => entry.date >= fromDate && entry.date <= toDate)

  // Step 2 — Revenue: credit lines on revenue accounts
  const revenueAmounts = collectLineAmounts(filtered, 'revenue', 'credit')
  const revenueLines = aggregateByAccount(revenueAmounts, accountMap)
  const totalRevenue = revenueLines.reduce((sum, line) => sum + line.amount, 0)

  // Step 3 — COGS: debit lines on cogs accounts
  const cogsAmounts = collectLineAmounts(filtered, 'cogs', 'debit')
  const cogsLines = aggregateByAccount(cogsAmounts, accountMap)
  const totalCogs = cogsLines.reduce((sum, line) => sum + line.amount, 0)

  // Step 4 — Gross Profit
  const grossProfit = totalRevenue - totalCogs

  // Step 5 — Operating Expenses: debit lines on expense accounts
  const expenseAmounts = collectLineAmounts(filtered, 'expense', 'debit')
  const expenseLines = aggregateByAccount(expenseAmounts, accountMap)
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
    const journalEntries = await provider.getJournalEntries({
      fromDate: request.fromDate,
      toDate: request.toDate,
    })
    const accounts = await provider.getAccounts()

    const periodLabel = request.periodLabel || `${request.fromDate} – ${request.toDate}`
    return generateProfitAndLoss(journalEntries, request.fromDate, request.toDate, periodLabel, accounts)
  }

  /** Synchronous generation for in-memory / local providers */
  generateSync(request: ReportRequest, provider: DataProvider): ProfitAndLossReport {
    const journalEntries = provider.getJournalEntries({
      fromDate: request.fromDate,
      toDate: request.toDate,
    }) as JournalEntry[]
    const accounts = provider.getAccounts() as Account[]

    const periodLabel = request.periodLabel || `${request.fromDate} – ${request.toDate}`
    return generateProfitAndLoss(journalEntries, request.fromDate, request.toDate, periodLabel, accounts)
  }
}

/** Singleton instance for application use */
export const profitAndLossService = new ProfitAndLossService()
