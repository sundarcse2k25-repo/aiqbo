import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts'
import type { MonthlyPerformanceReport as MonthlyPerformanceReportType } from '../types/monthlyPerformance.types'
import type { KPIValue, KPIResult, KPIUnit, TrendDirection, KPICategory } from '../types/monthlyPerformance.types'
import { formatCurrency } from '@/utils/formatCurrency'
import KpiCircleChart from './KpiCircleChart'

interface Props {
  report: MonthlyPerformanceReportType
}

const COLORS = {
  positive: '#16a34a',
  negative: '#dc2626',
  neutral: '#64748b',
  unavailable: '#94a3b8',
  revenue: '#2563eb',
  grossProfit: '#16a34a',
  netProfit: '#7c3aed',
  operatingProfit: '#0891b2',
  ocf: '#0ea5e9',
}

const CATEGORY_LABELS: Record<KPICategory, string> = {
  profitability: 'Profitability',
  liquidity: 'Liquidity',
  efficiency: 'Efficiency',
  leverage: 'Leverage / Solvency',
  growth: 'Growth & Cash Flow',
}

/**
 * Monthly Performance Report renderer — a Fathom-style management report.
 *
 * Presentation-only, like every other report component — it receives a
 * fully computed MonthlyPerformanceReport and renders it. No KPI or
 * accounting calculation happens here; chart series are the report's own
 * pre-computed arrays, and any on-screen percentage derived from two
 * already-supplied numbers (e.g. a margin trend line) is a display-only
 * transform, not new accounting logic. 'N/A' values are always rendered
 * literally as "N/A", never as 0 or a blank cell.
 */
export default function MonthlyPerformanceReport({ report }: Props) {
  const formatValue = (value: KPIValue, unit: KPIUnit): string => {
    if (value === 'N/A') return 'N/A'
    if (unit === 'currency') return formatCurrency(value)
    if (unit === 'percentage') return `${value.toFixed(1)}%`
    if (unit === 'days') return `${value.toFixed(1)} days`
    return `${value.toFixed(2)}x`
  }

  const trendColor = (trend: TrendDirection): string => {
    if (trend === 'positive') return COLORS.positive
    if (trend === 'negative') return COLORS.negative
    if (trend === 'unavailable') return COLORS.unavailable
    return COLORS.neutral
  }

  const trendArrow = (trend: TrendDirection): string => {
    if (trend === 'positive') return '▲'
    if (trend === 'negative') return '▼'
    if (trend === 'unavailable') return '—'
    return '■'
  }

  // ── Chart-ready display transforms (no new accounting logic) ──────────
  const marginTrendData = report.profitabilityChartData.map((p) => ({
    period: p.period,
    'Gross Margin %': p.revenue !== 0 ? Number(((p.grossProfit / p.revenue) * 100).toFixed(1)) : 0,
    'Net Margin %': p.revenue !== 0 ? Number(((p.netProfit / p.revenue) * 100).toFixed(1)) : 0,
  }))

  const revenueGrowthTrendData = report.profitabilityChartData.map((p, i) => {
    const prior = i > 0 ? report.profitabilityChartData[i - 1] : null
    const growth = prior && prior.revenue !== 0 ? Number((((p.revenue - prior.revenue) / Math.abs(prior.revenue)) * 100).toFixed(1)) : null
    return { period: p.period, 'Revenue Growth %': growth }
  })

  const waterfallSteps = [
    { name: 'Revenue', value: report.profitability.revenue, color: COLORS.revenue },
    { name: 'COGS', value: -report.profitability.cogs, color: COLORS.negative },
    { name: 'Gross Profit', value: report.profitability.grossProfit, color: COLORS.grossProfit, isTotal: true },
    { name: 'Opex', value: -report.profitability.operatingExpenses, color: COLORS.negative },
    {
      name: 'Net Profit',
      value: report.profitability.netProfit,
      color: report.profitability.netProfit >= 0 ? COLORS.netProfit : COLORS.negative,
      isTotal: true,
    },
  ]
  let running = 0
  const waterfallData = waterfallSteps.map((step) => {
    if (step.isTotal) {
      const bar = { name: step.name, base: 0, value: step.value, color: step.color }
      running = step.value
      return bar
    }
    const base = step.value >= 0 ? running : running + step.value
    const bar = { name: step.name, base, value: Math.abs(step.value), color: step.color }
    running += step.value
    return bar
  })

  const financialPositionData = [
    { name: 'Assets', value: report.financialPosition.assets.totalAssets, fill: COLORS.revenue },
    { name: 'Liabilities + Equity', value: report.financialPosition.liabilities.totalLiabilities + report.financialPosition.equity.totalEquity, fill: COLORS.grossProfit },
  ]

  const importanceCounts = report.kpiImportanceChartData.map((p) => ({
    name: p.importance,
    count: p.count,
    fill: p.importance === 'CRITICAL' ? '#991b1b' : p.importance === 'HIGH' ? '#c2410c' : p.importance === 'MEDIUM' ? '#1d4ed8' : '#64748b',
  }))

  const KpiTable = ({ kpis }: { kpis: KPIResult[] }) => (
    <table className="data-table" style={{ marginBottom: '1.5rem' }}>
      <thead>
        <tr>
          <th>KPI</th>
          <th className="num">Current</th>
          <th className="num">Previous</th>
          <th className="num">Change</th>
          <th style={{ textAlign: 'center' }}>Trend</th>
          <th>Importance</th>
        </tr>
      </thead>
      <tbody>
        {kpis.map((kpi) => (
          <tr key={kpi.key}>
            <td>{kpi.name}</td>
            <td className="num">{formatValue(kpi.currentValue, kpi.unit)}</td>
            <td className="num">{formatValue(kpi.previousValue, kpi.unit)}</td>
            <td className="num">{formatValue(kpi.change, kpi.unit)}</td>
            <td style={{ textAlign: 'center', color: trendColor(kpi.trend) }}>{trendArrow(kpi.trend)}</td>
            <td>
              <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                {report.kpiExplanations.find((e) => e.key === kpi.key)?.importance ?? '—'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="report-section" style={{ marginTop: '2.5rem' }}>
      <h3 style={{ marginBottom: '0.75rem' }}>{title}</h3>
      {children}
    </section>
  )

  const chartTooltipFormatter = (value: unknown) => (typeof value === 'number' ? formatCurrency(value) : String(value ?? ''))

  return (
    <div className="report-container">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="report-section">
        <h2 className="report-title">{report.title}</h2>
        <p className="report-subtitle">
          {report.period.label} — compared against {report.previousPeriod.label} · generated {new Date(report.generatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* ── Executive Summary ────────────────────────────────────────── */}
      <Section title="Executive Summary">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-card-title">Revenue</div>
            <div className="summary-card-value">{formatCurrency(report.executiveSummary.revenue.currentMonthRevenue)}</div>
            <div style={{ fontSize: '0.8rem', color: trendColor(report.executiveSummary.revenue.trend) }}>
              {trendArrow(report.executiveSummary.revenue.trend)} {formatValue(report.executiveSummary.revenue.growthPercent, 'percentage')} vs last month
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Profitability Ratio (Net Margin)</div>
            <div className="summary-card-value">{formatValue(report.executiveSummary.profitability.netProfitMargin, 'percentage')}</div>
            <div style={{ fontSize: '0.8rem', color: trendColor(report.executiveSummary.profitability.trend) }}>
              {trendArrow(report.executiveSummary.profitability.trend)} Prev: {formatValue(report.executiveSummary.profitability.previousNetProfitMargin, 'percentage')}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Activity (Asset Turnover)</div>
            <div className="summary-card-value">{formatValue(report.executiveSummary.activity.assetTurnover, 'ratio')}</div>
            <div style={{ fontSize: '0.8rem', color: trendColor(report.executiveSummary.activity.trend) }}>
              {trendArrow(report.executiveSummary.activity.trend)} Prev: {formatValue(report.executiveSummary.activity.previousAssetTurnover, 'ratio')}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Efficiency (ROCE)</div>
            <div className="summary-card-value">{formatValue(report.executiveSummary.efficiency.roce, 'percentage')}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{report.executiveSummary.efficiency.capitalEmployedDefinition}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Working Capital (CCC)</div>
            <div className="summary-card-value">{formatValue(report.executiveSummary.workingCapital.cashConversionCycle, 'days')}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{report.executiveSummary.workingCapital.inventoryTreatment}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Free Cash Flow</div>
            <div className="summary-card-value">{formatValue(report.executiveSummary.cashFlow.freeCashFlow, 'currency')}</div>
            {report.executiveSummary.cashFlow.reason && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{report.executiveSummary.cashFlow.reason}</div>}
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Net Debt</div>
            <div className="summary-card-value">{formatValue(report.executiveSummary.debt.netDebt, 'currency')}</div>
            {report.executiveSummary.debt.reason && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{report.executiveSummary.debt.reason}</div>}
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Interest Coverage</div>
            <div className="summary-card-value">{formatValue(report.executiveSummary.coverage.interestCoverageRatio, 'ratio')}</div>
            {report.executiveSummary.coverage.reason && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{report.executiveSummary.coverage.reason}</div>}
          </div>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.5rem' }}>
          <strong>Strategies to improve profitability:</strong> {report.executiveSummary.profitability.improvementStrategies.join(' · ')}
        </p>
      </Section>

      {/* ── Management Insights ──────────────────────────────────────── */}
      <Section title="Management Insights">
        {report.insights.length === 0 ? (
          <p style={{ color: '#64748b' }}>No notable movements this period — key metrics were broadly unchanged.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {report.insights.map((insight, i) => (
              <li key={i} style={{ marginBottom: '0.4rem', fontSize: '0.925rem' }}>{insight}</li>
            ))}
          </ul>
        )}
      </Section>

      {/* ── KPI Results ───────────────────────────────────────────────── */}
      <Section title="KPI Results">
        <KpiCircleChart kpis={report.kpis} categoryLabels={CATEGORY_LABELS} />
      </Section>

      {/* ── KPI Importance ───────────────────────────────────────────── */}
      <Section title="KPI Importance">
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={importanceCounts} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={90} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {importanceCounts.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── KPI Dashboard ─────────────────────────────────────────────── */}
      <Section title="KPI Dashboard">
        {(['profitability', 'liquidity', 'efficiency', 'leverage', 'growth'] as KPICategory[]).map((category) => (
          <div key={category}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', margin: '1rem 0 0.4rem' }}>
              {CATEGORY_LABELS[category]}
            </h4>
            <KpiTable kpis={report.kpis[category]} />
          </div>
        ))}
      </Section>

      {/* ── Revenue Analysis ─────────────────────────────────────────── */}
      <Section title="Revenue Analysis">
        <div className="summary-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="summary-card">
            <div className="summary-card-title">Current Month Revenue</div>
            <div className="summary-card-value">{formatCurrency(report.revenueAnalysis.currentMonthRevenue)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Previous Month Revenue</div>
            <div className="summary-card-value">{formatCurrency(report.revenueAnalysis.previousMonthRevenue)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Revenue Growth</div>
            <div className="summary-card-value" style={{ color: trendColor(report.executiveSummary.revenue.trend) }}>
              {formatValue(report.revenueAnalysis.revenueGrowthPercent, 'percentage')}
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 260, marginTop: '1.25rem' }}>
          <ResponsiveContainer>
            <BarChart data={report.profitabilityChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => formatCurrency(v)} width={90} />
              <Tooltip formatter={chartTooltipFormatter} />
              <Bar dataKey="revenue" name="Revenue" fill={COLORS.revenue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {report.revenueAnalysis.byCustomer.length > 0 && (
          <table className="data-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Customer</th>
                <th className="num">Amount</th>
                <th className="num">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {report.revenueAnalysis.byCustomer.map((c) => (
                <tr key={c.customerId}>
                  <td>{c.customerName}</td>
                  <td className="num">{formatCurrency(c.amount)}</td>
                  <td className="num">{c.percentageOfTotal.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* ── Profitability ─────────────────────────────────────────────── */}
      <Section title="Profitability">
        <table className="report-table">
          <tbody>
            <tr><td className="label">Revenue</td><td className="amount">{formatCurrency(report.profitability.revenue)}</td></tr>
            <tr><td className="label">COGS</td><td className="amount">{formatCurrency(report.profitability.cogs)}</td></tr>
            <tr className="total-row"><td className="label">Gross Profit</td><td className="amount">{formatCurrency(report.profitability.grossProfit)} ({formatValue(report.profitability.grossProfitMargin, 'percentage')})</td></tr>
            <tr><td className="label">Operating Expenses</td><td className="amount">{formatCurrency(report.profitability.operatingExpenses)}</td></tr>
            <tr className="total-row"><td className="label">Operating Profit</td><td className="amount">{formatValue(report.profitability.operatingProfit, 'currency')} ({formatValue(report.profitability.operatingProfitMargin, 'percentage')})</td></tr>
            <tr><td className="label">EBITDA Margin</td><td className="amount">{formatValue(report.profitability.ebitdaMargin, 'percentage')}</td></tr>
            <tr className="net-profit-row"><td className="label">Net Profit</td><td className={`amount ${report.profitability.netProfit >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(report.profitability.netProfit)} ({formatValue(report.profitability.netProfitMargin, 'percentage')})</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>{report.profitability.operatingProfitNote}</p>
      </Section>

      {/* ── Profitability Charts ─────────────────────────────────────── */}
      <Section title="Profitability Charts">
        <h4 style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>Revenue vs Profit</h4>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={report.profitabilityChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => formatCurrency(v)} width={90} />
              <Tooltip formatter={chartTooltipFormatter} />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.revenue} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke={COLORS.grossProfit} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke={COLORS.netProfit} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <h4 style={{ fontSize: '0.85rem', color: '#475569', margin: '1.5rem 0 0.4rem' }}>Margin Trend</h4>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={marginTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${v}%`} width={50} />
              <Tooltip formatter={(v: unknown) => (typeof v === 'number' ? `${v}%` : String(v ?? ''))} />
              <Legend />
              <Line type="monotone" dataKey="Gross Margin %" stroke={COLORS.grossProfit} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Net Margin %" stroke={COLORS.netProfit} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <h4 style={{ fontSize: '0.85rem', color: '#475569', margin: '1.5rem 0 0.4rem' }}>Profitability Waterfall — {report.period.label}</h4>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => formatCurrency(v)} width={90} />
              <Tooltip formatter={(v: unknown) => (typeof v === 'number' ? formatCurrency(v) : String(v ?? ''))} />
              <Bar dataKey="base" stackId="a" fill="transparent" />
              <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── Cash Flow ─────────────────────────────────────────────────── */}
      <Section title="Cash Flow">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-card-title">Operating Cash Flow</div>
            <div className="summary-card-value">{formatValue(report.cashFlow.operatingCashFlow, 'currency')}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{report.cashFlow.operatingCashFlowNote}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Capital Expenditure</div>
            <div className="summary-card-value">{formatValue(report.cashFlow.capitalExpenditure, 'currency')}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{report.cashFlow.capitalExpenditureNote}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Free Cash Flow</div>
            <div className="summary-card-value">{formatValue(report.cashFlow.freeCashFlow, 'currency')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Net Variable Cash Flow</div>
            <div className="summary-card-value">{formatValue(report.executiveSummary.marginalCashFlow.netVariableCashFlowPercent, 'percentage')}</div>
            {report.executiveSummary.marginalCashFlow.reason && (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{report.executiveSummary.marginalCashFlow.reason}</div>
            )}
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Cash on Hand</div>
            <div className="summary-card-value">{formatCurrency(report.financials.cash + report.financials.bank)}</div>
          </div>
        </div>
      </Section>

      {/* ── Cash Flow Charts ──────────────────────────────────────────── */}
      <Section title="Cash Flow Charts">
        <h4 style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>Operating Cash Flow Trend</h4>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={report.cashFlowChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => formatCurrency(v)} width={90} />
              <Tooltip formatter={(v: unknown) => (typeof v === 'number' ? formatCurrency(v) : String(v ?? ''))} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar dataKey="operatingCashFlow" name="Operating Cash Flow" radius={[4, 4, 0, 0]}>
                {report.cashFlowChartData.map((entry, i) => (
                  <Cell key={i} fill={typeof entry.operatingCashFlow === 'number' && entry.operatingCashFlow < 0 ? COLORS.negative : COLORS.ocf} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── Working Capital ───────────────────────────────────────────── */}
      <Section title="Working Capital">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-card-title">Accounts Receivable</div>
            <div className="summary-card-value">{formatCurrency(report.financials.accountsReceivable)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Accounts Payable</div>
            <div className="summary-card-value">{formatCurrency(report.financials.accountsPayable)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Working Capital</div>
            <div className="summary-card-value">{formatCurrency(report.financials.currentAssets - report.financials.currentLiabilities)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Inventory Days</div>
            <div className="summary-card-value">N/A</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Inventory data is not applicable / unavailable for this business.</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Cash Conversion Cycle</div>
            <div className="summary-card-value">{formatValue(report.executiveSummary.workingCapital.cashConversionCycle, 'days')}</div>
          </div>
        </div>
      </Section>

      {/* ── Growth ────────────────────────────────────────────────────── */}
      <Section title="Growth">
        <KpiTable kpis={report.kpis.growth} />
        <h4 style={{ fontSize: '0.85rem', color: '#475569', margin: '1rem 0 0.4rem' }}>Revenue Growth Trend</h4>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={revenueGrowthTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${v}%`} width={50} />
              <Tooltip formatter={(v: unknown) => (typeof v === 'number' ? `${v}%` : 'N/A')} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Line type="monotone" dataKey="Revenue Growth %" stroke={COLORS.revenue} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── Financial Position ────────────────────────────────────────── */}
      <Section title="Financial Position">
        <table className="report-table">
          <tbody>
            <tr className="section-header"><td colSpan={2}>Assets</td></tr>
            <tr><td className="label">Current Assets</td><td className="amount">{formatCurrency(report.financialPosition.assets.currentAssets)}</td></tr>
            <tr><td className="label">Fixed Assets</td><td className="amount">{formatCurrency(report.financialPosition.assets.fixedAssets)}</td></tr>
            <tr><td className="label">Other Assets</td><td className="amount">{formatCurrency(report.financialPosition.assets.otherAssets)}</td></tr>
            <tr className="total-row"><td className="label">Total Assets</td><td className="amount">{formatCurrency(report.financialPosition.assets.totalAssets)}</td></tr>

            <tr className="section-header"><td colSpan={2}>Liabilities</td></tr>
            <tr><td className="label">Current Liabilities</td><td className="amount">{formatCurrency(report.financialPosition.liabilities.currentLiabilities)}</td></tr>
            <tr><td className="label">Long-term Liabilities</td><td className="amount">{formatCurrency(report.financialPosition.liabilities.longTermLiabilities)}</td></tr>
            <tr className="total-row"><td className="label">Total Liabilities</td><td className="amount">{formatCurrency(report.financialPosition.liabilities.totalLiabilities)}</td></tr>

            <tr className="section-header"><td colSpan={2}>Equity</td></tr>
            <tr><td className="label">Retained Earnings</td><td className="amount">{formatCurrency(report.financialPosition.equity.retainedEarnings)}</td></tr>
            <tr className="total-row"><td className="label">Total Equity</td><td className="amount">{formatCurrency(report.financialPosition.equity.totalEquity)}</td></tr>

            <tr className="divider"><td colSpan={2}></td></tr>
            <tr className="net-profit-row">
              <td className="label">Total Liabilities &amp; Equity</td>
              <td className="amount">
                {formatCurrency(report.financialPosition.liabilities.totalLiabilities + report.financialPosition.equity.totalEquity)}{' '}
                {report.financialPosition.isBalanced ? (
                  <span className="badge badge-paid">Balanced</span>
                ) : (
                  <span className="badge badge-debit">Out of Balance</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ width: '100%', height: 220, marginTop: '1.25rem' }}>
          <ResponsiveContainer>
            <BarChart data={financialPositionData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="name" width={140} fontSize={12} />
              <Tooltip formatter={(v: unknown) => (typeof v === 'number' ? formatCurrency(v) : String(v ?? ''))} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {financialPositionData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── Debt & Coverage ───────────────────────────────────────────── */}
      <Section title="Debt & Coverage">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-card-title">Total Debt</div>
            <div className="summary-card-value">{formatValue(report.debtAndCoverage.totalDebt, 'currency')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Cash &amp; Bank</div>
            <div className="summary-card-value">{formatCurrency(report.debtAndCoverage.cash)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Net Debt</div>
            <div className="summary-card-value">{formatValue(report.debtAndCoverage.netDebt, 'currency')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Debt-to-Equity</div>
            <div className="summary-card-value">{formatValue(report.debtAndCoverage.debtToEquity, 'ratio')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Interest Coverage</div>
            <div className="summary-card-value">{formatValue(report.debtAndCoverage.interestCoverage, 'ratio')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Debt Service Coverage</div>
            <div className="summary-card-value">{formatValue(report.debtAndCoverage.dscr, 'ratio')}</div>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.75rem' }}>{report.debtAndCoverage.reason}</p>
      </Section>

      {/* ── KPIs Explained ────────────────────────────────────────────── */}
      <Section title="KPIs Explained">
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
          Definitions for every KPI shown above. The full reference (including KPIs not surfaced in this month's report) is also available in the KPI Document tab.
        </p>
        {(['profitability', 'liquidity', 'efficiency', 'leverage', 'growth'] as KPICategory[]).map((category) => (
          <div key={category} style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', margin: '0.5rem 0' }}>
              {CATEGORY_LABELS[category]}
            </h4>
            {report.kpiExplanations.filter((e) => e.category === category).map((e) => (
              <div key={e.key} style={{ marginBottom: '0.6rem', fontSize: '0.875rem' }}>
                <strong>{e.name}</strong> — <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#475569' }}>{e.formula}</span>
                <div style={{ color: '#64748b' }}>{e.description}</div>
              </div>
            ))}
          </div>
        ))}
      </Section>
    </div>
  )
}
