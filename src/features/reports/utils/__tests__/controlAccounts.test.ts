import { describe, it, expect } from 'vitest'
import {
  resolveControlAccounts,
  resolveControlAccountGroups,
  CASH_SUBTYPE,
  BANK_SUBTYPE,
  ACCOUNTS_RECEIVABLE_SUBTYPE,
  ACCOUNTS_PAYABLE_SUBTYPE,
} from '../controlAccounts'
import type { Account } from '@/types/accounting.types'

describe('resolveControlAccounts (legacy, single-account, exact-name)', () => {
  it('resolves each of the five control accounts by exact name', () => {
    const accounts: Account[] = [
      { id: 'A1', name: 'Cash', type: 'asset' },
      { id: 'A2', name: 'Bank', type: 'asset' },
      { id: 'A3', name: 'Accounts Receivable', type: 'asset' },
      { id: 'A4', name: 'Accounts Payable', type: 'liability' },
      { id: 'A5', name: 'Retained Earnings', type: 'equity' },
    ]
    const resolved = resolveControlAccounts(accounts)
    expect(resolved).toEqual({
      cashAccountId: 'A1',
      bankAccountId: 'A2',
      accountsReceivableId: 'A3',
      accountsPayableId: 'A4',
      retainedEarningsAccountId: 'A5',
    })
  })

  it('throws when a required account is missing', () => {
    const accounts: Account[] = [{ id: 'A1', name: 'Cash', type: 'asset' }]
    expect(() => resolveControlAccounts(accounts)).toThrow()
  })
})

describe('resolveControlAccountGroups — subType-based multi-account resolution', () => {
  it('resolves every account carrying the matching role subType, not just one', () => {
    const accounts: Account[] = [
      { id: 'BANK-1', name: 'PNC Bank', type: 'asset', subType: BANK_SUBTYPE },
      { id: 'BANK-2', name: 'Chase Checking', type: 'asset', subType: BANK_SUBTYPE },
      { id: 'CASH-1', name: 'Petty Cash', type: 'asset', subType: CASH_SUBTYPE },
      { id: 'AR-1', name: 'AR - Trade', type: 'asset', subType: ACCOUNTS_RECEIVABLE_SUBTYPE },
      { id: 'AR-2', name: 'AR - Other', type: 'asset', subType: ACCOUNTS_RECEIVABLE_SUBTYPE },
      { id: 'AP-1', name: 'AP - Vendors', type: 'liability', subType: ACCOUNTS_PAYABLE_SUBTYPE },
      { id: 'AP-2', name: 'AP - Contractors', type: 'liability', subType: ACCOUNTS_PAYABLE_SUBTYPE },
      { id: 'EQU-1', name: 'Retained Earnings', type: 'equity' },
    ]

    const groups = resolveControlAccountGroups(accounts)

    expect(groups.bankAccountIds.sort()).toEqual(['BANK-1', 'BANK-2'])
    expect(groups.cashAccountIds).toEqual(['CASH-1'])
    expect(groups.accountsReceivableIds.sort()).toEqual(['AR-1', 'AR-2'])
    expect(groups.accountsPayableIds.sort()).toEqual(['AP-1', 'AP-2'])
    expect(groups.retainedEarningsAccountId).toBe('EQU-1')
  })

  it('falls back to legacy exact-name matching when no account carries a role subType (unchanged dummy-data behavior)', () => {
    const accounts: Account[] = [
      { id: 'A1', name: 'Cash', type: 'asset' },
      { id: 'A2', name: 'Bank', type: 'asset' },
      { id: 'A3', name: 'Accounts Receivable', type: 'asset' },
      { id: 'A4', name: 'Accounts Payable', type: 'liability' },
      { id: 'A5', name: 'Retained Earnings', type: 'equity' },
    ]
    const groups = resolveControlAccountGroups(accounts)
    expect(groups).toEqual({
      cashAccountIds: ['A1'],
      bankAccountIds: ['A2'],
      accountsReceivableIds: ['A3'],
      accountsPayableIds: ['A4'],
      retainedEarningsAccountId: 'A5',
    })
  })

  it('does not silently ignore an account merely because it also carries an unrelated subType value (e.g. the Balance Sheet "current" bucket marker)', () => {
    // Mirrors the real dummy chart of accounts, which sets subType: 'current'
    // on Cash/Bank/AR for Balance Sheet bucketing — that value is not a
    // recognized role subType, so resolution must fall back to name
    // matching rather than throwing or returning nothing.
    const accounts: Account[] = [
      { id: 'A1', name: 'Cash', type: 'asset', subType: 'current' },
      { id: 'A2', name: 'Bank', type: 'asset', subType: 'current' },
      { id: 'A3', name: 'Accounts Receivable', type: 'asset', subType: 'current' },
      { id: 'A4', name: 'Accounts Payable', type: 'liability', subType: 'current' },
      { id: 'A5', name: 'Retained Earnings', type: 'equity', subType: 'retained_earnings' },
    ]
    const groups = resolveControlAccountGroups(accounts)
    expect(groups.cashAccountIds).toEqual(['A1'])
    expect(groups.bankAccountIds).toEqual(['A2'])
    expect(groups.accountsReceivableIds).toEqual(['A3'])
    expect(groups.accountsPayableIds).toEqual(['A4'])
  })

  it('throws with a descriptive error when a role cannot be resolved by either subType or name', () => {
    const accounts: Account[] = [{ id: 'A1', name: 'Something Else', type: 'asset' }]
    // Roles are resolved in order (Cash first), so the first unresolvable
    // role is the one named in the error.
    expect(() => resolveControlAccountGroups(accounts)).toThrow(/Cash/)
  })
})
