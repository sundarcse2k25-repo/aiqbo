import type { Transaction, Account } from '@/types/accounting.types'
import type {
  GeneralLedgerReport,
  AccountLedgerGroup,
  LedgerTransactionRow,
} from '../types/report.types'
import type {
  ReportRequest,
  ReportService,
  DataProvider,
} from '../types/reporting.contracts'

/**
 * Generates a General Ledger report from transactions and accounts.
 *
 * Pure function with zero external side effects.
 */
export function generateGeneralLedger(
  transactions: Transaction[],
  accounts: Account[],
  fromDate: string,
  toDate: string,
  periodLabel: string = `${fromDate} – ${toDate}`,
): GeneralLedgerReport {
  const accountMap = new Map<string, Account>(accounts.map((a) => [a.id, a]))

  // Separate opening transactions (before fromDate) vs period transactions
  const openingTxns = transactions.filter((t) => t.date < fromDate)
  const periodTxns = transactions.filter((t) => t.date >= fromDate && t.date <= toDate)

  // Group transactions by account
  const accountGroupsMap = new Map<string, {
    openingBalance: number
    txns: Transaction[]
  }>()

  // Initialize for all known accounts
  accounts.forEach((acc) => {
    accountGroupsMap.set(acc.id, { openingBalance: 0, txns: [] })
  })

  // Calculate opening balance per account
  for (const txn of openingTxns) {
    const acc = accountMap.get(txn.accountId)
    const entry = accountGroupsMap.get(txn.accountId) || { openingBalance: 0, txns: [] }
    const isDebitNormal = acc?.type === 'asset' || acc?.type === 'expense' || acc?.type === 'cogs'

    if (txn.type === 'debit') {
      entry.openingBalance += isDebitNormal ? txn.amount : -txn.amount
    } else {
      entry.openingBalance += isDebitNormal ? -txn.amount : txn.amount
    }
    accountGroupsMap.set(txn.accountId, entry)
  }

  // Add period transactions
  for (const txn of periodTxns) {
    const entry = accountGroupsMap.get(txn.accountId) || { openingBalance: 0, txns: [] }
    entry.txns.push(txn)
    accountGroupsMap.set(txn.accountId, entry)
  }

  let grandTotalDebits = 0
  let grandTotalCredits = 0

  const accountGroups: AccountLedgerGroup[] = []

  accountGroupsMap.forEach((entry, accountId) => {
    // Only include accounts that have activity or an opening balance
    if (entry.txns.length === 0 && entry.openingBalance === 0) {
      return
    }

    const acc = accountMap.get(accountId)
    const accName = acc?.name || accountId
    const accType = acc?.type || 'expense'
    const isDebitNormal = accType === 'asset' || accType === 'expense' || accType === 'cogs'

    let runningBalance = entry.openingBalance
    let totalDebits = 0
    let totalCredits = 0

    // Sort period transactions by date
    entry.txns.sort((a, b) => a.date.localeCompare(b.date))

    const ledgerRows: LedgerTransactionRow[] = entry.txns.map((txn) => {
      if (txn.type === 'debit') {
        totalDebits += txn.amount
        runningBalance += isDebitNormal ? txn.amount : -txn.amount
      } else {
        totalCredits += txn.amount
        runningBalance += isDebitNormal ? -txn.amount : txn.amount
      }

      return {
        id: txn.id,
        date: txn.date,
        description: txn.description,
        type: txn.type,
        amount: txn.amount,
        sourceType: txn.sourceType,
        sourceId: txn.sourceId,
        runningBalance,
      }
    })

    grandTotalDebits += totalDebits
    grandTotalCredits += totalCredits

    accountGroups.push({
      accountId,
      accountName: accName,
      accountType: accType,
      openingBalance: entry.openingBalance,
      totalDebits,
      totalCredits,
      closingBalance: runningBalance,
      transactions: ledgerRows,
    })
  })

  // Sort account groups by account ID
  accountGroups.sort((a, b) => a.accountId.localeCompare(b.accountId))

  return {
    reportType: 'GENERAL_LEDGER',
    title: 'General Ledger',
    periodLabel,
    fromDate,
    toDate,
    generatedAt: new Date().toISOString(),
    accounts: accountGroups,
    totalDebits: grandTotalDebits,
    totalCredits: grandTotalCredits,
    netChange: grandTotalCredits - grandTotalDebits,
  }
}

/**
 * General Ledger Report Service.
 */
export class GeneralLedgerService implements ReportService<ReportRequest, GeneralLedgerReport> {
  async generate(request: ReportRequest, provider: DataProvider): Promise<GeneralLedgerReport> {
    const transactions = await provider.getTransactions()
    const accounts = provider.getAccounts ? await provider.getAccounts() : []
    const periodLabel = request.periodLabel || `${request.fromDate} – ${request.toDate}`

    return generateGeneralLedger(transactions, accounts, request.fromDate, request.toDate, periodLabel)
  }

  generateSync(request: ReportRequest, provider: DataProvider): GeneralLedgerReport {
    const transactions = provider.getTransactions() as Transaction[]
    const accounts = (provider.getAccounts ? provider.getAccounts() : []) as Account[]
    const periodLabel = request.periodLabel || `${request.fromDate} – ${request.toDate}`

    return generateGeneralLedger(transactions, accounts, request.fromDate, request.toDate, periodLabel)
  }
}

export const generalLedgerService = new GeneralLedgerService()
