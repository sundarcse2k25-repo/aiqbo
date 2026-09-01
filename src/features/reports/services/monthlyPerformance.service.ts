import type { Account, JournalEntry, Invoice, Customer } from '@/types/accounting.types'
import type {
  MonthlyPerformanceReport,
  MonthlyPerformanceRequest,
  KPIResult,
  KPIExplanation,
  KPIValue,
  KPIDirection,
  KPIImportanceChartPoint,
  MonthPeriod,
  ProfitabilityChartPoint,
  CashFlowChartPoint,
} from '../types/monthlyPerformance.types'
import type { DataProvider } from '../types/reporting.contracts'
import { generateProfitAndLoss } from './profitAndLoss.service'
import { generateBalanceSheet } from './balanceSheet.service'
import { generateSalesReport } from './salesReport.service'
import { resolveControlAccountGroups } from '../utils/controlAccounts'
import {
  getMonthRange,
  getPreviousMonth,
  safeDivide,
  average,
  percentGrowth,
  determineTrend,
  trendToStatus,
  trendToAvailability,
  computeChange,
  computeChangePercentage,
} from '../utils/kpiCalculations'

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

function toPercent(value: KPIValue): KPIValue {
  return value === 'N/A' ? 'N/A' : value * 100
}

function scaleByDays(value: KPIValue, days: number): KPIValue {
  return value === 'N/A' ? 'N/A' : value * days
}

function subtract(a: KPIValue, b: KPIValue): KPIValue {
  return a === 'N/A' || b === 'N/A' ? 'N/A' : a - b
}

/**
 * Net movement (debit − credit, this being a debit-normal asset account) on
 * one control account — or every account sharing a role, e.g. all Bank
 * accounts when a company has more than one — between fromDate and toDate
 * (inclusive), derived directly from journal entry lines. This is NOT the
 * old Balance-Sheet 20/80 Cash/Bank heuristic and is NOT `paidRevenue −
 * paidBills` — it is a real sum over posted ledger lines for the exact
 * account(s) and period requested.
 */
function getNetLedgerMovement(
  journalEntries: JournalEntry[],
  accountId: string | string[],
  fromDate: string,
  toDate: string,
): number {
  const accountIds = Array.isArray(accountId) ? accountId : [accountId]
  let net = 0
  for (const entry of journalEntries) {
    if (entry.date < fromDate || entry.date > toDate) continue
    for (const line of entry.lines) {
      if (!accountIds.includes(line.accountId)) continue
      net += line.debit - line.credit
    }
  }
  return net
}

/**
 * Sums the amounts of every Balance Sheet line item whose accountId is one
 * of accountIds — i.e. the combined balance across every account playing a
 * given role (e.g. all Accounts Receivable accounts), rather than a single
 * hardcoded account.
 */
function sumAmounts(items: { accountId: string; amount: number }[], accountIds: string[]): number {
  return items.filter((i) => accountIds.includes(i.accountId)).reduce((sum, i) => sum + i.amount, 0)
}

/** How many trailing months (including the selected one) chart series cover. */
const CHART_HISTORY_MONTHS = 6

/**
 * Walks backward from the selected month, returning `count` consecutive
 * {year, month} pairs ending at (and including) the selected month, in
 * chronological order. A month with no journal activity yet still appears
 * — generateProfitAndLoss correctly returns zeros for it — so the series
 * is never padded with fabricated data, only genuinely empty real periods.
 */
function buildTrailingMonths(year: number, month: number, count: number): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = []
  let y = year
  let m = month
  for (let i = 0; i < count; i++) {
    months.unshift({ year: y, month: m })
    const prev = getPreviousMonth(y, m)
    y = prev.year
    m = prev.month
  }
  return months
}

interface InsightInputs {
  revenueGrowth: KPIValue
  netMarginCurrent: KPIValue
  netMarginPrevious: KPIValue
  cccCurrent: KPIValue
  cccPrevious: KPIValue
  roceCurrent: KPIValue
  rocePrevious: KPIValue
  freeCashFlow: KPIValue
  netDebtCurrent: KPIValue
  netDebtPrevious: KPIValue
}

/**
 * Deterministic, rule-based management insights derived only from KPI
 * values the caller already computed — no new calculation happens here,
 * and no line is ever generated for an 'N/A' metric. This is intentionally
 * simple pattern-matching (direction + a minimum-change threshold to avoid
 * noise on negligible movements), not a speculative or AI-generated
 * summary.
 */
export function generateInsights(inputs: InsightInputs): string[] {
  const insights: string[] = []

  if (inputs.revenueGrowth !== 'N/A') {
    if (inputs.revenueGrowth > 0) {
      insights.push(`Revenue increased ${inputs.revenueGrowth.toFixed(1)}% compared with the previous month.`)
    } else if (inputs.revenueGrowth < 0) {
      insights.push(`Revenue decreased ${Math.abs(inputs.revenueGrowth).toFixed(1)}% compared with the previous month.`)
    } else {
      insights.push('Revenue was flat compared with the previous month.')
    }
  }

  if (inputs.netMarginCurrent !== 'N/A' && inputs.netMarginPrevious !== 'N/A') {
    const change = inputs.netMarginCurrent - inputs.netMarginPrevious
    if (Math.abs(change) >= 0.05) {
      insights.push(
        change > 0
          ? `Net profit margin improved by ${change.toFixed(1)} percentage points, indicating improved profitability.`
          : `Net profit margin declined by ${Math.abs(change).toFixed(1)} percentage points.`,
      )
    }
  }

  if (inputs.cccCurrent !== 'N/A' && inputs.cccPrevious !== 'N/A') {
    if (inputs.cccCurrent < inputs.cccPrevious) {
      insights.push(`Cash conversion improved from ${inputs.cccPrevious.toFixed(0)} to ${inputs.cccCurrent.toFixed(0)} days.`)
    } else if (inputs.cccCurrent > inputs.cccPrevious) {
      insights.push(`Cash conversion cycle lengthened from ${inputs.cccPrevious.toFixed(0)} to ${inputs.cccCurrent.toFixed(0)} days.`)
    }
  }

  if (inputs.roceCurrent !== 'N/A' && inputs.rocePrevious !== 'N/A') {
    const change = inputs.roceCurrent - inputs.rocePrevious
    if (Math.abs(change) >= 0.5) {
      insights.push(
        change > 0
          ? 'Return on Capital Employed improved, indicating better capital efficiency.'
          : 'Return on Capital Employed declined, indicating less efficient use of capital.',
      )
    }
  }

  if (inputs.freeCashFlow !== 'N/A') {
    insights.push(inputs.freeCashFlow >= 0 ? 'Free cash flow remains positive.' : 'Free cash flow is negative and should be monitored.')
  }

  if (inputs.netDebtCurrent !== 'N/A' && inputs.netDebtPrevious !== 'N/A') {
    if (inputs.netDebtCurrent < inputs.netDebtPrevious) {
      insights.push('Net debt decreased compared with the previous month.')
    } else if (inputs.netDebtCurrent > inputs.netDebtPrevious) {
      insights.push('Net debt increased compared with the previous month.')
    }
  }

  return insights
}

function kpiRow(
  key: string,
  name: string,
  category: KPIResult['category'],
  unit: KPIResult['unit'],
  currentValue: KPIValue,
  previousValue: KPIValue,
  direction: KPIDirection,
  explanation?: string,
): KPIResult {
  const trend = determineTrend(currentValue, previousValue, direction)
  return {
    key,
    name,
    category,
    unit,
    currentValue,
    previousValue,
    change: computeChange(currentValue, previousValue),
    changePercentage: computeChangePercentage(currentValue, previousValue),
    trend,
    status: trendToStatus(trend),
    availability: trendToAvailability(currentValue, previousValue),
    ...(explanation && (currentValue === 'N/A' || previousValue === 'N/A') ? { explanation } : {}),
  }
}

const NO_DEBT_REASON =
  'The chart of accounts contains no account representing interest-bearing debt (only Accounts Payable is modeled as a liability) — there is no way to distinguish debt from ordinary trade payables in the current domain model.'
const NO_INTEREST_REASON =
  'No interest-expense account exists in the chart of accounts, so interest expense cannot be isolated from other operating expenses.'
const NO_EBITDA_REASON =
  'No Depreciation & Amortization account exists in the chart of accounts, so EBITDA cannot be reliably distinguished from Operating Profit.'
const NO_INVENTORY_REASON =
  'No Inventory account type exists in the current domain model. This is treated as a service business with no inventory to track — the value is intentionally left N/A rather than assumed to be zero for a business that might carry inventory.'
const NO_CAPEX_REASON =
  'No fixed-asset/capital-expenditure account exists in the chart of accounts. There is no way to distinguish "zero capital expenditure occurred" from "capital expenditure is simply not tracked" in the current model, so this is left N/A rather than assumed to be zero.'
const NO_VARIABLE_COST_REASON =
  'Expense accounts are not classified as fixed vs. variable in the current domain model, so a variable-cost-based cash flow figure cannot be derived.'
const OPERATING_PROFIT_NOTE =
  'Operating Profit = Net Profit in this model: the chart of accounts does not distinguish operating expenses from non-operating items (e.g. interest, tax), so there is nothing further to subtract from Net Profit.'

/**
 * Pure calculation function that produces a MonthlyPerformanceReport.
 *
 * Reuses the existing, already-validated P&L, Balance Sheet, and Sales
 * Report pure calculation functions rather than re-deriving any accounting
 * figure from JournalEntry[] directly — this report performs zero new
 * accounting calculations of its own; it only computes ratios/growth/trend
 * from numbers those services already produce.
 */
export function generateMonthlyPerformanceReport(
  year: number,
  month: number,
  journalEntries: JournalEntry[],
  accounts: Account[],
  invoices: Invoice[],
  customers: Customer[],
  periodLabel?: string,
): MonthlyPerformanceReport {
  const period = getMonthRange(year, month)
  const prevMonth = getPreviousMonth(year, month)
  const previousPeriod = getMonthRange(prevMonth.year, prevMonth.month)
  const prevPrevMonth = getPreviousMonth(previousPeriod.year, previousPeriod.month)
  const prevPrevPeriod = getMonthRange(prevPrevMonth.year, prevPrevMonth.month)

  const controlAccounts = resolveControlAccountGroups(accounts)

  // P&L for the current and previous month (flow figures).
  const pnlCurrent = generateProfitAndLoss(journalEntries, period.fromDate, period.toDate, period.label, accounts)
  const pnlPrevious = generateProfitAndLoss(journalEntries, previousPeriod.fromDate, previousPeriod.toDate, previousPeriod.label, accounts)

  // Balance Sheet snapshots (stock figures) at the start and end of both months.
  // bsPrevious doubles as "start of current month" and "end of previous month".
  const bsCurrent = generateBalanceSheet(journalEntries, accounts, period.toDate)
  const bsPrevious = generateBalanceSheet(journalEntries, accounts, previousPeriod.toDate)
  const bsPrevPrev = generateBalanceSheet(journalEntries, accounts, prevPrevPeriod.toDate)

  const cashCurrent = sumAmounts(bsCurrent.currentAssets.items, controlAccounts.cashAccountIds)
  const bankCurrent = sumAmounts(bsCurrent.currentAssets.items, controlAccounts.bankAccountIds)
  const arCurrent = sumAmounts(bsCurrent.currentAssets.items, controlAccounts.accountsReceivableIds)
  const apCurrent = sumAmounts(bsCurrent.currentLiabilities.items, controlAccounts.accountsPayableIds)
  const arPrevious = sumAmounts(bsPrevious.currentAssets.items, controlAccounts.accountsReceivableIds)
  const apPrevious = sumAmounts(bsPrevious.currentLiabilities.items, controlAccounts.accountsPayableIds)

  const capitalEmployedCurrent = bsCurrent.totalAssets - bsCurrent.totalLiabilities
  const capitalEmployedPrevious = bsPrevious.totalAssets - bsPrevious.totalLiabilities
  const capitalEmployedPrevPrev = bsPrevPrev.totalAssets - bsPrevPrev.totalLiabilities

  // Operating Profit = Net Profit in this model (see OPERATING_PROFIT_NOTE).
  const operatingProfitCurrent: KPIValue = pnlCurrent.netProfit

  // ---------------------------------------------------------------------
  // Profitability margins
  // ---------------------------------------------------------------------
  const grossMarginCurrent = toPercent(safeDivide(pnlCurrent.grossProfit, pnlCurrent.totalRevenue))
  const grossMarginPrevious = toPercent(safeDivide(pnlPrevious.grossProfit, pnlPrevious.totalRevenue))
  // Operating Profit equals pnl.netProfit exactly (see OPERATING_PROFIT_NOTE), so the
  // margin can be computed directly from the P&L figure without an N/A branch.
  const opMarginCurrent = toPercent(safeDivide(pnlCurrent.netProfit, pnlCurrent.totalRevenue))
  const opMarginPrevious = toPercent(safeDivide(pnlPrevious.netProfit, pnlPrevious.totalRevenue))
  const netMarginCurrent = toPercent(safeDivide(pnlCurrent.netProfit, pnlCurrent.totalRevenue))
  const netMarginPrevious = toPercent(safeDivide(pnlPrevious.netProfit, pnlPrevious.totalRevenue))

  // ---------------------------------------------------------------------
  // Liquidity
  // ---------------------------------------------------------------------
  const currentRatioCurrent = safeDivide(bsCurrent.currentAssets.total, bsCurrent.currentLiabilities.total)
  const currentRatioPrevious = safeDivide(bsPrevious.currentAssets.total, bsPrevious.currentLiabilities.total)
  // Quick Ratio = Current Assets − Inventory. No Inventory account exists in
  // this model, so there is nothing to subtract — Quick Ratio is therefore
  // numerically identical to Current Ratio here. This is a documented
  // consequence of the current assets composition (Cash+Bank+AR only), not
  // an assumption that a real business's inventory is zero.
  const quickRatioCurrent = currentRatioCurrent
  const quickRatioPrevious = currentRatioPrevious
  const cashRatioCurrent = safeDivide(cashCurrent + bankCurrent, bsCurrent.currentLiabilities.total)
  const cashRatioPrevious = safeDivide(
    sumAmounts(bsPrevious.currentAssets.items, controlAccounts.cashAccountIds) +
      sumAmounts(bsPrevious.currentAssets.items, controlAccounts.bankAccountIds),
    bsPrevious.currentLiabilities.total,
  )
  const workingCapitalCurrent = bsCurrent.currentAssets.total - bsCurrent.currentLiabilities.total
  const workingCapitalPrevious = bsPrevious.currentAssets.total - bsPrevious.currentLiabilities.total

  // ---------------------------------------------------------------------
  // Efficiency
  // ---------------------------------------------------------------------
  const arDaysCurrent = scaleByDays(safeDivide(average(arPrevious, arCurrent), pnlCurrent.totalRevenue), period.daysInMonth)
  const arDaysPrevious = scaleByDays(
    safeDivide(average(sumAmounts(bsPrevPrev.currentAssets.items, controlAccounts.accountsReceivableIds), arPrevious), pnlPrevious.totalRevenue),
    previousPeriod.daysInMonth,
  )
  const apDaysCurrent = scaleByDays(safeDivide(average(apPrevious, apCurrent), pnlCurrent.totalCogs), period.daysInMonth)
  const apDaysPrevious = scaleByDays(
    safeDivide(average(sumAmounts(bsPrevPrev.currentLiabilities.items, controlAccounts.accountsPayableIds), apPrevious), pnlPrevious.totalCogs),
    previousPeriod.daysInMonth,
  )
  const inventoryDays: KPIValue = 'N/A'
  const inventoryTurnover: KPIValue = 'N/A'
  // Cash Conversion Cycle for a service business: the Inventory Days term
  // is OMITTED (not treated as zero) because inventory does not apply to
  // this business model — CCC = AR Days − AP Days. This mirrors the
  // standard convention for service businesses without inventory.
  const cccCurrent = subtract(arDaysCurrent, apDaysCurrent)
  const cccPrevious = subtract(arDaysPrevious, apDaysPrevious)

  const avgTotalAssetsCurrent = average(bsPrevious.totalAssets, bsCurrent.totalAssets)
  const avgTotalAssetsPrevious = average(bsPrevPrev.totalAssets, bsPrevious.totalAssets)
  const assetTurnoverCurrent = safeDivide(pnlCurrent.totalRevenue, avgTotalAssetsCurrent)
  const assetTurnoverPrevious = safeDivide(pnlPrevious.totalRevenue, avgTotalAssetsPrevious)

  const roaCurrent = toPercent(safeDivide(pnlCurrent.netProfit, avgTotalAssetsCurrent))
  const roaPrevious = toPercent(safeDivide(pnlPrevious.netProfit, avgTotalAssetsPrevious))

  const avgCapitalEmployedCurrent = average(capitalEmployedPrevious, capitalEmployedCurrent)
  const avgCapitalEmployedPrevious = average(capitalEmployedPrevPrev, capitalEmployedPrevious)
  const roceCurrent = toPercent(safeDivide(pnlCurrent.netProfit, avgCapitalEmployedCurrent))
  const rocePrevious = toPercent(safeDivide(pnlPrevious.netProfit, avgCapitalEmployedPrevious))

  const avgEquityCurrent = average(bsPrevious.totalEquity, bsCurrent.totalEquity)
  const avgEquityPrevious = average(bsPrevPrev.totalEquity, bsPrevious.totalEquity)
  const roeCurrent = toPercent(safeDivide(pnlCurrent.netProfit, avgEquityCurrent))
  const roePrevious = toPercent(safeDivide(pnlPrevious.netProfit, avgEquityPrevious))

  // ---------------------------------------------------------------------
  // Leverage / solvency
  //
  // Debt Ratio = Total Debt / Total Assets (NOT Total Liabilities / Total
  // Assets — the two are different formulas). Since no account in the
  // chart of accounts represents interest-bearing debt distinct from
  // Accounts Payable (see NO_DEBT_REASON), Total Debt cannot be isolated,
  // so Debt Ratio is N/A here — it is NOT approximated using Total
  // Liabilities, which would silently reclassify AP as debt.
  // ---------------------------------------------------------------------
  const debtRatio: KPIValue = 'N/A'
  const debtToEquity: KPIValue = 'N/A'
  const interestCoverage: KPIValue = 'N/A'
  const dscr: KPIValue = 'N/A'
  const netDebtCurrent: KPIValue = 'N/A'
  const netDebtPrevious: KPIValue = 'N/A'

  // ---------------------------------------------------------------------
  // Growth & Cash Flow
  // ---------------------------------------------------------------------
  const revenueGrowth = percentGrowth(pnlCurrent.totalRevenue, pnlPrevious.totalRevenue)
  const grossProfitGrowth = percentGrowth(pnlCurrent.grossProfit, pnlPrevious.grossProfit)
  const ebitdaGrowth: KPIValue = 'N/A'
  const netProfitGrowth = percentGrowth(pnlCurrent.netProfit, pnlPrevious.netProfit)

  const operatingCashFlowCurrent =
    getNetLedgerMovement(journalEntries, controlAccounts.cashAccountIds, period.fromDate, period.toDate) +
    getNetLedgerMovement(journalEntries, controlAccounts.bankAccountIds, period.fromDate, period.toDate)
  const operatingCashFlowPrevious =
    getNetLedgerMovement(journalEntries, controlAccounts.cashAccountIds, previousPeriod.fromDate, previousPeriod.toDate) +
    getNetLedgerMovement(journalEntries, controlAccounts.bankAccountIds, previousPeriod.fromDate, previousPeriod.toDate)
  const capitalExpenditure: KPIValue = 'N/A'
  const freeCashFlow: KPIValue = 'N/A'

  // ---------------------------------------------------------------------
  // KPI table rows
  // ---------------------------------------------------------------------
  const profitabilityKpis: KPIResult[] = [
    kpiRow('grossProfitMargin', 'Gross Profit Margin', 'profitability', 'percentage', grossMarginCurrent, grossMarginPrevious, 'higher_is_better'),
    kpiRow('operatingProfitMargin', 'Operating Profit Margin', 'profitability', 'percentage', opMarginCurrent, opMarginPrevious, 'higher_is_better'),
    kpiRow('netProfitMargin', 'Net Profit Margin', 'profitability', 'percentage', netMarginCurrent, netMarginPrevious, 'higher_is_better'),
    kpiRow('ebitdaMargin', 'EBITDA Margin', 'profitability', 'percentage', 'N/A', 'N/A', 'higher_is_better', NO_EBITDA_REASON),
    kpiRow('roa', 'Return on Assets (ROA)', 'profitability', 'percentage', roaCurrent, roaPrevious, 'higher_is_better'),
    kpiRow('roce', 'Return on Capital Employed (ROCE)', 'profitability', 'percentage', roceCurrent, rocePrevious, 'higher_is_better'),
    kpiRow('roe', 'Return on Equity (ROE)', 'profitability', 'percentage', roeCurrent, roePrevious, 'higher_is_better'),
  ]

  const liquidityKpis: KPIResult[] = [
    kpiRow('currentRatio', 'Current Ratio', 'liquidity', 'ratio', currentRatioCurrent, currentRatioPrevious, 'higher_is_better'),
    kpiRow('quickRatio', 'Quick Ratio', 'liquidity', 'ratio', quickRatioCurrent, quickRatioPrevious, 'higher_is_better'),
    kpiRow('cashRatio', 'Cash Ratio', 'liquidity', 'ratio', cashRatioCurrent, cashRatioPrevious, 'higher_is_better'),
    kpiRow('workingCapital', 'Working Capital', 'liquidity', 'currency', workingCapitalCurrent, workingCapitalPrevious, 'higher_is_better'),
  ]

  const efficiencyKpis: KPIResult[] = [
    kpiRow('arDays', 'AR Days', 'efficiency', 'days', arDaysCurrent, arDaysPrevious, 'lower_is_better'),
    kpiRow('apDays', 'AP Days', 'efficiency', 'days', apDaysCurrent, apDaysPrevious, 'neutral'),
    kpiRow('inventoryDays', 'Inventory Days', 'efficiency', 'days', inventoryDays, inventoryDays, 'lower_is_better', NO_INVENTORY_REASON),
    kpiRow('cashConversionCycle', 'Cash Conversion Cycle', 'efficiency', 'days', cccCurrent, cccPrevious, 'lower_is_better'),
    kpiRow('inventoryTurnover', 'Inventory Turnover', 'efficiency', 'ratio', inventoryTurnover, inventoryTurnover, 'higher_is_better', NO_INVENTORY_REASON),
    kpiRow('assetTurnover', 'Asset Turnover', 'efficiency', 'ratio', assetTurnoverCurrent, assetTurnoverPrevious, 'higher_is_better'),
  ]

  const leverageKpis: KPIResult[] = [
    kpiRow('debtToEquity', 'Debt-to-Equity', 'leverage', 'ratio', debtToEquity, debtToEquity, 'lower_is_better', NO_DEBT_REASON),
    kpiRow('debtRatio', 'Debt Ratio', 'leverage', 'ratio', debtRatio, debtRatio, 'lower_is_better', NO_DEBT_REASON),
    kpiRow('interestCoverage', 'Interest Coverage', 'leverage', 'ratio', interestCoverage, interestCoverage, 'higher_is_better', NO_INTEREST_REASON),
    kpiRow('dscr', 'Debt Service Coverage Ratio', 'leverage', 'ratio', dscr, dscr, 'higher_is_better', NO_DEBT_REASON),
  ]

  const growthKpis: KPIResult[] = [
    kpiRow('revenueGrowth', 'Revenue Growth', 'growth', 'percentage', revenueGrowth, revenueGrowth, 'higher_is_better'),
    kpiRow('grossProfitGrowth', 'Gross Profit Growth', 'growth', 'percentage', grossProfitGrowth, grossProfitGrowth, 'higher_is_better'),
    kpiRow('ebitdaGrowth', 'EBITDA Growth', 'growth', 'percentage', ebitdaGrowth, ebitdaGrowth, 'higher_is_better', NO_EBITDA_REASON),
    kpiRow('netProfitGrowth', 'Net Profit Growth', 'growth', 'percentage', netProfitGrowth, netProfitGrowth, 'higher_is_better'),
    kpiRow('operatingCashFlow', 'Operating Cash Flow', 'growth', 'currency', operatingCashFlowCurrent, operatingCashFlowPrevious, 'higher_is_better'),
    kpiRow('freeCashFlow', 'Free Cash Flow', 'growth', 'currency', freeCashFlow, freeCashFlow, 'higher_is_better', NO_CAPEX_REASON),
  ]

  // ---------------------------------------------------------------------
  // KPI Importance chart data — groups every KPI in the table above by its
  // static editorial importance tier (see KPI_EXPLANATIONS). This reads
  // only the KPI keys actually produced above; it performs no calculation
  // of its own.
  // ---------------------------------------------------------------------
  const allKpiResults = [...profitabilityKpis, ...liquidityKpis, ...efficiencyKpis, ...leverageKpis, ...growthKpis]
  const kpiImportanceChartData: KPIImportanceChartPoint[] = (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((importance) => {
    const keys = allKpiResults
      .filter((kpi) => KPI_EXPLANATIONS.find((e) => e.key === kpi.key)?.importance === importance)
      .map((kpi) => kpi.key)
    return { importance, count: keys.length, keys }
  })

  // ---------------------------------------------------------------------
  // Revenue analysis (reuses SalesReportService's pure calculation as-is)
  // ---------------------------------------------------------------------
  const salesCurrent = generateSalesReport(invoices, customers, period.fromDate, period.toDate, period.label)
  const revenueAnalysis = {
    currentMonthRevenue: pnlCurrent.totalRevenue,
    previousMonthRevenue: pnlPrevious.totalRevenue,
    revenueGrowthPercent: revenueGrowth,
    byCustomer: salesCurrent.byCustomer.map((c) => ({
      customerId: c.customerId,
      customerName: c.customerName,
      amount: c.totalAmount,
      percentageOfTotal: c.percentageOfTotal,
    })),
  }

  // ---------------------------------------------------------------------
  // Multi-month chart series (Section 4 / 10 / 12) — walks back up to
  // CHART_HISTORY_MONTHS real months from the selected month, computed
  // independently of the current/previous-month KPI values above so this
  // has no effect on any existing KPI. A month with no journal activity
  // yet correctly shows as zero (a real answer), never fabricated.
  // ---------------------------------------------------------------------
  const chartMonths = buildTrailingMonths(year, month, CHART_HISTORY_MONTHS)
  const profitabilityChartData: ProfitabilityChartPoint[] = chartMonths.map((m) => {
    const range = getMonthRange(m.year, m.month)
    const pnl = generateProfitAndLoss(journalEntries, range.fromDate, range.toDate, range.label, accounts)
    return {
      period: `${m.year}-${String(m.month).padStart(2, '0')}`,
      revenue: pnl.totalRevenue,
      grossProfit: pnl.grossProfit,
      operatingProfit: pnl.netProfit,
      netProfit: pnl.netProfit,
    }
  })
  const cashFlowChartData: CashFlowChartPoint[] = chartMonths.map((m) => {
    const range = getMonthRange(m.year, m.month)
    const ocf =
      getNetLedgerMovement(journalEntries, controlAccounts.cashAccountIds, range.fromDate, range.toDate) +
      getNetLedgerMovement(journalEntries, controlAccounts.bankAccountIds, range.fromDate, range.toDate)
    return { period: `${m.year}-${String(m.month).padStart(2, '0')}`, operatingCashFlow: ocf, freeCashFlow: 'N/A' }
  })

  // ---------------------------------------------------------------------
  // Financial Position (Section 11) — presentational grouping of the
  // Balance Sheet's own sections; performs no calculation of its own.
  // ---------------------------------------------------------------------
  const financialPosition = {
    assets: {
      currentAssets: bsCurrent.currentAssets.total,
      fixedAssets: bsCurrent.fixedAssets.total,
      otherAssets: bsCurrent.otherAssets.total,
      totalAssets: bsCurrent.totalAssets,
    },
    liabilities: {
      currentLiabilities: bsCurrent.currentLiabilities.total,
      longTermLiabilities: bsCurrent.longTermLiabilities.total,
      totalLiabilities: bsCurrent.totalLiabilities,
    },
    equity: {
      totalEquity: bsCurrent.totalEquity,
      retainedEarnings: bsCurrent.retainedEarnings,
    },
    isBalanced: bsCurrent.isBalanced,
  }

  // ---------------------------------------------------------------------
  // Debt & Coverage (Section 12) — groups the already-computed leverage
  // KPIs into the shape a management report presents; Accounts Payable is
  // never reclassified as debt (see NO_DEBT_REASON).
  // ---------------------------------------------------------------------
  const debtAndCoverage = {
    totalDebt: 'N/A' as KPIValue,
    cash: cashCurrent + bankCurrent,
    netDebt: netDebtCurrent,
    debtToEquity,
    debtRatio,
    interestExpense: 'N/A' as KPIValue,
    interestCoverage,
    dscr,
    reason: NO_DEBT_REASON,
  }

  const insights = generateInsights({
    revenueGrowth,
    netMarginCurrent,
    netMarginPrevious,
    cccCurrent,
    cccPrevious,
    roceCurrent,
    rocePrevious,
    freeCashFlow,
    netDebtCurrent,
    netDebtPrevious,
  })

  const toMonthPeriod = (p: ReturnType<typeof getMonthRange>): MonthPeriod => ({
    year: p.year,
    month: p.month,
    fromDate: p.fromDate,
    toDate: p.toDate,
    daysInMonth: p.daysInMonth,
    label: p.label,
  })

  const report: MonthlyPerformanceReport = {
    reportType: 'MONTHLY_PERFORMANCE',
    title: 'Monthly Performance Report',
    periodLabel: periodLabel || period.label,
    fromDate: period.fromDate,
    toDate: period.toDate,
    generatedAt: new Date().toISOString(),

    period: toMonthPeriod(period),
    previousPeriod: toMonthPeriod(previousPeriod),

    executiveSummary: {
      revenue: {
        currentMonthRevenue: pnlCurrent.totalRevenue,
        previousMonthRevenue: pnlPrevious.totalRevenue,
        trend: determineTrend(pnlCurrent.totalRevenue, pnlPrevious.totalRevenue, 'higher_is_better'),
        growthPercent: revenueGrowth,
      },
      profitability: {
        netProfitMargin: netMarginCurrent,
        previousNetProfitMargin: netMarginPrevious,
        trend: determineTrend(netMarginCurrent, netMarginPrevious, 'higher_is_better'),
        improvementStrategies: [
          'Increase pricing',
          'Increase sales volume',
          'Reduce cost of sales',
          'Reduce operating expenses',
        ],
      },
      activity: {
        assetTurnover: assetTurnoverCurrent,
        previousAssetTurnover: assetTurnoverPrevious,
        trend: determineTrend(assetTurnoverCurrent, assetTurnoverPrevious, 'higher_is_better'),
      },
      efficiency: {
        roce: roceCurrent,
        previousRoce: rocePrevious,
        trend: determineTrend(roceCurrent, rocePrevious, 'higher_is_better'),
        capitalEmployedDefinition: 'Capital Employed = Total Assets − Total Liabilities',
      },
      workingCapital: {
        cashConversionCycle: cccCurrent,
        previousCashConversionCycle: cccPrevious,
        trend: determineTrend(cccCurrent, cccPrevious, 'lower_is_better'),
        inventoryTreatment: 'Inventory Days is omitted (not treated as zero) — CCC = AR Days − AP Days for this service business.',
      },
      cashFlow: {
        freeCashFlow,
        reason: NO_CAPEX_REASON,
      },
      marginalCashFlow: {
        netVariableCashFlowPercent: 'N/A',
        reason: NO_VARIABLE_COST_REASON,
      },
      debt: {
        netDebt: netDebtCurrent,
        previousNetDebt: netDebtPrevious,
        trend: 'unavailable',
        reason: NO_DEBT_REASON,
      },
      coverage: {
        interestCoverageRatio: interestCoverage,
        reason: NO_INTEREST_REASON,
      },
    },

    kpis: {
      profitability: profitabilityKpis,
      liquidity: liquidityKpis,
      efficiency: efficiencyKpis,
      leverage: leverageKpis,
      growth: growthKpis,
    },

    revenueAnalysis,

    profitability: {
      revenue: pnlCurrent.totalRevenue,
      cogs: pnlCurrent.totalCogs,
      grossProfit: pnlCurrent.grossProfit,
      operatingExpenses: pnlCurrent.totalExpenses,
      operatingProfit: operatingProfitCurrent,
      netProfit: pnlCurrent.netProfit,
      grossProfitMargin: grossMarginCurrent,
      operatingProfitMargin: opMarginCurrent,
      netProfitMargin: netMarginCurrent,
      ebitdaMargin: 'N/A',
      operatingProfitNote: OPERATING_PROFIT_NOTE,
      ebitdaNote: NO_EBITDA_REASON,
    },

    profitabilityChartData,

    cashFlow: {
      operatingCashFlow: operatingCashFlowCurrent,
      operatingCashFlowNote:
        'Derived as the net ledger movement of Cash + Bank during the period. No investing/financing JournalSourceType exists in the current model (only invoice/bill/payment/credit_memo/vendor_credit/journal), so all modeled cash movement is structurally operating in nature.',
      capitalExpenditure,
      capitalExpenditureNote: NO_CAPEX_REASON,
      freeCashFlow,
      freeCashFlowNote: NO_CAPEX_REASON,
    },

    cashFlowChartData,

    financials: {
      revenue: pnlCurrent.totalRevenue,
      cogs: pnlCurrent.totalCogs,
      grossProfit: pnlCurrent.grossProfit,
      operatingExpenses: pnlCurrent.totalExpenses,
      operatingProfit: operatingProfitCurrent,
      netProfit: pnlCurrent.netProfit,
      totalAssets: bsCurrent.totalAssets,
      currentAssets: bsCurrent.currentAssets.total,
      cash: cashCurrent,
      bank: bankCurrent,
      accountsReceivable: arCurrent,
      inventory: 'N/A',
      currentLiabilities: bsCurrent.currentLiabilities.total,
      accountsPayable: apCurrent,
      debt: 'N/A',
      equity: bsCurrent.totalEquity,
    },

    kpiImportanceChartData,

    financialPosition,
    debtAndCoverage,
    insights,

    kpiExplanations: KPI_EXPLANATIONS,
  }

  return report
}

// ---------------------------------------------------------------------------
// Static KPI metadata (Step 13 / Step 6) — importance is a fixed editorial
// priority tag, not a value-based threshold system.
// ---------------------------------------------------------------------------

export const KPI_EXPLANATIONS: KPIExplanation[] = [
  { key: 'grossProfitMargin', name: 'Gross Profit Margin', category: 'profitability', formula: 'Gross Profit / Revenue × 100', description: 'The percentage of revenue retained after direct costs of goods sold.', interpretation: 'A higher margin means more of each sale is available to cover operating expenses and profit.', direction: 'higher_is_better', importance: 'HIGH', unit: 'percentage' },
  { key: 'operatingProfitMargin', name: 'Operating Profit Margin', category: 'profitability', formula: 'Operating Profit / Revenue × 100', description: 'The percentage of revenue remaining after operating expenses.', interpretation: 'Reflects core operating efficiency before financing and tax effects.', direction: 'higher_is_better', importance: 'HIGH', unit: 'percentage' },
  { key: 'netProfitMargin', name: 'Net Profit Margin', category: 'profitability', formula: 'Net Profit / Revenue × 100', description: 'The percentage of revenue that becomes bottom-line profit.', interpretation: 'The single most-watched profitability figure for overall business health.', direction: 'higher_is_better', importance: 'CRITICAL', unit: 'percentage' },
  { key: 'ebitdaMargin', name: 'EBITDA Margin', category: 'profitability', formula: 'EBITDA / Revenue × 100', description: 'Profitability before interest, tax, depreciation, and amortization.', interpretation: 'Used to compare operating performance independent of financing/accounting choices.', direction: 'higher_is_better', importance: 'MEDIUM', unit: 'percentage' },
  { key: 'roa', name: 'Return on Assets (ROA)', category: 'profitability', formula: 'Net Profit / Average Total Assets × 100', description: 'How efficiently assets are used to generate profit.', interpretation: 'A higher ROA means assets are being deployed more productively.', direction: 'higher_is_better', importance: 'MEDIUM', unit: 'percentage' },
  { key: 'roce', name: 'Return on Capital Employed (ROCE)', category: 'profitability', formula: 'Operating Profit / Average Capital Employed × 100', description: 'Return generated on the capital invested in the business.', interpretation: 'Widely used to assess whether the business is using its capital base efficiently.', direction: 'higher_is_better', importance: 'HIGH', unit: 'percentage' },
  { key: 'roe', name: 'Return on Equity (ROE)', category: 'profitability', formula: 'Net Profit / Average Equity × 100', description: "Return generated on owners' equity.", interpretation: 'A key measure for owners/investors of return on their stake in the business.', direction: 'higher_is_better', importance: 'HIGH', unit: 'percentage' },

  { key: 'currentRatio', name: 'Current Ratio', category: 'liquidity', formula: 'Current Assets / Current Liabilities', description: "Ability to cover short-term obligations with short-term assets.", interpretation: 'A ratio well below 1 signals near-term liquidity risk.', direction: 'higher_is_better', importance: 'HIGH', unit: 'ratio' },
  { key: 'quickRatio', name: 'Quick Ratio', category: 'liquidity', formula: '(Current Assets − Inventory) / Current Liabilities', description: 'A stricter liquidity test excluding inventory.', interpretation: 'A more conservative view of short-term solvency than the Current Ratio.', direction: 'higher_is_better', importance: 'MEDIUM', unit: 'ratio' },
  { key: 'cashRatio', name: 'Cash Ratio', category: 'liquidity', formula: '(Cash + Bank) / Current Liabilities', description: 'Ability to cover short-term liabilities with cash on hand alone.', interpretation: 'The most conservative liquidity measure.', direction: 'higher_is_better', importance: 'MEDIUM', unit: 'ratio' },
  { key: 'workingCapital', name: 'Working Capital', category: 'liquidity', formula: 'Current Assets − Current Liabilities', description: 'The absolute cushion of short-term assets over short-term liabilities.', interpretation: 'Negative working capital signals a near-term funding gap.', direction: 'higher_is_better', importance: 'MEDIUM', unit: 'currency' },

  { key: 'arDays', name: 'AR Days', category: 'efficiency', formula: 'Average Accounts Receivable / Revenue × Days in Month', description: 'Average time taken to collect payment from customers.', interpretation: 'Rising AR Days can signal collection problems or looser credit terms.', direction: 'lower_is_better', importance: 'HIGH', unit: 'days' },
  { key: 'apDays', name: 'AP Days', category: 'efficiency', formula: 'Average Accounts Payable / Cost of Sales × Days in Month', description: 'Average time taken to pay vendors.', interpretation: 'Direction is context-dependent: too low may strain cash, too high may strain vendor relationships.', direction: 'neutral', importance: 'MEDIUM', unit: 'days' },
  { key: 'inventoryDays', name: 'Inventory Days', category: 'efficiency', formula: 'Average Inventory / Cost of Sales × Days in Month', description: 'Average time inventory is held before sale.', interpretation: 'Not applicable to a service business with no inventory.', direction: 'lower_is_better', importance: 'LOW', unit: 'days' },
  { key: 'cashConversionCycle', name: 'Cash Conversion Cycle', category: 'efficiency', formula: 'AR Days + Inventory Days − AP Days', description: 'Time between paying for inputs and collecting cash from sales.', interpretation: 'A shorter cycle means cash is tied up for less time.', direction: 'lower_is_better', importance: 'HIGH', unit: 'days' },
  { key: 'inventoryTurnover', name: 'Inventory Turnover', category: 'efficiency', formula: 'Cost of Sales / Average Inventory', description: 'How many times inventory is sold and replaced over a period.', interpretation: 'Not applicable to a service business with no inventory.', direction: 'higher_is_better', importance: 'LOW', unit: 'ratio' },
  { key: 'assetTurnover', name: 'Asset Turnover', category: 'efficiency', formula: 'Revenue / Average Total Assets', description: 'How efficiently assets generate revenue.', interpretation: 'A higher ratio indicates more revenue generated per unit of assets.', direction: 'higher_is_better', importance: 'MEDIUM', unit: 'ratio' },

  { key: 'debtToEquity', name: 'Debt-to-Equity', category: 'leverage', formula: 'Interest-bearing Debt / Equity', description: 'Financial leverage relative to owner equity.', interpretation: 'Higher values indicate greater reliance on debt financing.', direction: 'lower_is_better', importance: 'HIGH', unit: 'ratio' },
  { key: 'debtRatio', name: 'Debt Ratio', category: 'leverage', formula: 'Total Debt / Total Assets', description: 'The proportion of assets financed by interest-bearing debt specifically (not all liabilities).', interpretation: 'A higher ratio indicates greater reliance on borrowed capital to fund assets. Not available in this model — see explanation.', direction: 'lower_is_better', importance: 'MEDIUM', unit: 'ratio' },
  { key: 'interestCoverage', name: 'Interest Coverage', category: 'leverage', formula: 'Operating Profit / Interest Expense', description: 'Ability to meet interest obligations from operating profit.', interpretation: 'Lower coverage signals higher default risk on interest-bearing debt.', direction: 'higher_is_better', importance: 'CRITICAL', unit: 'ratio' },
  { key: 'dscr', name: 'Debt Service Coverage Ratio', category: 'leverage', formula: 'Cash available for debt service / Debt service', description: 'Ability to cover total debt obligations (principal + interest) from operating cash.', interpretation: 'Below 1.0 means cash flow is insufficient to service debt.', direction: 'higher_is_better', importance: 'CRITICAL', unit: 'ratio' },

  { key: 'revenueGrowth', name: 'Revenue Growth', category: 'growth', formula: '(Current Month Revenue − Previous Month Revenue) / abs(Previous Month Revenue) × 100', description: 'Month-over-month change in revenue.', interpretation: 'Sustained negative growth is an early warning sign.', direction: 'higher_is_better', importance: 'CRITICAL', unit: 'percentage' },
  { key: 'grossProfitGrowth', name: 'Gross Profit Growth', category: 'growth', formula: '(Current − Previous) / abs(Previous) × 100', description: 'Month-over-month change in gross profit.', interpretation: 'Growth diverging from revenue growth signals a cost-structure shift.', direction: 'higher_is_better', importance: 'MEDIUM', unit: 'percentage' },
  { key: 'ebitdaGrowth', name: 'EBITDA Growth', category: 'growth', formula: '(Current − Previous) / abs(Previous) × 100', description: 'Month-over-month change in EBITDA.', interpretation: 'Not applicable — EBITDA is not currently calculable.', direction: 'higher_is_better', importance: 'MEDIUM', unit: 'percentage' },
  { key: 'netProfitGrowth', name: 'Net Profit Growth', category: 'growth', formula: '(Current − Previous) / abs(Previous) × 100', description: 'Month-over-month change in net profit.', interpretation: 'The bottom-line growth trend for the business.', direction: 'higher_is_better', importance: 'CRITICAL', unit: 'percentage' },
  { key: 'operatingCashFlow', name: 'Operating Cash Flow', category: 'growth', formula: 'Net ledger movement of Cash + Bank during the period', description: 'Cash generated or consumed by day-to-day operations.', interpretation: 'A business can be profitable on paper yet cash-flow negative — this figure tracks actual cash movement.', direction: 'higher_is_better', importance: 'CRITICAL', unit: 'currency' },
  { key: 'freeCashFlow', name: 'Free Cash Flow', category: 'growth', formula: 'Operating Cash Flow − Capital Expenditure', description: 'Cash remaining after funding operations and capital investment.', interpretation: 'Not applicable — Capital Expenditure is not currently tracked.', direction: 'higher_is_better', importance: 'HIGH', unit: 'currency' },
]

/**
 * Monthly Performance Report Service.
 *
 * Deliberately does NOT implement the shared ReportService<T> interface —
 * its request shape ({year, month}) is fundamentally different from every
 * other report's {fromDate, toDate}, per this report's own input spec.
 * Follows the same generate()/generateSync() + DataProvider pattern as
 * every other service in this codebase.
 */
export class MonthlyPerformanceService {
  async generate(request: MonthlyPerformanceRequest, provider: DataProvider): Promise<MonthlyPerformanceReport> {
    const journalEntries = await provider.getJournalEntries()
    const accounts = await provider.getAccounts()
    const invoices = await provider.getInvoices()
    const customers = await provider.getCustomers()

    return generateMonthlyPerformanceReport(request.year, request.month, journalEntries, accounts, invoices, customers, request.periodLabel)
  }

  generateSync(request: MonthlyPerformanceRequest, provider: DataProvider): MonthlyPerformanceReport {
    const journalEntries = provider.getJournalEntries() as JournalEntry[]
    const accounts = provider.getAccounts() as Account[]
    const invoices = provider.getInvoices() as Invoice[]
    const customers = provider.getCustomers() as Customer[]

    return generateMonthlyPerformanceReport(request.year, request.month, journalEntries, accounts, invoices, customers, request.periodLabel)
  }
}

export const monthlyPerformanceService = new MonthlyPerformanceService()
