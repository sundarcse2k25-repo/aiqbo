import { describe, it, expect } from 'vitest'
import { DummyDataProvider } from '../dummy.provider'
import { profitAndLossService } from '../../services/profitAndLoss.service'
import type { DataProvider } from '../../types/reporting.contracts'
import type { Transaction } from '@/types/accounting.types'

describe('DummyDataProvider', () => {
  const provider = new DummyDataProvider()

  it('retrieves all transactions when no filter is provided', () => {
    const transactions = provider.getTransactions()
    expect(transactions.length).toBe(29)
  })

  it('filters transactions by date range', () => {
    const janTxns = provider.getTransactions({
      fromDate: '2026-01-01',
      toDate: '2026-01-31',
    })
    expect(janTxns.length).toBe(7)
    janTxns.forEach((t) => {
      expect(t.date >= '2026-01-01' && t.date <= '2026-01-31').toBe(true)
    })
  })

  it('retrieves chart of accounts', () => {
    const accounts = provider.getAccounts()
    expect(accounts.length).toBe(12)
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

describe('ReportService with Custom Mock DataProvider (Demonstrating Swapability)', () => {
  it('generates P&L using a mock DataProvider without changing reporting logic', async () => {
    const mockTransactions: Transaction[] = [
      {
        id: 'MOCK-REV',
        date: '2026-05-10',
        accountId: 'ACC-SALES',
        accountType: 'revenue',
        description: 'Direct sales',
        amount: 100000,
        type: 'credit',
      },
      {
        id: 'MOCK-COGS',
        date: '2026-05-12',
        accountId: 'ACC-COGS',
        accountType: 'cogs',
        description: 'Materials',
        amount: 40000,
        type: 'debit',
      },
      {
        id: 'MOCK-EXP',
        date: '2026-05-15',
        accountId: 'ACC-EXP',
        accountType: 'expense',
        description: 'Rent',
        amount: 20000,
        type: 'debit',
      },
    ]

    // A custom provider (e.g. simulating a QBO or API provider)
    const customProvider: DataProvider = {
      getTransactions: (filter) => {
        if (filter?.fromDate && filter?.toDate) {
          return mockTransactions.filter(
            (t) => t.date >= filter.fromDate! && t.date <= filter.toDate!,
          )
        }
        return mockTransactions
      },
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
