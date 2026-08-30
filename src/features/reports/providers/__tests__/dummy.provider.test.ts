import { describe, it, expect } from 'vitest'
import { DummyDataProvider } from '../dummy.provider'
import { profitAndLossService } from '../../services/profitAndLoss.service'
import { balanceSheetService } from '../../services/balanceSheet.service'
import type { DataProvider } from '../../types/reporting.contracts'
import type { JournalEntry } from '@/types/accounting.types'

describe('DummyDataProvider', () => {
  const provider = new DummyDataProvider()

  it('retrieves all journal entries when no filter is provided', () => {
    // 15 non-draft invoices + 12 bills + 23 payments = 50 journal entries.
    // INV-016 (draft) correctly posts no entry.
    const journalEntries = provider.getJournalEntries()
    expect(journalEntries.length).toBe(50)
  })

  it('does not generate a journal entry for a draft invoice', () => {
    const journalEntries = provider.getJournalEntries()
    expect(journalEntries.some((e) => e.sourceId === 'INV-016')).toBe(false)
  })

  it('retrieves payments', () => {
    // 12 invoice payments + 11 bill payments
    expect(provider.getPayments().length).toBe(23)
  })

  it('filters journal entries by date range', () => {
    const janEntries = provider.getJournalEntries({
      fromDate: '2026-01-01',
      toDate: '2026-01-31',
    })
    expect(janEntries.length).toBe(9)
    janEntries.forEach((e) => {
      expect(e.date >= '2026-01-01' && e.date <= '2026-01-31').toBe(true)
    })
  })

  it('retrieves chart of accounts', () => {
    const accounts = provider.getAccounts()
    // 12 original accounts + 1 Equity account (Retained Earnings), added so
    // journal-entry generation has a real control account to resolve for
    // Balance Sheet equity — previously ACC-EQU-001 was hardcoded in
    // balanceSheet.service.ts without existing in the chart of accounts.
    expect(accounts.length).toBe(13)
  })

  it('retrieves invoices and bills', () => {
    expect(provider.getInvoices().length).toBe(16)
    expect(provider.getBills().length).toBe(12)
  })

  it('retrieves customers and vendors', () => {
    expect(provider.getCustomers().length).toBe(6)
    expect(provider.getVendors().length).toBe(6)
  })
})

describe('BalanceSheetService with real dummy data (Assets = Liabilities + Equity)', () => {
  it('balances even though the dataset includes a draft invoice', () => {
    const report = balanceSheetService.generateSync(
      { fromDate: '2026-01-01', toDate: '2026-08-31' },
      new DummyDataProvider(),
    )
    expect(report.totalAssets).toBe(report.totalLiabilitiesAndEquity)
    expect(report.isBalanced).toBe(true)
  })
})

describe('ReportService with Custom Mock DataProvider (Demonstrating Swapability)', () => {
  it('generates P&L using a mock DataProvider without changing reporting logic', async () => {
    const mockJournalEntries: JournalEntry[] = [
      {
        id: 'JE-MOCK-REV', date: '2026-05-10', description: 'Direct sales', sourceType: 'invoice', sourceId: 'MOCK-REV',
        lines: [
          { id: 'MOCK-REV-AR', accountId: 'ACC-AR', accountType: 'asset', debit: 100000, credit: 0, description: 'AR' },
          { id: 'MOCK-REV-CR', accountId: 'ACC-SALES', accountType: 'revenue', debit: 0, credit: 100000, description: 'Direct sales' },
        ],
      },
      {
        id: 'JE-MOCK-COGS', date: '2026-05-12', description: 'Materials', sourceType: 'bill', sourceId: 'MOCK-COGS',
        lines: [
          { id: 'MOCK-COGS-DR', accountId: 'ACC-COGS', accountType: 'cogs', debit: 40000, credit: 0, description: 'Materials' },
          { id: 'MOCK-COGS-AP', accountId: 'ACC-AP', accountType: 'liability', debit: 0, credit: 40000, description: 'AP' },
        ],
      },
      {
        id: 'JE-MOCK-EXP', date: '2026-05-15', description: 'Rent', sourceType: 'bill', sourceId: 'MOCK-EXP',
        lines: [
          { id: 'MOCK-EXP-DR', accountId: 'ACC-EXP', accountType: 'expense', debit: 20000, credit: 0, description: 'Rent' },
          { id: 'MOCK-EXP-AP', accountId: 'ACC-AP', accountType: 'liability', debit: 0, credit: 20000, description: 'AP' },
        ],
      },
    ]

    // A custom provider (e.g. simulating a QBO or API provider). It only
    // has journal entries to offer, demonstrating that the reporting engine
    // works against any conformant DataProvider — not just DummyDataProvider.
    const customProvider: DataProvider = {
      getJournalEntries: (filter) => {
        if (filter?.fromDate && filter?.toDate) {
          return mockJournalEntries.filter(
            (e) => e.date >= filter.fromDate! && e.date <= filter.toDate!,
          )
        }
        return mockJournalEntries
      },
      getAccounts: () => [],
      getInvoices: () => [],
      getBills: () => [],
      getCustomers: () => [],
      getVendors: () => [],
      getPayments: () => [],
    }

    const report = await profitAndLossService.generate(
      {
        fromDate: '2026-05-01',
        toDate: '2026-05-31',
        periodLabel: 'May 2026',
      },
      customProvider,
    )

    expect(report.totalRevenue).toBe(100000)
    expect(report.totalCogs).toBe(40000)
    expect(report.grossProfit).toBe(60000)
    expect(report.totalExpenses).toBe(20000)
    expect(report.netProfit).toBe(40000)
    expect(report.reportType).toBe('PROFIT_AND_LOSS')
  })
})
