import { describe, it, expect } from 'vitest'
import { generateMonthlyPerformanceReport, monthlyPerformanceService } from '../monthlyPerformance.service'
import { generateProfitAndLoss } from '../profitAndLoss.service'
import { invoicesToJournalEntries, billsToJournalEntries, paymentsToJournalEntries } from '@/data/dummy/journalEntries'
import { resolveControlAccounts } from '../../utils/controlAccounts'
import { DummyDataProvider } from '../../providers/dummy.provider'
import type { Account, Invoice, Bill, Payment, Customer, JournalEntry } from '@/types/accounting.types'

// ---------------------------------------------------------------------------
// Shared fixture: a minimal but complete chart of accounts (all 5 control
// accounts + one revenue/cogs/expense account each) so resolveControlAccounts
// never throws.
// ---------------------------------------------------------------------------
const accounts: Account[] = [
  { id: 'ACC-REV-001', name: 'Sales Revenue', type: 'revenue' },
  { id: 'ACC-COGS-001', name: 'Cost of Goods Sold', type: 'cogs' },
  { id: 'ACC-EXP-001', name: 'Operating Expense', type: 'expense' },
  { id: 'ACC-AST-001', name: 'Cash', type: 'asset' },
  { id: 'ACC-AST-002', name: 'Bank', type: 'asset' },
  { id: 'ACC-AST-003', name: 'Accounts Receivable', type: 'asset' },
  { id: 'ACC-LIA-001', name: 'Accounts Payable', type: 'liability' },
  { id: 'ACC-EQU-001', name: 'Retained Earnings', type: 'equity' },
]
const accountMap = new Map(accounts.map((a) => [a.id, a]))
const controlAccounts = resolveControlAccounts(accounts)
const customers: Customer[] = [{ id: 'CUST-1', name: 'Client A' }]

/**
 * A hand-computed two-month scenario (January + February 2026):
 *   Jan: Invoice 100,000 (fully paid 01-20), Bill/COGS 20,000 (fully paid 01-06)
 *   Feb: Invoice 150,000 (unpaid), Bill/COGS 30,000 (unpaid)
 * Every expected KPI value below was computed by hand from these figures
 * (see the PR description / conversation for the full derivation) — this is
 * an independent reference, not a comparison of the service to itself.
 */
function buildJanFebFixture(): { journalEntries: JournalEntry[]; invoices: Invoice[] } {
  const invoices: Invoice[] = [
    { id: 'INV-JAN', customerId: 'CUST-1', date: '2026-01-10', dueDate: '2026-02-10', status: 'paid', lines: [{ id: 'L1', accountId: 'ACC-REV-001', description: 'Jan sale', quantity: 1, unitPrice: 100000, amount: 100000 }], totalAmount: 100000 },
    { id: 'INV-FEB', customerId: 'CUST-1', date: '2026-02-10', dueDate: '2026-03-10', status: 'sent', lines: [{ id: 'L2', accountId: 'ACC-REV-001', description: 'Feb sale', quantity: 1, unitPrice: 150000, amount: 150000 }], totalAmount: 150000 },
  ]
  const bills: Bill[] = [
    { id: 'BILL-JAN', vendorId: 'VEND-1', date: '2026-01-05', dueDate: '2026-02-05', status: 'paid', lines: [{ id: 'BL1', accountId: 'ACC-COGS-001', description: 'Jan cost', quantity: 1, unitPrice: 20000, amount: 20000 }], totalAmount: 20000 },
    { id: 'BILL-FEB', vendorId: 'VEND-1', date: '2026-02-05', dueDate: '2026-03-05', status: 'received', lines: [{ id: 'BL2', accountId: 'ACC-COGS-001', description: 'Feb cost', quantity: 1, unitPrice: 30000, amount: 30000 }], totalAmount: 30000 },
  ]
  const payments: Payment[] = [
    { id: 'PAY-JAN-IN', type: 'invoice', referenceId: 'INV-JAN', date: '2026-01-20', amount: 100000, method: 'bank_transfer' },
    { id: 'PAY-JAN-OUT', type: 'bill', referenceId: 'BILL-JAN', date: '2026-01-06', amount: 20000, method: 'bank_transfer' },
  ]

  const journalEntries = [
    ...invoicesToJournalEntries(invoices, accountMap, controlAccounts),
    ...billsToJournalEntries(bills, accountMap, controlAccounts),
    ...paymentsToJournalEntries(payments, accountMap, controlAccounts),
  ]

  return { journalEntries, invoices }
}

describe('MonthlyPerformanceReport — Jan/Feb 2026 hand-computed scenario', () => {
  const { journalEntries, invoices } = buildJanFebFixture()
  const report = generateMonthlyPerformanceReport(2026, 2, journalEntries, accounts, invoices, customers)

  it('resolves the correct period and previous period', () => {
    expect(report.period.year).toBe(2026)
    expect(report.period.month).toBe(2)
    expect(report.period.fromDate).toBe('2026-02-01')
    expect(report.period.toDate).toBe('2026-02-28')
    expect(report.previousPeriod.year).toBe(2026)
    expect(report.previousPeriod.month).toBe(1)
    expect(report.previousPeriod.fromDate).toBe('2026-01-01')
    expect(report.previousPeriod.toDate).toBe('2026-01-31')
  })

  it('Revenue: current, previous, and growth %', () => {
    expect(report.revenueAnalysis.currentMonthRevenue).toBe(150000)
    expect(report.revenueAnalysis.previousMonthRevenue).toBe(100000)
    expect(report.revenueAnalysis.revenueGrowthPercent).toBe(50)
    expect(report.executiveSummary.revenue.trend).toBe('positive')
  })

  it('Profitability: gross/operating/net margins', () => {
    expect(report.profitability.revenue).toBe(150000)
    expect(report.profitability.cogs).toBe(30000)
    expect(report.profitability.grossProfit).toBe(120000)
    expect(report.profitability.netProfit).toBe(120000)
    expect(report.profitability.grossProfitMargin).toBe(80)
    expect(report.profitability.operatingProfitMargin).toBe(80)
    expect(report.profitability.netProfitMargin).toBe(80)
  })

  it('EBITDA Margin is N/A with a documented reason (no D&A account exists)', () => {
    expect(report.profitability.ebitdaMargin).toBe('N/A')
    const kpi = report.kpis.profitability.find((k) => k.key === 'ebitdaMargin')
    expect(kpi?.currentValue).toBe('N/A')
    expect(kpi?.explanation).toBeDefined()
  })

  it('Liquidity: current ratio, quick ratio (= current ratio, documented), cash ratio, working capital', () => {
    const currentRatio = report.kpis.liquidity.find((k) => k.key === 'currentRatio')!
    const quickRatio = report.kpis.liquidity.find((k) => k.key === 'quickRatio')!
    const cashRatio = report.kpis.liquidity.find((k) => k.key === 'cashRatio')!
    const workingCapital = report.kpis.liquidity.find((k) => k.key === 'workingCapital')!

    expect(currentRatio.currentValue).toBe(230000 / 30000)
    expect(quickRatio.currentValue).toBe(currentRatio.currentValue)
    expect(cashRatio.currentValue).toBe(80000 / 30000)
    expect(workingCapital.currentValue).toBe(200000)

    // Previous month (Jan) has zero Accounts Payable -> division by zero -> N/A, not Infinity
    expect(currentRatio.previousValue).toBe('N/A')
  })

  it('Efficiency: AR Days, AP Days, CCC (Inventory Days omitted, not zeroed)', () => {
    const arDays = report.kpis.efficiency.find((k) => k.key === 'arDays')!
    const apDays = report.kpis.efficiency.find((k) => k.key === 'apDays')!
    const ccc = report.kpis.efficiency.find((k) => k.key === 'cashConversionCycle')!

    expect(arDays.currentValue).toBe(14) // avg(0,150000)/150000*28
    expect(apDays.currentValue).toBe(14) // avg(0,30000)/30000*28
    expect(ccc.currentValue).toBe(0) // 14 - 14

    expect(arDays.previousValue).toBe(0)
    expect(apDays.previousValue).toBe(0)
  })

  it('Inventory Days / Inventory Turnover are N/A with a documented reason (service business)', () => {
    const invDays = report.kpis.efficiency.find((k) => k.key === 'inventoryDays')!
    const invTurnover = report.kpis.efficiency.find((k) => k.key === 'inventoryTurnover')!
    expect(invDays.currentValue).toBe('N/A')
    expect(invDays.explanation).toMatch(/service business/i)
    expect(invTurnover.currentValue).toBe('N/A')
  })

  it('Asset Turnover, ROA, ROCE, ROE use average balances across the two Balance Sheet snapshots', () => {
    const assetTurnover = report.kpis.efficiency.find((k) => k.key === 'assetTurnover')!
    const roa = report.kpis.profitability.find((k) => k.key === 'roa')!
    const roce = report.kpis.profitability.find((k) => k.key === 'roce')!
    const roe = report.kpis.profitability.find((k) => k.key === 'roe')!

    expect(assetTurnover.currentValue).toBe(150000 / 155000)
    expect(roa.currentValue).toBe((120000 / 155000) * 100)
    expect(roce.currentValue).toBe((120000 / 140000) * 100)
    expect(roe.currentValue).toBe((120000 / 140000) * 100)

    expect(assetTurnover.previousValue).toBe(2.5) // 100000 / avg(0, 80000)
    expect(roa.previousValue).toBe(200) // 80000 / 40000 * 100
  })

  it('Leverage: Debt Ratio, Debt-to-Equity, Interest Coverage, and DSCR are all N/A (no interest-bearing debt account exists)', () => {
    // Debt Ratio = Total Debt / Total Assets (not Total Liabilities / Total
    // Assets) — since Total Debt cannot be distinguished from Accounts
    // Payable in this model, Debt Ratio is N/A, not approximated using
    // Total Liabilities.
    const debtRatio = report.kpis.leverage.find((k) => k.key === 'debtRatio')!
    const debtToEquity = report.kpis.leverage.find((k) => k.key === 'debtToEquity')!
    const interestCoverage = report.kpis.leverage.find((k) => k.key === 'interestCoverage')!
    const dscr = report.kpis.leverage.find((k) => k.key === 'dscr')!

    expect(debtRatio.currentValue).toBe('N/A')
    expect(debtRatio.explanation).toMatch(/interest-bearing debt/i)
    expect(debtToEquity.currentValue).toBe('N/A')
    expect(debtToEquity.explanation).toMatch(/interest-bearing debt/i)
    expect(interestCoverage.currentValue).toBe('N/A')
    expect(dscr.currentValue).toBe('N/A')
  })

  it('Growth: gross profit growth and net profit growth', () => {
    const grossGrowth = report.kpis.growth.find((k) => k.key === 'grossProfitGrowth')!
    const netGrowth = report.kpis.growth.find((k) => k.key === 'netProfitGrowth')!
    expect(grossGrowth.currentValue).toBe(50)
    expect(netGrowth.currentValue).toBe(50)
  })

  it('Operating Cash Flow is derived from real ledger movement, not paidRevenue-paidBills or a 20/80 heuristic', () => {
    const ocf = report.kpis.growth.find((k) => k.key === 'operatingCashFlow')!
    // Feb has no payments posted at all -> net ledger movement is 0
    expect(ocf.currentValue).toBe(0)
    // Jan: +100000 (customer payment) - 20000 (vendor payment) = 80000
    expect(ocf.previousValue).toBe(80000)
    expect(report.cashFlow.operatingCashFlow).toBe(0)
  })

  it('Capital Expenditure and Free Cash Flow are N/A with a documented reason (no CapEx account exists)', () => {
    expect(report.cashFlow.capitalExpenditure).toBe('N/A')
    expect(report.cashFlow.freeCashFlow).toBe('N/A')
    expect(report.cashFlow.capitalExpenditureNote).toMatch(/capital.expenditure/i)
    const fcf = report.kpis.growth.find((k) => k.key === 'freeCashFlow')!
    expect(fcf.currentValue).toBe('N/A')
    expect(fcf.explanation).toBeDefined()
  })

  it('Net Variable Cash Flow % is N/A (no fixed/variable cost classification exists)', () => {
    expect(report.executiveSummary.marginalCashFlow.netVariableCashFlowPercent).toBe('N/A')
    expect(report.executiveSummary.marginalCashFlow.reason).toMatch(/variable/i)
  })

  it('Net Debt is N/A (no interest-bearing debt account exists)', () => {
    expect(report.executiveSummary.debt.netDebt).toBe('N/A')
    expect(report.executiveSummary.debt.trend).toBe('unavailable')
  })

  it('Revenue by customer breakdown reuses SalesReportService data', () => {
    expect(report.revenueAnalysis.byCustomer.length).toBe(1)
    expect(report.revenueAnalysis.byCustomer[0].customerId).toBe('CUST-1')
    expect(report.revenueAnalysis.byCustomer[0].amount).toBe(150000)
    expect(report.revenueAnalysis.byCustomer[0].percentageOfTotal).toBe(100)
  })

  it('Profitability chart data exposes two already-calculated data points (no new accounting logic)', () => {
    expect(report.profitabilityChartData.length).toBe(2)
    expect(report.profitabilityChartData[0].period).toBe('2026-01')
    expect(report.profitabilityChartData[0].revenue).toBe(100000)
    expect(report.profitabilityChartData[1].period).toBe('2026-02')
    expect(report.profitabilityChartData[1].revenue).toBe(150000)
  })

  it('KPI explanations exist for every KPI referenced in the KPI table, with importance/direction metadata', () => {
    const allKpiKeys = [
      ...report.kpis.profitability,
      ...report.kpis.liquidity,
      ...report.kpis.efficiency,
      ...report.kpis.leverage,
      ...report.kpis.growth,
    ].map((k) => k.key)

    for (const key of allKpiKeys) {
      const explanation = report.kpiExplanations.find((e) => e.key === key)
      expect(explanation).toBeDefined()
      expect(explanation?.formula).toBeDefined()
      expect(explanation?.importance).toBeDefined()
      expect(explanation?.direction).toBeDefined()
    }
  })

  it('KPIResult exposes change, changePercentage, status, and availability for a computable KPI', () => {
    const netMargin = report.kpis.profitability.find((k) => k.key === 'netProfitMargin')!
    expect(netMargin.currentValue).toBe(80)
    expect(netMargin.previousValue).toBe(80)
    expect(netMargin.change).toBe(0)
    expect(netMargin.changePercentage).toBe(0)
    expect(netMargin.trend).toBe('flat')
    expect(netMargin.status).toBe('neutral') // 'flat' trend collapses to 'neutral' status
    expect(netMargin.availability).toBe('available')
    expect(netMargin.explanation).toBeUndefined()
  })

  it('KPIResult exposes N/A change/changePercentage and unavailable status for an unsupported KPI', () => {
    const ebitda = report.kpis.profitability.find((k) => k.key === 'ebitdaMargin')!
    expect(ebitda.change).toBe('N/A')
    expect(ebitda.changePercentage).toBe('N/A')
    expect(ebitda.status).toBe('unavailable')
    expect(ebitda.availability).toBe('unavailable')
  })

  it('kpiImportanceChartData groups every KPI key by its editorial importance tier exactly once', () => {
    const allKpiKeys = [
      ...report.kpis.profitability,
      ...report.kpis.liquidity,
      ...report.kpis.efficiency,
      ...report.kpis.leverage,
      ...report.kpis.growth,
    ].map((k) => k.key)

    const chartKeys = report.kpiImportanceChartData.flatMap((p) => p.keys)
    expect(chartKeys.length).toBe(allKpiKeys.length)
    expect(new Set(chartKeys).size).toBe(new Set(allKpiKeys).size)
    for (const point of report.kpiImportanceChartData) {
      expect(point.count).toBe(point.keys.length)
    }
  })

  it('a draft invoice in the current month does not affect revenue or any KPI derived from it', () => {
    const draftInvoice: Invoice = {
      id: 'INV-DRAFT', customerId: 'CUST-1', date: '2026-02-15', dueDate: '2026-03-15', status: 'draft',
      lines: [{ id: 'LD', accountId: 'ACC-REV-001', description: 'Draft deal', quantity: 1, unitPrice: 999999, amount: 999999 }],
      totalAmount: 999999,
    }
    // Draft invoices never post a JournalEntry (see journalEntries.ts), so
    // including one in the invoices[] array passed to Sales/revenue
    // analysis must not change the reported revenue.
    const reportWithDraft = generateMonthlyPerformanceReport(2026, 2, journalEntries, accounts, [...invoices, draftInvoice], customers)
    expect(reportWithDraft.profitability.revenue).toBe(report.profitability.revenue)
    expect(reportWithDraft.revenueAnalysis.currentMonthRevenue).toBe(report.revenueAnalysis.currentMonthRevenue)
  })
})

describe('MonthlyPerformanceReport — negative and zero-value edge cases', () => {
  it('reports negative net profit and negative margins when expenses exceed revenue (no N/A, no crash)', () => {
    const invoices: Invoice[] = [
      { id: 'INV-1', customerId: 'CUST-1', date: '2026-04-10', dueDate: '2026-05-10', status: 'sent', lines: [{ id: 'L1', accountId: 'ACC-REV-001', description: 'Small sale', quantity: 1, unitPrice: 10000, amount: 10000 }], totalAmount: 10000 },
    ]
    const bills: Bill[] = [
      { id: 'BILL-1', vendorId: 'VEND-1', date: '2026-04-05', dueDate: '2026-05-05', status: 'received', lines: [{ id: 'BL1', accountId: 'ACC-EXP-001', description: 'Large expense', quantity: 1, unitPrice: 50000, amount: 50000 }], totalAmount: 50000 },
    ]
    const journalEntries = [
      ...invoicesToJournalEntries(invoices, accountMap, controlAccounts),
      ...billsToJournalEntries(bills, accountMap, controlAccounts),
    ]
    const report = generateMonthlyPerformanceReport(2026, 4, journalEntries, accounts, invoices, customers)

    expect(report.profitability.netProfit).toBe(-40000)
    expect(report.profitability.netProfitMargin).toBe(-400)
    // Working capital can legitimately be negative — must not be masked as N/A.
    const workingCapital = report.kpis.liquidity.find((k) => k.key === 'workingCapital')!
    expect(typeof workingCapital.currentValue).toBe('number')
  })

  it('does not produce Infinity or NaN anywhere in the KPI table for a fully empty dataset', () => {
    const report = generateMonthlyPerformanceReport(2026, 7, [], accounts, [], customers)
    const allKpis = [
      ...report.kpis.profitability,
      ...report.kpis.liquidity,
      ...report.kpis.efficiency,
      ...report.kpis.leverage,
      ...report.kpis.growth,
    ]
    for (const kpi of allKpis) {
      for (const value of [kpi.currentValue, kpi.previousValue, kpi.change, kpi.changePercentage]) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value)).toBe(true)
        }
      }
    }
  })
})

describe('MonthlyPerformanceReport — period boundaries', () => {
  it('January correctly rolls the previous period back to December of the prior year', () => {
    const report = generateMonthlyPerformanceReport(2026, 1, [], accounts, [], customers)
    expect(report.previousPeriod.year).toBe(2025)
    expect(report.previousPeriod.month).toBe(12)
    expect(report.previousPeriod.fromDate).toBe('2025-12-01')
    expect(report.previousPeriod.toDate).toBe('2025-12-31')
  })

  it('December resolves the previous period to November of the same year', () => {
    const report = generateMonthlyPerformanceReport(2026, 12, [], accounts, [], customers)
    expect(report.previousPeriod.year).toBe(2026)
    expect(report.previousPeriod.month).toBe(11)
  })

  it('handles zero previous revenue without a fabricated growth percentage', () => {
    // No journal entries at all -> both months have 0 revenue.
    const report = generateMonthlyPerformanceReport(2026, 3, [], accounts, [], customers)
    expect(report.revenueAnalysis.currentMonthRevenue).toBe(0)
    expect(report.revenueAnalysis.previousMonthRevenue).toBe(0)
    expect(report.revenueAnalysis.revenueGrowthPercent).toBe('N/A')
    expect(report.executiveSummary.revenue.trend).toBe('flat')
  })

  it('does not throw when the entire dataset is empty', () => {
    expect(() => generateMonthlyPerformanceReport(2026, 6, [], accounts, [], customers)).not.toThrow()
  })
})

describe('MonthlyPerformanceReport — full dummy dataset regression', () => {
  it('runs against the real DummyDataProvider without throwing and reuses P&L exactly', () => {
    const provider = new DummyDataProvider()
    const report = monthlyPerformanceService.generateSync({ year: 2026, month: 5 }, provider)

    // Cross-check against a direct call to the existing, unmodified P&L
    // pure function for the same month — proves this report reuses the
    // validated calculation rather than re-deriving it.
    const journalEntries = provider.getJournalEntries()
    const independentPnl = generateProfitAndLoss(journalEntries, '2026-05-01', '2026-05-31')

    expect(report.profitability.revenue).toBe(independentPnl.totalRevenue)
    expect(report.profitability.cogs).toBe(independentPnl.totalCogs)
    expect(report.profitability.netProfit).toBe(independentPnl.netProfit)
  })

  it('does not throw for any month across the full dummy dataset year', () => {
    const provider = new DummyDataProvider()
    for (let month = 1; month <= 12; month++) {
      expect(() => monthlyPerformanceService.generateSync({ year: 2026, month }, provider)).not.toThrow()
    }
  })
})
