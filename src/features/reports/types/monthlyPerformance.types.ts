import type { BaseReportResult } from './reporting.contracts'

/**
 * Types for the Monthly Performance Report.
 *
 * Kept in a dedicated file (not added to report.types.ts) so the existing
 * report result types are never touched by this feature.
 */

/** A KPI's numeric result, or the explicit "cannot be calculated" sentinel. */
export type KPIValue = number | 'N/A'

export type KPICategory = 'profitability' | 'liquidity' | 'efficiency' | 'leverage' | 'growth'

export type KPIDirection = 'higher_is_better' | 'lower_is_better' | 'neutral'

export type KPIUnit = 'percentage' | 'ratio' | 'days' | 'currency' | 'count'

export type TrendDirection = 'positive' | 'negative' | 'flat' | 'neutral' | 'unavailable'

/**
 * A KPI's status mirrors its trend (this report defines no independent,
 * value-based threshold system — see KPIImportance below for why). It is
 * kept as a distinct field because a KPI table consumer may want the
 * business-facing "is this good?" read (status) separate from the
 * mechanical "did this move favorably since last month?" read (trend);
 * today they are computed identically from the same direction-aware logic.
 */
export type KPIStatus = 'positive' | 'negative' | 'neutral' | 'unavailable'

export type KPIAvailability = 'available' | 'unavailable'

/**
 * Importance is an editorial classification of how central a KPI is to
 * understanding business health — it is NOT a value-based threshold rating
 * (e.g. "ROE > 20% = high"). No financial thresholds are defined anywhere
 * in this report; this is a fixed, easily-reconfigurable priority tag per
 * KPI definition, set once in KPI_EXPLANATIONS below.
 */
export type KPIImportance = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/** One row in a KPI table: current vs previous month, with trend already resolved. */
export interface KPIResult {
  key: string
  name: string
  category: KPICategory
  unit: KPIUnit
  currentValue: KPIValue
  previousValue: KPIValue
  /** currentValue − previousValue. 'N/A' if either side is 'N/A'. */
  change: KPIValue
  /** (current − previous) / abs(previous) × 100. 'N/A' if either side is 'N/A' or previous is 0. */
  changePercentage: KPIValue
  trend: TrendDirection
  status: KPIStatus
  availability: KPIAvailability
  /** Present when availability is 'unavailable': explains exactly what data is missing. */
  explanation?: string
}

/** Static metadata describing a KPI, independent of any computed value. */
export interface KPIExplanation {
  key: string
  name: string
  category: KPICategory
  formula: string
  description: string
  interpretation: string
  direction: KPIDirection
  importance: KPIImportance
  unit: KPIUnit
}

export interface MonthPeriod {
  year: number
  month: number
  fromDate: string
  toDate: string
  daysInMonth: number
  label: string
}

export interface ExecutiveSummaryRevenue {
  currentMonthRevenue: number
  previousMonthRevenue: number
  trend: TrendDirection
  growthPercent: KPIValue
}

export interface ExecutiveSummaryProfitability {
  netProfitMargin: KPIValue
  previousNetProfitMargin: KPIValue
  trend: TrendDirection
  improvementStrategies: string[]
}

export interface ExecutiveSummaryActivity {
  assetTurnover: KPIValue
  previousAssetTurnover: KPIValue
  trend: TrendDirection
}

export interface ExecutiveSummaryEfficiency {
  roce: KPIValue
  previousRoce: KPIValue
  trend: TrendDirection
  capitalEmployedDefinition: string
}

export interface ExecutiveSummaryWorkingCapital {
  cashConversionCycle: KPIValue
  previousCashConversionCycle: KPIValue
  trend: TrendDirection
  inventoryTreatment: string
}

export interface ExecutiveSummaryCashFlow {
  freeCashFlow: KPIValue
  reason?: string
}

export interface ExecutiveSummaryMarginalCashFlow {
  netVariableCashFlowPercent: KPIValue
  reason?: string
}

export interface ExecutiveSummaryDebt {
  netDebt: KPIValue
  previousNetDebt: KPIValue
  trend: TrendDirection
  reason?: string
}

export interface ExecutiveSummaryCoverage {
  interestCoverageRatio: KPIValue
  reason?: string
}

export interface ExecutiveSummary {
  revenue: ExecutiveSummaryRevenue
  profitability: ExecutiveSummaryProfitability
  activity: ExecutiveSummaryActivity
  efficiency: ExecutiveSummaryEfficiency
  workingCapital: ExecutiveSummaryWorkingCapital
  cashFlow: ExecutiveSummaryCashFlow
  marginalCashFlow: ExecutiveSummaryMarginalCashFlow
  debt: ExecutiveSummaryDebt
  coverage: ExecutiveSummaryCoverage
}

export interface RevenueByCustomer {
  customerId: string
  customerName: string
  amount: number
  percentageOfTotal: number
}

export interface RevenueAnalysis {
  currentMonthRevenue: number
  previousMonthRevenue: number
  revenueGrowthPercent: KPIValue
  byCustomer: RevenueByCustomer[]
}

export interface ProfitabilitySection {
  revenue: number
  cogs: number
  grossProfit: number
  operatingExpenses: number
  operatingProfit: KPIValue
  netProfit: number
  grossProfitMargin: KPIValue
  operatingProfitMargin: KPIValue
  netProfitMargin: KPIValue
  ebitdaMargin: KPIValue
  operatingProfitNote: string
  ebitdaNote: string
}

export interface ProfitabilityChartPoint {
  period: string
  revenue: number
  grossProfit: number
  operatingProfit: KPIValue
  netProfit: number
}

export interface CashFlowSection {
  operatingCashFlow: KPIValue
  operatingCashFlowNote: string
  capitalExpenditure: KPIValue
  capitalExpenditureNote: string
  freeCashFlow: KPIValue
  freeCashFlowNote?: string
}

export interface CashFlowChartPoint {
  period: string
  operatingCashFlow: KPIValue
  freeCashFlow: KPIValue
}

/** Chart-ready grouping of every KPI by its editorial importance tier. */
export interface KPIImportanceChartPoint {
  importance: KPIImportance
  count: number
  keys: string[]
}

/** Balance Sheet broken out into the sections a management report presents (Section 11). */
export interface FinancialPositionSection {
  assets: {
    currentAssets: number
    fixedAssets: number
    otherAssets: number
    totalAssets: number
  }
  liabilities: {
    currentLiabilities: number
    longTermLiabilities: number
    totalLiabilities: number
  }
  equity: {
    totalEquity: number
    retainedEarnings: number
  }
  isBalanced: boolean
}

/** Debt distinguished from ordinary operating liabilities (Section 12). */
export interface DebtAndCoverageSection {
  totalDebt: KPIValue
  cash: number
  netDebt: KPIValue
  debtToEquity: KPIValue
  debtRatio: KPIValue
  interestExpense: KPIValue
  interestCoverage: KPIValue
  dscr: KPIValue
  reason: string
}

export interface FinancialsSnapshot {
  revenue: number
  cogs: number
  grossProfit: number
  operatingExpenses: number
  operatingProfit: KPIValue
  netProfit: number
  totalAssets: number
  currentAssets: number
  cash: number
  bank: number
  accountsReceivable: number
  inventory: KPIValue
  currentLiabilities: number
  accountsPayable: number
  debt: KPIValue
  equity: number
}

export interface MonthlyPerformanceReport extends BaseReportResult {
  period: MonthPeriod
  previousPeriod: MonthPeriod
  executiveSummary: ExecutiveSummary
  kpis: {
    profitability: KPIResult[]
    liquidity: KPIResult[]
    efficiency: KPIResult[]
    leverage: KPIResult[]
    growth: KPIResult[]
  }
  revenueAnalysis: RevenueAnalysis
  profitability: ProfitabilitySection
  profitabilityChartData: ProfitabilityChartPoint[]
  cashFlow: CashFlowSection
  cashFlowChartData: CashFlowChartPoint[]
  kpiImportanceChartData: KPIImportanceChartPoint[]
  financials: FinancialsSnapshot
  financialPosition: FinancialPositionSection
  debtAndCoverage: DebtAndCoverageSection
  /**
   * Deterministic, rule-based observations derived from KPI values already
   * computed above (e.g. "Revenue decreased 92.4% compared with last
   * month"). Never generated for an 'N/A' metric, and never speculative —
   * each line is a direct restatement of a trend/value this report already
   * calculated, not an AI-generated inference.
   */
  insights: string[]
  kpiExplanations: KPIExplanation[]
}

export interface MonthlyPerformanceRequest {
  year: number
  /** 1-based: January = 1 ... December = 12 */
  month: number
  periodLabel?: string
}
