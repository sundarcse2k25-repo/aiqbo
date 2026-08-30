import type { Account, JournalEntry } from '@/types/accounting.types'
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
import { resolveControlAccounts, type ControlAccounts } from '../utils/controlAccounts'

/**
 * Computes a signed ledger balance for one account from journal entries up
 * to (and including) asOfDate, using the account's normal-balance sign
 * convention (asset/expense/cogs = debit-normal; liability/revenue/equity =
 * credit-normal).
 */
function getLedgerAccountBalance(
  journalEntries: JournalEntry[],
  accountId: string,
  isDebitNormal: boolean,
  asOfDate: string,
): number {
  let balance = 0
  for (const entry of journalEntries) {
    if (entry.date > asOfDate) continue
    for (const line of entry.lines) {
      if (line.accountId !== accountId) continue
      balance += isDebitNormal ? line.debit - line.credit : line.credit - line.debit
    }
  }
  return balance
}

/**
 * Derives Accounts Receivable, Accounts Payable, Cash, and Bank balances
 * directly from the double-entry ledger, replacing the previous
 * independent re-derivation from Invoice[]/Bill[] status. This removes the
 * duplicated calculation path that caused the earlier draft-invoice
 * Balance Sheet bug (two code paths disagreeing about revenue recognition)
 * — there is now a single source of truth for what is owed and what is on
 * hand.
 */
export function calculateLedgerDerivedBalances(
  journalEntries: JournalEntry[],
  controlAccounts: ControlAccounts,
  asOfDate: string,
) {
  return {
    accountsReceivable: getLedgerAccountBalance(journalEntries, controlAccounts.accountsReceivableId, true, asOfDate),
    accountsPayable: getLedgerAccountBalance(journalEntries, controlAccounts.accountsPayableId, false, asOfDate),
    cash: getLedgerAccountBalance(journalEntries, controlAccounts.cashAccountId, true, asOfDate),
    bank: getLedgerAccountBalance(journalEntries, controlAccounts.bankAccountId, true, asOfDate),
  }
}

/**
 * Generates a Balance Sheet as of a specific date.
 *
 * Fundamental equation: Assets = Liabilities + Equity
 *
 * Current Assets, Current Liabilities:
 *   - Accounts Receivable, Accounts Payable, Cash, Bank — all derived
 *     directly from the double-entry ledger (see calculateLedgerDerivedBalances)
 *     rather than independently re-derived from Invoice[]/Bill[] status.
 *
 * Equity:
 *   - Retained Earnings (Net Profit from beginning of records up to asOfDate)
 */
export function generateBalanceSheet(
  journalEntries: JournalEntry[],
  accounts: Account[],
  asOfDate: string,
  periodLabel: string = `As of ${asOfDate}`,
): BalanceSheetReport {
  const accountMap = new Map<string, Account>(accounts.map((a) => [a.id, a]))
  const controlAccounts = resolveControlAccounts(accounts)
  const ledger = calculateLedgerDerivedBalances(journalEntries, controlAccounts, asOfDate)

  // Retained Earnings — cumulative Net Profit up to asOfDate from P&L,
  // computed from the same journal entries that drive the ledger balances
  // above, so the whole Balance Sheet has one data source.
  const pnl = generateProfitAndLoss(journalEntries, '1970-01-01', asOfDate, periodLabel, accounts)
  const retainedEarnings = pnl.netProfit

  const accountName = (id: string, fallback: string) => accountMap.get(id)?.name || fallback

  // Asset Items
  const assetItems: BalanceSheetItem[] = [
    { accountId: controlAccounts.cashAccountId, accountName: accountName(controlAccounts.cashAccountId, 'Cash'), amount: ledger.cash },
    { accountId: controlAccounts.bankAccountId, accountName: accountName(controlAccounts.bankAccountId, 'Bank'), amount: ledger.bank },
    { accountId: controlAccounts.accountsReceivableId, accountName: accountName(controlAccounts.accountsReceivableId, 'Accounts Receivable'), amount: ledger.accountsReceivable },
  ]
  const totalAssets = assetItems.reduce((sum, item) => sum + item.amount, 0)

  const currentAssets: BalanceSheetSection = {
    title: 'Current Assets',
    items: assetItems,
    total: totalAssets,
  }

  // Liability Items
  const liabilityItems: BalanceSheetItem[] = [
    { accountId: controlAccounts.accountsPayableId, accountName: accountName(controlAccounts.accountsPayableId, 'Accounts Payable'), amount: ledger.accountsPayable },
  ]
  const totalLiabilities = liabilityItems.reduce((sum, item) => sum + item.amount, 0)

  const currentLiabilities: BalanceSheetSection = {
    title: 'Current Liabilities',
    items: liabilityItems,
    total: totalLiabilities,
  }

  // Equity Items
  const equityItems: BalanceSheetItem[] = [
    { accountId: controlAccounts.retainedEarningsAccountId, accountName: accountName(controlAccounts.retainedEarningsAccountId, 'Retained Earnings'), amount: retainedEarnings },
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
    const journalEntries = await provider.getJournalEntries()
    const accounts = await provider.getAccounts()
    const periodLabel = request.periodLabel || `As of ${request.toDate}`

    return generateBalanceSheet(journalEntries, accounts, request.toDate, periodLabel)
  }

  generateSync(request: ReportRequest, provider: DataProvider): BalanceSheetReport {
    const journalEntries = provider.getJournalEntries() as JournalEntry[]
    const accounts = provider.getAccounts() as Account[]
    const periodLabel = request.periodLabel || `As of ${request.toDate}`

    return generateBalanceSheet(journalEntries, accounts, request.toDate, periodLabel)
  }
}

export const balanceSheetService = new BalanceSheetService()
