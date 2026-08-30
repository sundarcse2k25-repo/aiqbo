import type { Account } from '@/types/accounting.types'

/**
 * The four "control accounts" every invoice/bill/payment journal entry
 * posts against, resolved from the chart of accounts by name rather than
 * hardcoded anywhere in journal-generation or reporting code. This keeps
 * journal generation and report calculation provider-independent — they
 * only ever see account ids resolved from whatever chart of accounts the
 * active DataProvider supplies — while never inventing an id that isn't
 * actually present in that chart of accounts.
 */
export interface ControlAccounts {
  cashAccountId: string
  bankAccountId: string
  accountsReceivableId: string
  accountsPayableId: string
  retainedEarningsAccountId: string
}

export function resolveControlAccounts(accounts: Account[]): ControlAccounts {
  const find = (name: string): Account => {
    const account = accounts.find((a) => a.name === name)
    if (!account) {
      throw new Error(`Required control account "${name}" was not found in the chart of accounts`)
    }
    return account
  }

  return {
    cashAccountId: find('Cash').id,
    bankAccountId: find('Bank').id,
    accountsReceivableId: find('Accounts Receivable').id,
    accountsPayableId: find('Accounts Payable').id,
    retainedEarningsAccountId: find('Retained Earnings').id,
  }
}
