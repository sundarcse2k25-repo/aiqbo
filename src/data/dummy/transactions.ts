import type { Transaction, Account, Invoice, Bill } from '@/types/accounting.types'
import { DUMMY_ACCOUNTS } from './accounts'
import { DUMMY_INVOICES } from './invoices'
import { DUMMY_BILLS } from './bills'

/**
 * Build an Account lookup map for O(1) access.
 */
function buildAccountMap(accounts: Account[]): Map<string, Account> {
  return new Map(accounts.map((a) => [a.id, a]))
}

/**
 * Convert invoice lines into credit transactions (money in / revenue).
 *
 * We use the invoice date for all lines within that invoice.
 * Only non-void invoices are included.
 */
function invoicesToTransactions(
  invoices: Invoice[],
  accountMap: Map<string, Account>,
): Transaction[] {
  const transactions: Transaction[] = []

  for (const invoice of invoices) {
    if (invoice.status === 'void') continue

    for (const line of invoice.lines) {
      const account = accountMap.get(line.accountId)
      if (!account) continue

      transactions.push({
        id: `TXN-INV-${invoice.id}-${line.id}`,
        date: invoice.date,
        accountId: line.accountId,
        accountType: account.type,
        description: `${line.description} (${invoice.id})`,
        amount: line.amount,
        type: 'credit', // Revenue — money earned
        sourceType: 'invoice',
        sourceId: invoice.id,
      })
    }
  }

  return transactions
}

/**
 * Convert bill lines into debit transactions (money out / expense or COGS).
 *
 * Only non-void bills are included.
 */
function billsToTransactions(
  bills: Bill[],
  accountMap: Map<string, Account>,
): Transaction[] {
  const transactions: Transaction[] = []

  for (const bill of bills) {
    if (bill.status === 'void') continue

    for (const line of bill.lines) {
      const account = accountMap.get(line.accountId)
      if (!account) continue

      transactions.push({
        id: `TXN-BILL-${bill.id}-${line.id}`,
        date: bill.date,
        accountId: line.accountId,
        accountType: account.type,
        description: `${line.description} (${bill.id})`,
        amount: line.amount,
        type: 'debit', // Expense/COGS — money spent
        sourceType: 'bill',
        sourceId: bill.id,
      })
    }
  }

  return transactions
}

/**
 * The complete set of dummy transactions derived from invoices and bills.
 *
 * This is what the reporting engine receives. It has no knowledge of
 * Invoices or Bills — it only works with Transactions.
 */
const accountMap = buildAccountMap(DUMMY_ACCOUNTS)

export const DUMMY_TRANSACTIONS: Transaction[] = [
  ...invoicesToTransactions(DUMMY_INVOICES, accountMap),
  ...billsToTransactions(DUMMY_BILLS, accountMap),
].sort((a, b) => a.date.localeCompare(b.date))
