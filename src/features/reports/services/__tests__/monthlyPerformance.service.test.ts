import { describe, it, expect } from 'vitest'
import { generateMonthlyPerformanceReport, monthlyPerformanceService, generateInsights } from '../monthlyPerformance.service'
import { generateProfitAndLoss } from '../profitAndLoss.service'
import { balanceSheetService } from '../balanceSheet.service'
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

  it('Profitability chart data covers a 6-month trailing window ending at the selected month, using only real (possibly zero) periods', () => {
    // Feb 2026 selected -> trailing window is Sep 2025 .. Feb 2026. Only
    // Jan/Feb 2026 have any journal activity in this fixture; the earlier
    // months must show as real zeros, not be omitted or fabricated.
    expect(report.profitabilityChartData.length).toBe(6)
    expect(report.profitabilityChartData.map((p) => p.period)).toEqual([
      '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02',
    ])
    expect(report.profitabilityChartData[0].revenue).toBe(0)
    expect(report.profitabilityChartData[4].period).toBe('2026-01')
    expect(report.profitabilityChartData[4].revenue).toBe(100000)
    expect(report.profitabilityChartData[5].period).toBe('2026-02')
    expect(report.profitabilityChartData[5].revenue).toBe(150000)
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

  it('exposes a Financial Position section derived from the Balance Sheet, not a new calculation', () => {
    const provider = new DummyDataProvider()
    const report = monthlyPerformanceService.generateSync({ year: 2026, month: 8 }, provider)
    const independentBs = balanceSheetService.generateSync({ fromDate: '2026-01-01', toDate: '2026-08-31' }, provider)

    expect(report.financialPosition.assets.totalAssets).toBe(independentBs.totalAssets)
    expect(report.financialPosition.assets.fixedAssets).toBe(independentBs.fixedAssets.total)
    expect(report.financialPosition.assets.otherAssets).toBe(independentBs.otherAssets.total)
    expect(report.financialPosition.liabilities.totalLiabilities).toBe(independentBs.totalLiabilities)
    expect(report.financialPosition.equity.totalEquity).toBe(independentBs.totalEquity)
    expect(report.financialPosition.isBalanced).toBe(true)
  })

  it('exposes a Debt & Coverage section that never reclassifies Accounts Payable as debt', () => {
    const provider = new DummyDataProvider()
    const report = monthlyPerformanceService.generateSync({ year: 2026, month: 8 }, provider)

    expect(report.debtAndCoverage.totalDebt).toBe('N/A')
    expect(report.debtAndCoverage.netDebt).toBe('N/A')
    expect(report.debtAndCoverage.debtToEquity).toBe('N/A')
    expect(report.debtAndCoverage.reason).toMatch(/interest-bearing debt/i)
  })
})

describe('MonthlyPerformanceReport — multiple Bank/AR/AP accounts (e.g. "PNC Bank" + "Chase Checking", "AR - Trade" + "AR - Other")', () => {
  // A company with 1 Cash account, 2 Bank accounts, 2 AR accounts, and 2 AP
  // accounts. Every figure below is hand-computed from the entries so this
  // is an independent reference, proving the report sums across every
  // account sharing a role rather than reading only one resolved id.
  const multiAccounts: Account[] = [
    { id: 'REV-1', name: 'Sales Revenue', type: 'revenue' },
    { id: 'COGS-1', name: 'Cost of Goods Sold', type: 'cogs' },
    { id: 'CASH-1', name: 'Petty Cash', type: 'asset', subType: 'cash' },
    { id: 'BANK-1', name: 'PNC Bank', type: 'asset', subType: 'bank' },
    { id: 'BANK-2', name: 'Chase Checking', type: 'asset', subType: 'bank' },
    { id: 'AR-1', name: 'AR - Trade', type: 'asset', subType: 'accounts_receivable' },
    { id: 'AR-2', name: 'AR - Other', type: 'asset', subType: 'accounts_receivable' },
    { id: 'AP-1', name: 'AP - Vendors', type: 'liability', subType: 'accounts_payable' },
    { id: 'AP-2', name: 'AP - Contractors', type: 'liability', subType: 'accounts_payable' },
    { id: 'EQU-1', name: 'Retained Earnings', type: 'equity' },
  ]

  // Feb 2026 activity:
  //   Invoice INV-1 (100,000) posted to AR-1; INV-2 (50,000) posted to AR-2
  //   Payment against INV-1 (100,000, full) received into BANK-1
  //   Payment against INV-2 (20,000, partial) received into BANK-2
  //   -> AR-1 balance 0, AR-2 balance 30,000  =>  total AR 30,000
  //   -> BANK-1 balance 100,000, BANK-2 balance 20,000  =>  total Bank+Cash 120,000
  //   Bill BILL-1 (10,000) posted to AP-1, unpaid
  //   Bill BILL-2 (5,000) posted to AP-2, unpaid
  //   -> total AP 15,000
  const journalEntries: JournalEntry[] = [
    {
      id: 'JE-INV-1', date: '2026-02-05', description: 'Invoice INV-1', sourceType: 'invoice', sourceId: 'INV-1',
      lines: [
        { id: 'L1', accountId: 'AR-1', accountType: 'asset', debit: 100000, credit: 0, description: 'AR-1', documentId: 'INV-1' },
        { id: 'L2', accountId: 'REV-1', accountType: 'revenue', debit: 0, credit: 100000, description: 'Revenue' },
      ],
    },
    {
      id: 'JE-INV-2', date: '2026-02-06', description: 'Invoice INV-2', sourceType: 'invoice', sourceId: 'INV-2',
      lines: [
        { id: 'L3', accountId: 'AR-2', accountType: 'asset', debit: 50000, credit: 0, description: 'AR-2', documentId: 'INV-2' },
        { id: 'L4', accountId: 'REV-1', accountType: 'revenue', debit: 0, credit: 50000, description: 'Revenue' },
      ],
    },
    {
      id: 'JE-PAY-1', date: '2026-02-10', description: 'Payment for INV-1', sourceType: 'payment', sourceId: 'PAY-1',
      lines: [
        { id: 'L5', accountId: 'BANK-1', accountType: 'asset', debit: 100000, credit: 0, description: 'Bank', documentId: 'INV-1' },
        { id: 'L6', accountId: 'AR-1', accountType: 'asset', debit: 0, credit: 100000, description: 'AR-1', documentId: 'INV-1' },
      ],
    },
    {
      id: 'JE-PAY-2', date: '2026-02-12', description: 'Partial payment for INV-2', sourceType: 'payment', sourceId: 'PAY-2',
      lines: [
        { id: 'L7', accountId: 'BANK-2', accountType: 'asset', debit: 20000, credit: 0, description: 'Bank', documentId: 'INV-2' },
        { id: 'L8', accountId: 'AR-2', accountType: 'asset', debit: 0, credit: 20000, description: 'AR-2', documentId: 'INV-2' },
      ],
    },
    {
      id: 'JE-BILL-1', date: '2026-02-01', description: 'Bill BILL-1', sourceType: 'bill', sourceId: 'BILL-1',
      lines: [
        { id: 'L9', accountId: 'COGS-1', accountType: 'cogs', debit: 10000, credit: 0, description: 'COGS' },
        { id: 'L10', accountId: 'AP-1', accountType: 'liability', debit: 0, credit: 10000, description: 'AP-1', documentId: 'BILL-1' },
      ],
    },
    {
      id: 'JE-BILL-2', date: '2026-02-03', description: 'Bill BILL-2', sourceType: 'bill', sourceId: 'BILL-2',
      lines: [
        { id: 'L11', accountId: 'COGS-1', accountType: 'cogs', debit: 5000, credit: 0, description: 'COGS' },
        { id: 'L12', accountId: 'AP-2', accountType: 'liability', debit: 0, credit: 5000, description: 'AP-2', documentId: 'BILL-2' },
      ],
    },
  ]

  it('sums Accounts Receivable across every AR account instead of reading only one', () => {
    const report = generateMonthlyPerformanceReport(2026, 2, journalEntries, multiAccounts, [], [])
    expect(report.financials.accountsReceivable).toBe(30000) // AR-1 (0) + AR-2 (30,000)
  })

  it('sums Accounts Payable across every AP account instead of reading only one', () => {
    const report = generateMonthlyPerformanceReport(2026, 2, journalEntries, multiAccounts, [], [])
    expect(report.financials.accountsPayable).toBe(15000) // AP-1 (10,000) + AP-2 (5,000)
  })

  it('sums Cash + Bank across every Bank account for Operating Cash Flow', () => {
    const report = generateMonthlyPerformanceReport(2026, 2, journalEntries, multiAccounts, [], [])
    expect(report.cashFlow.operatingCashFlow).toBe(120000) // BANK-1 (100,000) + BANK-2 (20,000)
  })

  it('sums Cash + Bank across every Bank account for the Cash Ratio KPI', () => {
    const report = generateMonthlyPerformanceReport(2026, 2, journalEntries, multiAccounts, [], [])
    const cashRatio = report.kpis.liquidity.find((k) => k.key === 'cashRatio')!
    // (Cash 0 + Bank 120,000) / Current Liabilities 15,000 = 8
    expect(cashRatio.currentValue).toBe(8)
  })

  it('Working Capital reflects every current asset and liability account, not just the resolved single ones', () => {
    const report = generateMonthlyPerformanceReport(2026, 2, journalEntries, multiAccounts, [], [])
    const workingCapital = report.kpis.liquidity.find((k) => k.key === 'workingCapital')!
    // Current assets: Cash 0 + Bank 120,000 + AR 30,000 = 150,000; Current liabilities: AP 15,000
    expect(workingCapital.currentValue).toBe(135000)
  })
})

describe('generateInsights', () => {
  const allUnavailable = {
    revenueGrowth: 'N/A' as const,
    netMarginCurrent: 'N/A' as const,
    netMarginPrevious: 'N/A' as const,
    cccCurrent: 'N/A' as const,
    cccPrevious: 'N/A' as const,
    roceCurrent: 'N/A' as const,
    rocePrevious: 'N/A' as const,
    freeCashFlow: 'N/A' as const,
    netDebtCurrent: 'N/A' as const,
    netDebtPrevious: 'N/A' as const,
  }

  it('produces no insight for a metric that is N/A', () => {
    const insights = generateInsights(allUnavailable)
    expect(insights.length).toBe(0)
  })

  it('describes positive revenue growth', () => {
    const insights = generateInsights({ ...allUnavailable, revenueGrowth: 25 })
    expect(insights.some((i) => /Revenue increased 25\.0%/.test(i))).toBe(true)
  })

  it('describes negative revenue growth', () => {
    const insights = generateInsights({ ...allUnavailable, revenueGrowth: -92.4 })
    expect(insights.some((i) => /Revenue decreased 92\.4%/.test(i))).toBe(true)
  })

  it('describes flat revenue with no growth percentage', () => {
    const insights = generateInsights({ ...allUnavailable, revenueGrowth: 0 })
    expect(insights.some((i) => /Revenue was flat/.test(i))).toBe(true)
  })

  it('describes an improving cash conversion cycle', () => {
    const insights = generateInsights({ ...allUnavailable, cccCurrent: 1, cccPrevious: 2 })
    expect(insights.some((i) => /Cash conversion improved from 2 to 1 days/.test(i))).toBe(true)
  })

  it('describes a lengthening cash conversion cycle', () => {
    const insights = generateInsights({ ...allUnavailable, cccCurrent: 19, cccPrevious: 1 })
    expect(insights.some((i) => /lengthened from 1 to 19 days/.test(i))).toBe(true)
  })

  it('describes positive and negative free cash flow', () => {
    expect(generateInsights({ ...allUnavailable, freeCashFlow: 39476 }).some((i) => /remains positive/.test(i))).toBe(true)
    expect(generateInsights({ ...allUnavailable, freeCashFlow: -21743 }).some((i) => /negative and should be monitored/.test(i))).toBe(true)
  })

  it('describes rising and falling net debt (numerically lower net debt = "decreased", matching the Fathom sample: ($350,378) from ($327,795) is a decrease)', () => {
    expect(generateInsights({ ...allUnavailable, netDebtCurrent: -350378, netDebtPrevious: -327795 }).some((i) => /decreased/.test(i))).toBe(true)
    expect(generateInsights({ ...allUnavailable, netDebtCurrent: -211137, netDebtPrevious: -241275 }).some((i) => /increased/.test(i))).toBe(true)
  })

  it('ignores a negligible margin change to avoid noise', () => {
    const insights = generateInsights({ ...allUnavailable, netMarginCurrent: 10, netMarginPrevious: 10.01 })
    expect(insights.some((i) => /margin/.test(i))).toBe(false)
  })
})
