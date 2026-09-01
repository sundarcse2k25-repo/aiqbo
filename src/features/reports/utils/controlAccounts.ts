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

// ---------------------------------------------------------------------------
// Multi-account control account resolution
// ---------------------------------------------------------------------------
//
// A real QuickBooks Online company can have several accounts filling the
// same role — e.g. "PNC Bank" and "Chase Checking" as two separate Bank
// accounts, or "AR - Trade" and "AR - Other" as two separate Accounts
// Receivable accounts. resolveControlAccounts() above resolves exactly one
// account per role by exact English name, which both throws and silently
// drops data for such companies. resolveControlAccountGroups() below
// resolves every account that plays a given role, so callers (Aging,
// Monthly Performance) can sum/net across all of them.
//
// Role identification, in priority order:
//   1. Account.subType is one of that role's sentinel values below (this is
//      how a future QBO adapter should populate subType from QBO's own
//      AccountType/AccountSubType, per the QBO readiness audit).
//   2. Fallback: legacy exact-name match (same names resolveControlAccounts
//      uses). This keeps every existing account fixture — which sets no
//      role subType — resolving to exactly the same single account it
//      already resolves to today, so this is purely additive and does not
//      change behavior for any current dummy data or test fixture.
//
// Never silently guess: if neither strategy finds a matching account, this
// throws, exactly like resolveControlAccounts does today.

export interface ControlAccountGroups {
  cashAccountIds: string[]
  bankAccountIds: string[]
  accountsReceivableIds: string[]
  accountsPayableIds: string[]
  /** Still resolved as a single account — a company has exactly one Retained Earnings account (see the QBO readiness audit, Section 10). */
  retainedEarningsAccountId: string
}

export const CASH_SUBTYPE = 'cash'
export const BANK_SUBTYPE = 'bank'
export const ACCOUNTS_RECEIVABLE_SUBTYPE = 'accounts_receivable'
export const ACCOUNTS_PAYABLE_SUBTYPE = 'accounts_payable'
export const RETAINED_EARNINGS_SUBTYPE = 'retained_earnings'

function resolveAccountRoleIds(accounts: Account[], subTypes: string[], legacyNames: string[], roleLabel: string): string[] {
  const bySubType = accounts.filter((a) => a.subType !== undefined && subTypes.includes(a.subType)).map((a) => a.id)
  if (bySubType.length > 0) return bySubType

  const byLegacyName = accounts.filter((a) => legacyNames.includes(a.name)).map((a) => a.id)
  if (byLegacyName.length > 0) return byLegacyName

  throw new Error(
    `No account found for role "${roleLabel}" — set Account.subType to one of [${subTypes.join(', ')}], or name the account one of [${legacyNames.join(', ')}]`,
  )
}

/**
 * Resolves the single Retained Earnings account by the same
 * subType-first-then-legacy-name strategy as the other roles above. This
 * is independent of resolveControlAccounts() — it must not require every
 * *other* legacy-named control account to also be present, which reusing
 * resolveControlAccounts() here would have wrongly enforced.
 */
export function resolveRetainedEarningsAccountId(accounts: Account[]): string {
  return resolveAccountRoleIds(accounts, [RETAINED_EARNINGS_SUBTYPE], ['Retained Earnings'], 'Retained Earnings')[0]
}

export function resolveControlAccountGroups(accounts: Account[]): ControlAccountGroups {
  return {
    cashAccountIds: resolveAccountRoleIds(accounts, [CASH_SUBTYPE], ['Cash'], 'Cash'),
    bankAccountIds: resolveAccountRoleIds(accounts, [BANK_SUBTYPE], ['Bank'], 'Bank'),
    accountsReceivableIds: resolveAccountRoleIds(accounts, [ACCOUNTS_RECEIVABLE_SUBTYPE], ['Accounts Receivable'], 'Accounts Receivable'),
    accountsPayableIds: resolveAccountRoleIds(accounts, [ACCOUNTS_PAYABLE_SUBTYPE], ['Accounts Payable'], 'Accounts Payable'),
    retainedEarningsAccountId: resolveRetainedEarningsAccountId(accounts),
  }
}
