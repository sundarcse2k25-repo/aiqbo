import { describe, it, expect } from 'vitest'
import { generateBalanceSheet, calculateLedgerDerivedBalances } from '../balanceSheet.service'
import { invoicesToJournalEntries, billsToJournalEntries, paymentsToJournalEntries } from '@/data/dummy/journalEntries'
import { resolveControlAccounts } from '../../utils/controlAccounts'
import type { Account, Invoice, Bill, Payment, JournalEntry } from '@/types/accounting.types'

describe('BalanceSheetService', () => {
  const accounts: Account[] = [
    { id: 'ACC-REV-001', name: 'Sales Revenue', type: 'revenue' },
    { id: 'ACC-EXP-001', name: 'Rent Expense', type: 'expense' },
    { id: 'ACC-AST-001', name: 'Cash', type: 'asset' },
    { id: 'ACC-AST-002', name: 'Bank', type: 'asset' },
    { id: 'ACC-AST-003', name: 'Accounts Receivable', type: 'asset' },
    { id: 'ACC-LIA-001', name: 'Accounts Payable', type: 'liability' },
    { id: 'ACC-EQU-001', name: 'Retained Earnings', type: 'equity' },
  ]
  const accountMap = new Map(accounts.map((a) => [a.id, a]))
  const controlAccounts = resolveControlAccounts(accounts)

  const invoices: Invoice[] = [
    {
      id: 'INV-1',
      customerId: 'CUST-1',
      date: '2026-01-10',
      dueDate: '2026-02-10',
      status: 'paid',
      lines: [{ id: 'L1', accountId: 'ACC-REV-001', description: 'Consulting', quantity: 1, unitPrice: 100000, amount: 100000 }],
      totalAmount: 100000,
    },
    {
      id: 'INV-2',
      customerId: 'CUST-2',
      date: '2026-01-20',
      dueDate: '2026-02-20',
      status: 'sent', // unpaid -> AR
      lines: [{ id: 'L2', accountId: 'ACC-REV-001', description: 'Support', quantity: 1, unitPrice: 50000, amount: 50000 }],
      totalAmount: 50000,
    },
  ]

  const bills: Bill[] = [
    {
      id: 'BILL-1',
      vendorId: 'VEND-1',
      date: '2026-01-05',
      dueDate: '2026-02-05',
      status: 'paid',
      lines: [{ id: 'BL1', accountId: 'ACC-EXP-001', description: 'Rent', quantity: 1, unitPrice: 20000, amount: 20000 }],
      totalAmount: 20000,
    },
    {
      id: 'BILL-2',
      vendorId: 'VEND-2',
      date: '2026-01-15',
      dueDate: '2026-02-15',
      status: 'received', // unpaid -> AP
      lines: [{ id: 'BL2', accountId: 'ACC-EXP-001', description: 'Electricity', quantity: 1, unitPrice: 10000, amount: 10000 }],
      totalAmount: 10000,
    },
  ]

  const payments: Payment[] = [
    { id: 'PAY-1', type: 'invoice', referenceId: 'INV-1', date: '2026-01-12', amount: 100000, method: 'bank_transfer' },
    { id: 'PAY-2', type: 'bill', referenceId: 'BILL-1', date: '2026-01-06', amount: 20000, method: 'bank_transfer' },
  ]

  const journalEntries = [
    ...invoicesToJournalEntries(invoices, accountMap, controlAccounts),
    ...billsToJournalEntries(bills, accountMap, controlAccounts),
    ...paymentsToJournalEntries(payments, accountMap, controlAccounts),
  ]

  it('calculates balanced balance sheet (Assets = Liabilities + Equity)', () => {
    const report = generateBalanceSheet(journalEntries, accounts, '2026-01-31')

    expect(report.reportType).toBe('BALANCE_SHEET')

    // AR = 50,000 (INV-2, unpaid)
    const arItem = report.currentAssets.items.find((i) => i.accountId === 'ACC-AST-003')
    expect(arItem?.amount).toBe(50000)

    // AP = 10,000 (BILL-2, unpaid)
    const apItem = report.currentLiabilities.items.find((i) => i.accountId === 'ACC-LIA-001')
    expect(apItem?.amount).toBe(10000)

    // Cash = 0 (no cash-method payments), Bank = 100k received - 20k paid = 80,000
    const cashItem = report.currentAssets.items.find((i) => i.accountId === 'ACC-AST-001')
    const bankItem = report.currentAssets.items.find((i) => i.accountId === 'ACC-AST-002')
    expect(cashItem?.amount).toBe(0)
    expect(bankItem?.amount).toBe(80000)

    // Net Profit = (100k + 50k) - (20k + 10k) = 120k -> Retained Earnings
    expect(report.retainedEarnings).toBe(120000)

    // Total Assets = Cash 0 + Bank 80k + AR 50k = 130k
    expect(report.totalAssets).toBe(130000)

    // Total Liab & Equity = AP 10k + Equity 120k = 130k
    expect(report.totalLiabilitiesAndEquity).toBe(130000)
    expect(report.isBalanced).toBe(true)
  })

  it('ledger-derived balances match the balance sheet line items directly', () => {
    const ledger = calculateLedgerDerivedBalances(journalEntries, controlAccounts, '2026-01-31')
    expect(ledger.accountsReceivable).toBe(50000)
    expect(ledger.accountsPayable).toBe(10000)
    expect(ledger.cash).toBe(0)
    expect(ledger.bank).toBe(80000)
  })
})

// ---------------------------------------------------------------------------
// Generic account-based grouping (QBO-readiness migration)
//
// These tests use hand-built fixtures — the production dummy dataset is
// never touched — to prove the Balance Sheet groups accounts by
// accountType/subType rather than by exact name, and that it is no longer
// limited to exactly one Cash/Bank/AR/AP account.
// ---------------------------------------------------------------------------

/** Builds one balanced two-line 'journal' entry: DEBIT one account, CREDIT another. */
function je(id: string, date: string, debitAccount: Account, creditAccount: Account, amount: number): JournalEntry {
  return {
    id,
    date,
    description: id,
    sourceType: 'journal',
    sourceId: id,
    lines: [
      { id: `${id}-DR`, accountId: debitAccount.id, accountType: debitAccount.type, debit: amount, credit: 0, description: id },
      { id: `${id}-CR`, accountId: creditAccount.id, accountType: creditAccount.type, debit: 0, credit: amount, description: id },
    ],
  }
}

/** Independent reference: sums raw journal entry lines for one account, without touching balanceSheet.service.ts. */
function independentLedgerBalance(entries: JournalEntry[], accountId: string, isDebitNormal: boolean, asOfDate: string): number {
  let balance = 0
  for (const entry of entries) {
    if (entry.date > asOfDate) continue
    for (const line of entry.lines) {
      if (line.accountId !== accountId) continue
      balance += isDebitNormal ? line.debit - line.credit : line.credit - line.debit
    }
  }
  return balance
}

describe('BalanceSheetService — generic account-based grouping', () => {
  const AS_OF = '2026-06-30'

  // A minimal control-account set is always required (retainedEarningsAccountId
  // is still used, narrowly, to identify which equity account gets the
  // P&L-derived synthesis — see balanceSheet.service.ts).
  const baseControlAccounts: Account[] = [
    { id: 'ACC-AR-BASE', name: 'Accounts Receivable', type: 'asset', subType: 'current' },
    { id: 'ACC-AP-BASE', name: 'Accounts Payable', type: 'liability', subType: 'current' },
    { id: 'ACC-CASH-BASE', name: 'Cash', type: 'asset', subType: 'current' },
    { id: 'ACC-BANK-BASE', name: 'Bank', type: 'asset', subType: 'current' },
    { id: 'ACC-RE-BASE', name: 'Retained Earnings', type: 'equity' },
  ]

  it('Test 2 — multiple bank accounts are all included, none collapsed into one', () => {
    const bankA: Account = { id: 'BANK-A', name: 'PNC Bank', type: 'asset', subType: 'current' }
    const bankB: Account = { id: 'BANK-B', name: 'Signature Bank', type: 'asset', subType: 'current' }
    const bankC: Account = { id: 'BANK-C', name: 'PayPal Account', type: 'asset', subType: 'current' }
    const cash: Account = { id: 'CASH-A', name: 'Petty Cash', type: 'asset', subType: 'current' }
    const equity: Account = { id: 'EQU-A', name: 'Owner Equity', type: 'equity' }
    const accounts = [...baseControlAccounts, bankA, bankB, bankC, cash, equity]

    const entries = [
      je('JE-1', '2026-06-01', bankA, equity, 233454.98),
      je('JE-2', '2026-06-01', bankB, equity, 157285.89),
      // bankC and cash intentionally have no postings -> $0, but must still appear as line items
    ]

    const report = generateBalanceSheet(entries, accounts, AS_OF)

    const bankAItem = report.currentAssets.items.find((i) => i.accountId === 'BANK-A')
    const bankBItem = report.currentAssets.items.find((i) => i.accountId === 'BANK-B')
    const bankCItem = report.currentAssets.items.find((i) => i.accountId === 'BANK-C')
    const cashItem = report.currentAssets.items.find((i) => i.accountId === 'CASH-A')

    expect(bankAItem?.amount).toBe(233454.98)
    expect(bankBItem?.amount).toBe(157285.89)
    expect(bankCItem?.amount).toBe(0) // still individually present, not dropped
    expect(cashItem?.amount).toBe(0)
    expect(report.currentAssets.total).toBe(233454.98 + 157285.89)
  })

  it('Test 3 — Current Asset, Fixed Asset, Accumulated Depreciation, and Other Asset are all classified and included', () => {
    const currentAsset: Account = { id: 'CA-1', name: 'Accounts Receivable - Trade', type: 'asset', subType: 'current' }
    const fixedAsset: Account = { id: 'FA-1', name: 'Computers', type: 'asset', subType: 'fixed' }
    const accumDep: Account = { id: 'FA-2', name: 'Accumulated Depreciation - Computers', type: 'asset', subType: 'fixed' }
    const otherAsset: Account = { id: 'OA-1', name: 'Security Deposits', type: 'asset', subType: 'other' }
    const equity: Account = { id: 'EQU-1', name: 'Owner Equity', type: 'equity' }
    const accounts = [...baseControlAccounts, currentAsset, fixedAsset, accumDep, otherAsset, equity]

    const entries = [
      je('JE-CA', '2026-06-01', currentAsset, equity, 40000),
      je('JE-FA', '2026-06-01', fixedAsset, equity, 25367.40),
      je('JE-DEP', '2026-06-15', equity, accumDep, 9737.60), // depreciation: credit-side posting to the contra account
      je('JE-OA', '2026-06-01', otherAsset, equity, 50000),
    ]

    const report = generateBalanceSheet(entries, accounts, AS_OF)

    expect(report.currentAssets.items.find((i) => i.accountId === 'CA-1')?.amount).toBe(40000)
    expect(report.fixedAssets.items.find((i) => i.accountId === 'FA-1')?.amount).toBe(25367.40)
    expect(report.fixedAssets.items.find((i) => i.accountId === 'FA-2')?.amount).toBe(-9737.60) // contra, negative
    expect(report.fixedAssets.total).toBeCloseTo(25367.40 - 9737.60, 5)
    expect(report.otherAssets.items.find((i) => i.accountId === 'OA-1')?.amount).toBe(50000)
  })

  it('Test 4 — AP, Credit Card, Payroll Liability, and Long-term Liability are all classified and included', () => {
    const ap: Account = { id: 'AP-1', name: 'Accounts Payable Trade', type: 'liability', subType: 'current' }
    const creditCard: Account = { id: 'CC-1', name: 'Corporate Credit Card', type: 'liability', subType: 'current' }
    const payroll: Account = { id: 'PL-1', name: 'Federal Payroll Taxes', type: 'liability', subType: 'current' }
    const longTerm: Account = { id: 'LT-1', name: 'Long Term Note Payable', type: 'liability', subType: 'long_term' }
    const asset: Account = { id: 'AST-1', name: 'Cash', type: 'asset', subType: 'current' }
    const accounts = [...baseControlAccounts, ap, creditCard, payroll, longTerm, asset]

    const entries = [
      je('JE-AP', '2026-06-01', asset, ap, 5000),
      je('JE-CC', '2026-06-01', asset, creditCard, 1200),
      je('JE-PL', '2026-06-01', asset, payroll, 800),
      je('JE-LT', '2026-06-01', asset, longTerm, 20000),
    ]

    const report = generateBalanceSheet(entries, accounts, AS_OF)

    expect(report.currentLiabilities.items.find((i) => i.accountId === 'AP-1')?.amount).toBe(5000)
    expect(report.currentLiabilities.items.find((i) => i.accountId === 'CC-1')?.amount).toBe(1200)
    expect(report.currentLiabilities.items.find((i) => i.accountId === 'PL-1')?.amount).toBe(800)
    expect(report.currentLiabilities.total).toBe(5000 + 1200 + 800)
    expect(report.longTermLiabilities.items.find((i) => i.accountId === 'LT-1')?.amount).toBe(20000)
    expect(report.totalLiabilities).toBe(5000 + 1200 + 800 + 20000)
  })

  it('Test 5 — multiple equity accounts are all included, and negative equity balances stay negative', () => {
    const commonStock: Account = { id: 'EQ-1', name: 'Common Stock', type: 'equity' }
    const treasuryStock: Account = { id: 'EQ-2', name: 'Treasury Stock', type: 'equity' }
    const apic: Account = { id: 'EQ-3', name: 'Additional Paid-in Capital', type: 'equity' }
    const dividends: Account = { id: 'EQ-4', name: 'Dividends Declared', type: 'equity' }
    const retainedEarnings: Account = { id: 'ACC-RE-BASE', name: 'Retained Earnings', type: 'equity' }
    const asset: Account = { id: 'AST-2', name: 'Bank', type: 'asset', subType: 'current' }
    const accounts = [
      { id: 'ACC-AR-BASE', name: 'Accounts Receivable', type: 'asset' as const, subType: 'current' },
      { id: 'ACC-AP-BASE', name: 'Accounts Payable', type: 'liability' as const, subType: 'current' },
      { id: 'ACC-CASH-BASE', name: 'Cash', type: 'asset' as const, subType: 'current' },
      { id: 'ACC-BANK-BASE', name: 'Bank', type: 'asset' as const, subType: 'current' },
      retainedEarnings,
      commonStock, treasuryStock, apic, dividends, asset,
    ]

    const entries = [
      je('JE-CS', '2026-06-01', asset, commonStock, 404449),
      je('JE-TS', '2026-06-01', treasuryStock, asset, 1335038), // debit-heavy contra-equity -> negative
      je('JE-APIC', '2026-06-01', asset, apic, 26647),
      je('JE-DIV', '2026-06-01', dividends, asset, 70000), // debit-heavy contra-equity -> negative
    ]

    const report = generateBalanceSheet(entries, accounts, AS_OF)

    expect(report.equitySection.items.find((i) => i.accountId === 'EQ-1')?.amount).toBe(404449)
    expect(report.equitySection.items.find((i) => i.accountId === 'EQ-2')?.amount).toBe(-1335038)
    expect(report.equitySection.items.find((i) => i.accountId === 'EQ-3')?.amount).toBe(26647)
    expect(report.equitySection.items.find((i) => i.accountId === 'EQ-4')?.amount).toBe(-70000)
    // Retained Earnings still gets the P&L-derived synthesis (0 net profit here, no invoices/bills)
    expect(report.equitySection.items.find((i) => i.accountId === 'ACC-RE-BASE')?.amount).toBe(0)
  })

  it('Test 6 — arbitrary, real-world-shaped account names are classified by type/subtype, not by exact name', () => {
    const accounts: Account[] = [
      ...baseControlAccounts,
      { id: 'A1', name: 'PNC Operating', type: 'asset', subType: 'current' },
      { id: 'A2', name: 'Chase Checking', type: 'asset', subType: 'current' },
      { id: 'A3', name: 'Trade Receivables', type: 'asset', subType: 'current' },
      { id: 'A4', name: 'Office Equipment', type: 'asset', subType: 'fixed' },
      { id: 'A5', name: 'Accumulated Depreciation - Equipment', type: 'asset', subType: 'fixed' },
      { id: 'L1', name: 'Corporate Credit Card', type: 'liability', subType: 'current' },
      { id: 'L2', name: 'Federal Payroll Taxes', type: 'liability', subType: 'current' },
      { id: 'L3', name: 'Long Term Note', type: 'liability', subType: 'long_term' },
      { id: 'E1', name: 'Common Stock', type: 'equity' },
    ]

    // None of these account names match any string resolveControlAccounts()
    // looks for, other than the required base control accounts — proving
    // the report doesn't need exact names to classify arbitrary accounts.
    const report = generateBalanceSheet([], accounts, AS_OF)

    const allItemIds = [
      ...report.currentAssets.items,
      ...report.fixedAssets.items,
      ...report.otherAssets.items,
      ...report.currentLiabilities.items,
      ...report.longTermLiabilities.items,
      ...report.equitySection.items,
    ].map((i) => i.accountId)

    for (const id of ['A1', 'A2', 'A3', 'A4', 'A5', 'L1', 'L2', 'L3', 'E1']) {
      expect(allItemIds.includes(id)).toBe(true)
    }
    expect(report.fixedAssets.items.map((i) => i.accountId).includes('A4')).toBe(true)
    expect(report.fixedAssets.items.map((i) => i.accountId).includes('A5')).toBe(true)
    expect(report.longTermLiabilities.items.map((i) => i.accountId).includes('L3')).toBe(true)
    expect(report.currentLiabilities.items.map((i) => i.accountId).includes('L1')).toBe(true)
    expect(report.currentLiabilities.items.map((i) => i.accountId).includes('L2')).toBe(true)
  })

  it('Test 7 — contra account (asset + credit-heavy depreciation) nets correctly with no special-case logic', () => {
    const contentLibrary: Account = { id: 'FA-CL', name: 'Content Library', type: 'asset', subType: 'fixed' }
    const accumDep: Account = { id: 'FA-AD', name: 'Accumulated Depreciation - Content Library', type: 'asset', subType: 'fixed' }
    const equity: Account = { id: 'EQ-X', name: 'Owner Equity', type: 'equity' }
    const accounts = [...baseControlAccounts, contentLibrary, accumDep, equity]

    const entries = [
      je('JE-CL', '2026-01-01', contentLibrary, equity, 659028.82),
      je('JE-AD', '2026-06-01', equity, accumDep, 427709.70),
    ]

    const report = generateBalanceSheet(entries, accounts, AS_OF)
    const netFixedAssets = report.fixedAssets.items.find((i) => i.accountId === 'FA-CL')!.amount +
      report.fixedAssets.items.find((i) => i.accountId === 'FA-AD')!.amount

    expect(netFixedAssets).toBeCloseTo(231319.12, 5)
  })

  it('Test 8 — Total Assets === Total Liabilities + Total Equity, verified against an independent reconciliation, not the report calling itself', () => {
    const bankA: Account = { id: 'IB-BANK', name: 'Bank', type: 'asset', subType: 'current' }
    const fixedAsset: Account = { id: 'IB-FA', name: 'Equipment', type: 'asset', subType: 'fixed' }
    const otherAsset: Account = { id: 'IB-OA', name: 'Deposit', type: 'asset', subType: 'other' }
    const ap: Account = { id: 'IB-AP', name: 'Accounts Payable', type: 'liability', subType: 'current' }
    const longTerm: Account = { id: 'IB-LT', name: 'Note Payable', type: 'liability', subType: 'long_term' }
    const commonStock: Account = { id: 'IB-CS', name: 'Common Stock', type: 'equity' }
    const accounts = [...baseControlAccounts, bankA, fixedAsset, otherAsset, ap, longTerm, commonStock]

    const entries = [
      je('IB-1', '2026-06-01', bankA, commonStock, 500000),
      je('IB-2', '2026-06-01', fixedAsset, ap, 120000),
      je('IB-3', '2026-06-01', otherAsset, longTerm, 30000),
    ]

    const report = generateBalanceSheet(entries, accounts, AS_OF)

    // Independent reconciliation — sums raw journal lines directly, bypassing generateBalanceSheet entirely.
    const expectedAssets =
      independentLedgerBalance(entries, 'IB-BANK', true, AS_OF) +
      independentLedgerBalance(entries, 'IB-FA', true, AS_OF) +
      independentLedgerBalance(entries, 'IB-OA', true, AS_OF)
    const expectedLiabilities =
      independentLedgerBalance(entries, 'IB-AP', false, AS_OF) +
      independentLedgerBalance(entries, 'IB-LT', false, AS_OF)
    const expectedEquity = independentLedgerBalance(entries, 'IB-CS', false, AS_OF)

    expect(report.totalAssets).toBe(expectedAssets)
    expect(report.totalLiabilities + report.totalEquity).toBe(expectedLiabilities + expectedEquity)
    expect(report.totalAssets).toBe(report.totalLiabilitiesAndEquity)
    expect(report.isBalanced).toBe(true)
  })
})
