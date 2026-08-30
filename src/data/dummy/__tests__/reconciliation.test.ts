import { describe, it, expect } from 'vitest'
import { DummyDataProvider } from '../../../features/reports/providers/dummy.provider'
import { profitAndLossService } from '../../../features/reports/services/profitAndLoss.service'
import { generalLedgerService } from '../../../features/reports/services/generalLedger.service'
import { balanceSheetService } from '../../../features/reports/services/balanceSheet.service'
import { salesReportService } from '../../../features/reports/services/salesReport.service'
import { expenseReportService } from '../../../features/reports/services/expenseReport.service'
import { agingReportService } from '../../../features/reports/services/agingReport.service'
import { resolveControlAccounts } from '../../../features/reports/utils/controlAccounts'

/**
 * Accounting invariants and cross-report reconciliation, run against the
 * real DummyDataProvider dataset (not a hand-built fixture). This is the
 * dataset the app actually renders, so these tests are the ones that would
 * have caught the draft-invoice Balance Sheet bug and the Sales/P&L
 * mismatch found during validation.
 */

const FULL_YEAR = { fromDate: '2026-01-01', toDate: '2026-08-31' }
const AS_OF = '2026-08-31'

describe('Accounting invariants (real dummy data)', () => {
  it('INVARIANT: Balance Sheet — Assets = Liabilities + Equity', () => {
    const provider = new DummyDataProvider()
    const bs = balanceSheetService.generateSync({ ...FULL_YEAR, toDate: AS_OF }, provider)
    expect(bs.totalAssets).toBe(bs.totalLiabilitiesAndEquity)
    expect(bs.isBalanced).toBe(true)
  })

  it('INVARIANT: P&L — Revenue - COGS - Expenses = Net Profit', () => {
    const provider = new DummyDataProvider()
    const pnl = profitAndLossService.generateSync(FULL_YEAR, provider)
    expect(pnl.totalRevenue - pnl.totalCogs - pnl.totalExpenses).toBe(pnl.netProfit)
  })

  it('INVARIANT: Draft invoices do not affect recognized revenue', () => {
    const provider = new DummyDataProvider()
    const pnl = profitAndLossService.generateSync(FULL_YEAR, provider)
    // INV-016 is a draft invoice for 200000 dated within the period. If it
    // were (incorrectly) recognized, revenue would include this amount.
    const journalEntries = provider.getJournalEntries()
    expect(journalEntries.some((e) => e.sourceId === 'INV-016')).toBe(false)
    expect(pnl.totalRevenue).toBeLessThan(4000000)
  })

  it('INVARIANT: General Ledger total debits equal total credits (double-entry, real data)', () => {
    // GeneralLedgerService now reads JournalEntry.lines natively (no
    // Transaction[] bridge), so this invariant holds for the first time on
    // real data — previously this was documented as a known limitation.
    const provider = new DummyDataProvider()
    const gl = generalLedgerService.generateSync(FULL_YEAR, provider)
    expect(gl.totalDebits).toBe(gl.totalCredits)
  })

  it('GL migration regression pin: native JournalEntry totals match the bridge-based totals verified during migration', () => {
    // Verified once during migration against journalEntriesToTransactions
    // (the retired bridge): both totalDebits and totalCredits were exactly
    // 8,703,000 for the full dummy dataset, Jan–Aug 2026. Pinned here so a
    // future change to the native GL implementation can't silently drift.
    const provider = new DummyDataProvider()
    const gl = generalLedgerService.generateSync(FULL_YEAR, provider)
    expect(gl.totalDebits).toBe(8703000)
    expect(gl.totalCredits).toBe(8703000)
  })

  it('General Ledger now includes AR, AP, Cash, and Bank account activity', () => {
    const provider = new DummyDataProvider()
    const gl = generalLedgerService.generateSync(FULL_YEAR, provider)
    const accountIds = gl.accounts.map((a) => a.accountId)
    expect(accountIds.includes('ACC-AST-003')).toBe(true) // AR
    expect(accountIds.includes('ACC-LIA-001')).toBe(true) // AP
    expect(accountIds.includes('ACC-AST-001') || accountIds.includes('ACC-AST-002')).toBe(true) // Cash/Bank
  })
})

describe('Cross-report reconciliation (real dummy data)', () => {
  it('P&L revenue reconciles with Sales Report recognized sales', () => {
    const provider = new DummyDataProvider()
    const pnl = profitAndLossService.generateSync(FULL_YEAR, provider)
    const sales = salesReportService.generateSync(FULL_YEAR, provider)
    expect(pnl.totalRevenue).toBe(sales.totalSales)
  })

  it('P&L (COGS + Expenses) reconciles with Expense Report recognized expenses', () => {
    const provider = new DummyDataProvider()
    const pnl = profitAndLossService.generateSync(FULL_YEAR, provider)
    const expenseReport = expenseReportService.generateSync(FULL_YEAR, provider)
    expect(pnl.totalCogs + pnl.totalExpenses).toBe(expenseReport.totalExpenses)
  })

  it('AR Aging total reconciles with outstanding (sent/overdue) invoices', () => {
    const provider = new DummyDataProvider()
    const invoices = provider.getInvoices()
    const expected = invoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.totalAmount, 0)

    const aging = agingReportService.generateSync(
      { ...FULL_YEAR, agingType: 'RECEIVABLES', asOfDate: AS_OF },
      provider,
    )
    expect(aging.totalOutstanding).toBe(expected)
  })

  it('AP Aging total reconciles with outstanding (received/overdue) bills', () => {
    const provider = new DummyDataProvider()
    const bills = provider.getBills()
    const expected = bills
      .filter((b) => b.status === 'received' || b.status === 'overdue')
      .reduce((sum, b) => sum + b.totalAmount, 0)

    const aging = agingReportService.generateSync(
      { ...FULL_YEAR, agingType: 'PAYABLES', asOfDate: AS_OF },
      provider,
    )
    expect(aging.totalOutstanding).toBe(expected)
  })

  // Aging migration record (status-based → ledger-based outstanding):
  //   AR total before migration: 678,000  |  AR total after migration: 678,000
  //   AP total before migration: 68,000   |  AP total after migration: 68,000
  // Unchanged because the real dummy dataset contains no partial payments —
  // every payment either fully settles its invoice/bill (payment.amount ===
  // document.totalAmount) or the document has no payment at all. The
  // status-based and ledger-based calculations are mathematically
  // equivalent on this specific dataset; they would diverge the moment a
  // partial payment exists, which the AR/AP scenario tests above prove.
  it('AR Aging total reconciles with an independent ledger-based reference calculation', () => {
    // Independent of agingReport.service.ts's own getLedgerOutstandingAmount
    // — this re-derives "invoice total − ledger-applied AR credits" from
    // scratch, directly against the raw invoices and journal entries, so
    // the Aging Report isn't just being compared to itself.
    const provider = new DummyDataProvider()
    const invoices = provider.getInvoices()
    const journalEntries = provider.getJournalEntries()
    const accounts = provider.getAccounts()
    const controlAccounts = resolveControlAccounts(accounts)

    let expectedOutstanding = 0
    for (const inv of invoices) {
      if (inv.date > AS_OF || inv.status === 'void' || inv.status === 'draft') continue
      let applied = 0
      for (const entry of journalEntries) {
        if (entry.date > AS_OF) continue
        for (const line of entry.lines) {
          if (line.accountId === controlAccounts.accountsReceivableId && line.documentId === inv.id) {
            applied += line.credit
          }
        }
      }
      const outstanding = Math.max(0, inv.totalAmount - applied)
      expectedOutstanding += outstanding
    }

    const aging = agingReportService.generateSync(
      { ...FULL_YEAR, agingType: 'RECEIVABLES', asOfDate: AS_OF },
      provider,
    )
    expect(aging.totalOutstanding).toBe(expectedOutstanding)
    expect(aging.totalOutstanding).toBe(678000) // recorded pre-migration total — unchanged (see note below)
  })

  it('AP Aging total reconciles with an independent ledger-based reference calculation', () => {
    const provider = new DummyDataProvider()
    const bills = provider.getBills()
    const journalEntries = provider.getJournalEntries()
    const accounts = provider.getAccounts()
    const controlAccounts = resolveControlAccounts(accounts)

    let expectedOutstanding = 0
    for (const bill of bills) {
      if (bill.date > AS_OF || bill.status === 'void' || bill.status === 'draft') continue
      let applied = 0
      for (const entry of journalEntries) {
        if (entry.date > AS_OF) continue
        for (const line of entry.lines) {
          if (line.accountId === controlAccounts.accountsPayableId && line.documentId === bill.id) {
            applied += line.debit
          }
        }
      }
      const outstanding = Math.max(0, bill.totalAmount - applied)
      expectedOutstanding += outstanding
    }

    const aging = agingReportService.generateSync(
      { ...FULL_YEAR, agingType: 'PAYABLES', asOfDate: AS_OF },
      provider,
    )
    expect(aging.totalOutstanding).toBe(expectedOutstanding)
    expect(aging.totalOutstanding).toBe(68000) // recorded pre-migration total — unchanged (see note below)
  })

  it('Balance Sheet accounting equation holds at multiple points in time', () => {
    const provider = new DummyDataProvider()
    for (const asOfDate of ['2026-02-28', '2026-05-31', '2026-08-31']) {
      const bs = balanceSheetService.generateSync({ fromDate: '2026-01-01', toDate: asOfDate }, provider)
      expect(bs.totalAssets).toBe(bs.totalLiabilitiesAndEquity)
    }
  })
})

describe('Balance Sheet migration regression pins (ledger-derived AR/AP/Cash/Bank)', () => {
  // These values were verified during migration to exactly match the
  // previous independent status-based calculation on the same dataset
  // (AR 678000, AP 68000, Cash+Bank combined 2213500), confirming the
  // switch to ledger-derived balances did not change any report total.
  // Cash vs Bank individually differs from the old 20/80 heuristic split
  // (all dummy payments use non-cash methods, so Cash is correctly 0 here)
  // — an intentional, approved accuracy improvement, not a regression.
  const asOfDate = '2026-08-31'

  it('AR balance is ledger-derived and matches the known-correct total', () => {
    const provider = new DummyDataProvider()
    const bs = balanceSheetService.generateSync({ fromDate: '2026-01-01', toDate: asOfDate }, provider)
    const ar = bs.currentAssets.items.find((i) => i.accountName === 'Accounts Receivable')
    expect(ar?.amount).toBe(678000)
  })

  it('AP balance is ledger-derived and matches the known-correct total', () => {
    const provider = new DummyDataProvider()
    const bs = balanceSheetService.generateSync({ fromDate: '2026-01-01', toDate: asOfDate }, provider)
    const ap = bs.currentLiabilities.items.find((i) => i.accountName === 'Accounts Payable')
    expect(ap?.amount).toBe(68000)
  })

  it('Cash and Bank balances are ledger-derived from actual payment methods', () => {
    const provider = new DummyDataProvider()
    const bs = balanceSheetService.generateSync({ fromDate: '2026-01-01', toDate: asOfDate }, provider)
    const cash = bs.currentAssets.items.find((i) => i.accountName === 'Cash')
    const bank = bs.currentAssets.items.find((i) => i.accountName === 'Bank')
    expect(cash?.amount).toBe(0)
    expect(bank?.amount).toBe(2213500)
    expect((cash?.amount || 0) + (bank?.amount || 0)).toBe(2213500)
  })
})
