import type {
  JournalEntry,
  Account,
  Invoice,
  Bill,
  Payment,
} from '@/types/accounting.types'
import { validateJournalEntry } from '../../features/reports/utils/journalValidation'
import { resolveControlAccounts, type ControlAccounts } from '../../features/reports/utils/controlAccounts'
import { DUMMY_ACCOUNTS } from './accounts'
import { DUMMY_INVOICES } from './invoices'
import { DUMMY_BILLS } from './bills'
import { DUMMY_PAYMENTS } from './payments'

export type { ControlAccounts }
export { resolveControlAccounts }

function buildAccountMap(accounts: Account[]): Map<string, Account> {
  return new Map(accounts.map((a) => [a.id, a]))
}

/**
 * Converts invoices into double-entry JournalEntries:
 *
 *   Accounts Receivable   DEBIT   totalAmount
 *   Revenue (per line)    CREDIT  line.amount
 *
 * Void invoices are cancelled and draft invoices have not been issued to
 * the customer — neither posts a JournalEntry.
 */
export function invoicesToJournalEntries(
  invoices: Invoice[],
  accountMap: Map<string, Account>,
  controlAccounts: ControlAccounts,
): JournalEntry[] {
  const entries: JournalEntry[] = []

  for (const invoice of invoices) {
    if (invoice.status === 'void' || invoice.status === 'draft') continue

    const arAccount = accountMap.get(controlAccounts.accountsReceivableId)
    if (!arAccount) continue

    const entry: JournalEntry = {
      id: `JE-INV-${invoice.id}`,
      date: invoice.date,
      description: `Invoice ${invoice.id}`,
      sourceType: 'invoice',
      sourceId: invoice.id,
      lines: [
        {
          id: `${invoice.id}-AR`,
          accountId: arAccount.id,
          accountType: arAccount.type,
          debit: invoice.totalAmount,
          credit: 0,
          description: `AR — ${invoice.id}`,
          documentId: invoice.id,
        },
        ...invoice.lines
          .map((line): JournalEntry['lines'][number] | null => {
            const revenueAccount = accountMap.get(line.accountId)
            if (!revenueAccount) return null
            return {
              id: line.id,
              accountId: revenueAccount.id,
              accountType: revenueAccount.type,
              debit: 0,
              credit: line.amount,
              description: `${line.description} (${invoice.id})`,
            }
          })
          .filter((line): line is JournalEntry['lines'][number] => line !== null),
      ],
    }

    validateJournalEntry(entry)
    entries.push(entry)
  }

  return entries
}

/**
 * Converts bills into double-entry JournalEntries:
 *
 *   Expense/COGS (per line)   DEBIT   line.amount
 *   Accounts Payable          CREDIT  totalAmount
 *
 * Void and draft bills post no JournalEntry, mirroring invoice recognition.
 */
export function billsToJournalEntries(
  bills: Bill[],
  accountMap: Map<string, Account>,
  controlAccounts: ControlAccounts,
): JournalEntry[] {
  const entries: JournalEntry[] = []

  for (const bill of bills) {
    if (bill.status === 'void' || bill.status === 'draft') continue

    const apAccount = accountMap.get(controlAccounts.accountsPayableId)
    if (!apAccount) continue

    const entry: JournalEntry = {
      id: `JE-BILL-${bill.id}`,
      date: bill.date,
      description: `Bill ${bill.id}`,
      sourceType: 'bill',
      sourceId: bill.id,
      lines: [
        ...bill.lines
          .map((line): JournalEntry['lines'][number] | null => {
            const expenseAccount = accountMap.get(line.accountId)
            if (!expenseAccount) return null
            return {
              id: line.id,
              accountId: expenseAccount.id,
              accountType: expenseAccount.type,
              debit: line.amount,
              credit: 0,
              description: `${line.description} (${bill.id})`,
            }
          })
          .filter((line): line is JournalEntry['lines'][number] => line !== null),
        {
          id: `${bill.id}-AP`,
          accountId: apAccount.id,
          accountType: apAccount.type,
          debit: 0,
          credit: bill.totalAmount,
          description: `AP — ${bill.id}`,
          documentId: bill.id,
        },
      ],
    }

    validateJournalEntry(entry)
    entries.push(entry)
  }

  return entries
}

/**
 * Converts payments into double-entry JournalEntries.
 *
 * Customer payment (type 'invoice'):
 *   Bank/Cash              DEBIT   amount
 *   Accounts Receivable    CREDIT  amount
 *
 * Vendor payment (type 'bill'):
 *   Accounts Payable       DEBIT   amount
 *   Bank/Cash              CREDIT  amount
 *
 * A payment settles exactly one invoice/bill (`referenceId`) per Payment
 * record; multiple Payment records may share the same referenceId
 * (multiple/partial payments against one document), and — because nothing
 * here requires a 1:1 relationship between Payment and JournalEntry — a
 * future provider could equally represent "one payment applied to many
 * invoices" as several Payment records sharing one settlement date without
 * any change to this function or the domain model.
 */
export function paymentsToJournalEntries(
  payments: Payment[],
  accountMap: Map<string, Account>,
  controlAccounts: ControlAccounts,
): JournalEntry[] {
  const entries: JournalEntry[] = []

  for (const payment of payments) {
    const cashOrBankId = payment.method === 'cash' ? controlAccounts.cashAccountId : controlAccounts.bankAccountId
    const cashOrBankAccount = accountMap.get(cashOrBankId)
    if (!cashOrBankAccount) continue

    let entry: JournalEntry

    if (payment.type === 'invoice') {
      const arAccount = accountMap.get(controlAccounts.accountsReceivableId)
      if (!arAccount) continue

      entry = {
        id: `JE-PAY-${payment.id}`,
        date: payment.date,
        description: `Payment ${payment.id} — received against ${payment.referenceId}`,
        sourceType: 'payment',
        sourceId: payment.id,
        lines: [
          {
            id: `${payment.id}-CASHBANK`,
            accountId: cashOrBankAccount.id,
            accountType: cashOrBankAccount.type,
            debit: payment.amount,
            credit: 0,
            description: `${cashOrBankAccount.name} — payment for ${payment.referenceId}`,
            documentId: payment.referenceId,
          },
          {
            id: `${payment.id}-AR`,
            accountId: arAccount.id,
            accountType: arAccount.type,
            debit: 0,
            credit: payment.amount,
            description: `AR — payment for ${payment.referenceId}`,
            documentId: payment.referenceId,
          },
        ],
      }
    } else {
      const apAccount = accountMap.get(controlAccounts.accountsPayableId)
      if (!apAccount) continue

      entry = {
        id: `JE-PAY-${payment.id}`,
        date: payment.date,
        description: `Payment ${payment.id} — paid against ${payment.referenceId}`,
        sourceType: 'payment',
        sourceId: payment.id,
        lines: [
          {
            id: `${payment.id}-AP`,
            accountId: apAccount.id,
            accountType: apAccount.type,
            debit: payment.amount,
            credit: 0,
            description: `AP — payment for ${payment.referenceId}`,
            documentId: payment.referenceId,
          },
          {
            id: `${payment.id}-CASHBANK`,
            accountId: cashOrBankAccount.id,
            accountType: cashOrBankAccount.type,
            debit: 0,
            credit: payment.amount,
            description: `${cashOrBankAccount.name} — payment for ${payment.referenceId}`,
            documentId: payment.referenceId,
          },
        ],
      }
    }

    validateJournalEntry(entry)
    entries.push(entry)
  }

  return entries
}

const accountMap = buildAccountMap(DUMMY_ACCOUNTS)
const controlAccounts = resolveControlAccounts(DUMMY_ACCOUNTS)

/**
 * The complete set of dummy journal entries derived from invoices, bills,
 * and payments — the normalized double-entry ledger the reporting engine
 * consumes via DataProvider.getJournalEntries().
 */
export const DUMMY_JOURNAL_ENTRIES: JournalEntry[] = [
  ...invoicesToJournalEntries(DUMMY_INVOICES, accountMap, controlAccounts),
  ...billsToJournalEntries(DUMMY_BILLS, accountMap, controlAccounts),
  ...paymentsToJournalEntries(DUMMY_PAYMENTS, accountMap, controlAccounts),
].sort((a, b) => a.date.localeCompare(b.date))
