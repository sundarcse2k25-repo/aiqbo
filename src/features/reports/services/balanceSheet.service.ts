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
import { resolveRetainedEarningsAccountId, type ControlAccounts } from '../utils/controlAccounts'

/**
 * Computes a signed ledger balance for one account from journal entries up
 * to (and including) asOfDate, using the account's normal-balance sign
 * convention (asset/expense/cogs = debit-normal; liability/revenue/equity =
 * credit-normal). Contra accounts (Accumulated Depreciation, Treasury
 * Stock, Dividends, ...) need no special handling here — they are ordinary
 * accounts of their parent's accountType that happen to accumulate more
 * "wrong-side" postings than "right-side" ones, which this same formula
 * naturally renders as a negative balance.
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
 * @deprecated Kept for backward compatibility (existing callers / tests
 * still use this to inspect the four legacy control-account balances
 * directly). generateBalanceSheet() no longer calls this internally — it
 * now discovers and sums every account of the relevant type generically
 * (see classifyAssetBucket / classifyLiabilityBucket below), so the report
 * is no longer limited to exactly one Cash, Bank, AR, or AP account.
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

// ---------------------------------------------------------------------------
// Account classification
//
// Classification uses only Account.type (required) and Account.subType
// (optional, already part of the domain model — no new field is added).
// The sentinel subType values below are the smallest possible convention:
// anything NOT explicitly tagged 'fixed'/'other'/'long_term' defaults to
// the "current" bucket, which is exactly how every existing dummy account
// already behaves (their subType is 'current' or unset). A future QBO
// adapter is responsible for translating QBO's AccountSubType into these
// three sentinel strings — no QBO-specific mapping lives in this file.
// ---------------------------------------------------------------------------

const FIXED_ASSET_SUBTYPE = 'fixed'
const OTHER_ASSET_SUBTYPE = 'other'
const LONG_TERM_LIABILITY_SUBTYPE = 'long_term'

type AssetBucket = 'current' | 'fixed' | 'other'
type LiabilityBucket = 'current' | 'long_term'

function classifyAssetBucket(account: Account): AssetBucket {
  if (account.subType === FIXED_ASSET_SUBTYPE) return 'fixed'
  if (account.subType === OTHER_ASSET_SUBTYPE) return 'other'
  return 'current'
}

function classifyLiabilityBucket(account: Account): LiabilityBucket {
  return account.subType === LONG_TERM_LIABILITY_SUBTYPE ? 'long_term' : 'current'
}

function sumItems(items: BalanceSheetItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

function buildSection(title: string, items: BalanceSheetItem[]): BalanceSheetSection {
  return { title, items, total: sumItems(items) }
}

/**
 * Generates a Balance Sheet as of a specific date.
 *
 * Fundamental equation: Assets = Liabilities + Equity
 *
 * Every account in the chart of accounts is included generically:
 *   1. Filter accounts.forEach by accountType (asset / liability / equity)
 *   2. Classify each into its section using accountType + subType
 *   3. Compute its ledger balance directly from journal entries
 *   4. Group into sections and sum totals
 *
 * This makes no assumption about how many bank accounts, AR accounts, AP
 * accounts, or equity accounts exist, and no assumption about their names
 * — the report works from whatever chart of accounts the DataProvider
 * supplies, which is what allows a future QBO adapter to feed it Questar's
 * (or any other real company's) chart without renaming anything to
 * "Cash"/"Bank"/"Accounts Receivable"/etc.
 *
 * Retained Earnings remains a narrow, deliberate exception: rather than
 * reading a posted ledger balance, it is computed as cumulative Net Profit
 * from the P&L (see the historical note below) and attached to whichever
 * equity account resolveRetainedEarningsAccountId() identifies as Retained
 * Earnings — resolved by Account.subType first, falling back to the exact
 * name "Retained Earnings", independently of every other control account
 * role (this function never requires a "Cash"/"Bank"/"Accounts
 * Receivable"/"Accounts Payable"-named account to exist, since it doesn't
 * use any of them).
 * Every OTHER equity account (Common Stock, Treasury Stock, Additional
 * Paid-in Capital, Dividends, ...) is summed generically from the ledger
 * like any other account, contra accounts included with no special case.
 */
export function generateBalanceSheet(
  journalEntries: JournalEntry[],
  accounts: Account[],
  asOfDate: string,
  periodLabel: string = `As of ${asOfDate}`,
): BalanceSheetReport {
  const retainedEarningsAccountId = resolveRetainedEarningsAccountId(accounts)

  // Retained Earnings — cumulative Net Profit up to asOfDate from P&L,
  // computed from the same journal entries that drive every other balance
  // below, so the whole Balance Sheet has one data source. This value is
  // NOT read from a posted ledger balance (the dummy dataset never posts a
  // closing entry to Retained Earnings) — it is a deliberate synthesis,
  // unchanged from the prior implementation, and is attached only to the
  // one equity account identified as the Retained Earnings control account.
  const pnl = generateProfitAndLoss(journalEntries, '1970-01-01', asOfDate, periodLabel, accounts)
  const retainedEarnings = pnl.netProfit

  const toItem = (account: Account, isDebitNormal: boolean, overrideAmount?: number): BalanceSheetItem => ({
    accountId: account.id,
    accountName: account.name,
    amount: overrideAmount !== undefined ? overrideAmount : getLedgerAccountBalance(journalEntries, account.id, isDebitNormal, asOfDate),
  })

  const assetAccounts = accounts.filter((a) => a.type === 'asset')
  const liabilityAccounts = accounts.filter((a) => a.type === 'liability')
  const equityAccounts = accounts.filter((a) => a.type === 'equity')

  const currentAssetItems = assetAccounts.filter((a) => classifyAssetBucket(a) === 'current').map((a) => toItem(a, true))
  const fixedAssetItems = assetAccounts.filter((a) => classifyAssetBucket(a) === 'fixed').map((a) => toItem(a, true))
  const otherAssetItems = assetAccounts.filter((a) => classifyAssetBucket(a) === 'other').map((a) => toItem(a, true))

  const currentLiabilityItems = liabilityAccounts.filter((a) => classifyLiabilityBucket(a) === 'current').map((a) => toItem(a, false))
  const longTermLiabilityItems = liabilityAccounts.filter((a) => classifyLiabilityBucket(a) === 'long_term').map((a) => toItem(a, false))

  const equityItems = equityAccounts.map((a) =>
    a.id === retainedEarningsAccountId ? toItem(a, false, retainedEarnings) : toItem(a, false),
  )

  const currentAssets = buildSection('Current Assets', currentAssetItems)
  const fixedAssets = buildSection('Fixed Assets', fixedAssetItems)
  const otherAssets = buildSection('Other Assets', otherAssetItems)
  const totalAssets = currentAssets.total + fixedAssets.total + otherAssets.total

  const currentLiabilities = buildSection('Current Liabilities', currentLiabilityItems)
  const longTermLiabilities = buildSection('Long-term Liabilities', longTermLiabilityItems)
  const totalLiabilities = currentLiabilities.total + longTermLiabilities.total

  const equitySection = buildSection('Equity', equityItems)
  const totalEquity = equitySection.total

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
    fixedAssets,
    otherAssets,
    totalAssets,
    currentLiabilities,
    longTermLiabilities,
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
