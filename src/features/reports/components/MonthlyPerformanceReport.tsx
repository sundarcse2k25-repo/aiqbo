import type { MonthlyPerformanceReport as MonthlyPerformanceReportType } from '../types/monthlyPerformance.types'
import type { KPIValue, KPIResult, KPIUnit, TrendDirection } from '../types/monthlyPerformance.types'
import { formatCurrency } from '@/utils/formatCurrency'

interface Props {
  report: MonthlyPerformanceReportType
}

/**
 * Monthly Performance Report renderer.
 *
 * Presentation-only, like every other report component — it receives a
 * fully computed MonthlyPerformanceReport and renders it. No KPI
 * calculation happens here. 'N/A' values are always rendered literally as
 * "N/A", never as 0 or a blank cell, so missing data is never mistaken for
 * an actual zero.
 */
export default function MonthlyPerformanceReport({ report }: Props) {
  const formatValue = (value: KPIValue, unit: KPIUnit): string => {
    if (value === 'N/A') return 'N/A'
    if (unit === 'currency') return formatCurrency(value)
    if (unit === 'percentage') return `${value.toFixed(1)}%`
    if (unit === 'days') return `${value.toFixed(1)} days`
    return value.toFixed(2)
  }

  const trendColor = (trend: TrendDirection): string => {
    if (trend === 'positive') return '#16a34a'
    if (trend === 'negative') return '#dc2626'
    if (trend === 'unavailable') return '#94a3b8'
    return '#64748b'
  }

  const KpiTable = ({ title, kpis }: { title: string; kpis: KPIResult[] }) => (
    <>
      <tr className="section-header">
        <td colSpan={6}>{title}</td>
      </tr>
      {kpis.map((kpi) => (
        <tr key={kpi.key}>
          <td>{kpi.name}</td>
          <td className="num">{formatValue(kpi.currentValue, kpi.unit)}</td>
          <td className="num">{formatValue(kpi.previousValue, kpi.unit)}</td>
          <td className="num">{formatValue(kpi.change, kpi.unit)}</td>
          <td className="num" style={{ color: trendColor(kpi.trend) }}>
            {kpi.trend === 'unavailable' ? '—' : `${kpi.trend}`}
          </td>
          <td>
            <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
              {report.kpiExplanations.find((e) => e.key === kpi.key)?.importance ?? '—'}
            </span>
          </td>
        </tr>
      ))}
    </>
  )

  return (
    <div className="report-container">
      <h2 className="report-title">{report.title}</h2>
      <p className="report-subtitle">
        {report.period.label} vs {report.previousPeriod.label}
      </p>

      {/* ── Executive Summary ─────────────────────────────────────────── */}
      <h3 style={{ marginBottom: '0.75rem' }}>Executive Summary</h3>
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-title">Revenue</div>
          <div className="summary-card-value">{formatCurrency(report.executiveSummary.revenue.currentMonthRevenue)}</div>
          <div style={{ fontSize: '0.8rem', color: trendColor(report.executiveSummary.revenue.trend) }}>
            {formatValue(report.executiveSummary.revenue.growthPercent, 'percentage')} vs last month
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Net Profit Margin</div>
          <div className="summary-card-value">{formatValue(report.executiveSummary.profitability.netProfitMargin, 'percentage')}</div>
          <div style={{ fontSize: '0.8rem', color: trendColor(report.executiveSummary.profitability.trend) }}>
            Prev: {formatValue(report.executiveSummary.profitability.previousNetProfitMargin, 'percentage')}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Asset Turnover</div>
          <div className="summary-card-value">{formatValue(report.executiveSummary.activity.assetTurnover, 'ratio')}</div>
          <div style={{ fontSize: '0.8rem', color: trendColor(report.executiveSummary.activity.trend) }}>
            Prev: {formatValue(report.executiveSummary.activity.previousAssetTurnover, 'ratio')}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">ROCE</div>
          <div className="summary-card-value">{formatValue(report.executiveSummary.efficiency.roce, 'percentage')}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{report.executiveSummary.efficiency.capitalEmployedDefinition}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Cash Conversion Cycle</div>
          <div className="summary-card-value">{formatValue(report.executiveSummary.workingCapital.cashConversionCycle, 'days')}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{report.executiveSummary.workingCapital.inventoryTreatment}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Free Cash Flow</div>
          <div className="summary-card-value">{formatValue(report.executiveSummary.cashFlow.freeCashFlow, 'currency')}</div>
          {report.executiveSummary.cashFlow.reason && (
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{report.executiveSummary.cashFlow.reason}</div>
          )}
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Net Debt</div>
          <div className="summary-card-value">{formatValue(report.executiveSummary.debt.netDebt, 'currency')}</div>
          {report.executiveSummary.debt.reason && (
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{report.executiveSummary.debt.reason}</div>
          )}
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Interest Coverage</div>
          <div className="summary-card-value">{formatValue(report.executiveSummary.coverage.interestCoverageRatio, 'ratio')}</div>
          {report.executiveSummary.coverage.reason && (
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{report.executiveSummary.coverage.reason}</div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '2rem', fontSize: '0.875rem', color: '#475569' }}>
        <strong>Improvement strategies:</strong> {report.executiveSummary.profitability.improvementStrategies.join(' · ')}
      </div>

      {/* ── Revenue Analysis ──────────────────────────────────────────── */}
      <h3 style={{ marginBottom: '0.75rem' }}>Revenue Analysis</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th className="num">Amount</th>
            <th className="num">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {report.revenueAnalysis.byCustomer.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                No revenue recorded for {report.period.label}.
              </td>
            </tr>
          ) : (
            report.revenueAnalysis.byCustomer.map((c) => (
              <tr key={c.customerId}>
                <td>{c.customerName}</td>
                <td className="num">{formatCurrency(c.amount)}</td>
                <td className="num">{c.percentageOfTotal.toFixed(1)}%</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ── KPI Summary Table ─────────────────────────────────────────── */}
      <h3 style={{ margin: '2rem 0 0.75rem' }}>KPI Results</h3>
      <table className="report-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem' }}>KPI</th>
            <th className="num">Current</th>
            <th className="num">Previous</th>
            <th className="num">Change</th>
            <th className="num">Trend</th>
            <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem' }}>Importance</th>
          </tr>
        </thead>
        <tbody>
          <KpiTable title="Profitability" kpis={report.kpis.profitability} />
          <KpiTable title="Liquidity" kpis={report.kpis.liquidity} />
          <KpiTable title="Efficiency" kpis={report.kpis.efficiency} />
          <KpiTable title="Leverage / Solvency" kpis={report.kpis.leverage} />
          <KpiTable title="Growth & Cash Flow" kpis={report.kpis.growth} />
        </tbody>
      </table>

      {/* ── Profitability ─────────────────────────────────────────────── */}
      <h3 style={{ margin: '2rem 0 0.75rem' }}>Profitability</h3>
      <table className="report-table">
        <tbody>
          <tr><td className="label">Revenue</td><td className="amount">{formatCurrency(report.profitability.revenue)}</td></tr>
          <tr><td className="label">COGS</td><td className="amount">{formatCurrency(report.profitability.cogs)}</td></tr>
          <tr className="total-row"><td className="label">Gross Profit</td><td className="amount">{formatCurrency(report.profitability.grossProfit)} ({formatValue(report.profitability.grossProfitMargin, 'percentage')})</td></tr>
          <tr><td className="label">Operating Expenses</td><td className="amount">{formatCurrency(report.profitability.operatingExpenses)}</td></tr>
          <tr className="total-row"><td className="label">Operating Profit</td><td className="amount">{formatValue(report.profitability.operatingProfit, 'currency')} ({formatValue(report.profitability.operatingProfitMargin, 'percentage')})</td></tr>
          <tr className="net-profit-row"><td className="label">Net Profit</td><td className={`amount ${report.profitability.netProfit >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(report.profitability.netProfit)} ({formatValue(report.profitability.netProfitMargin, 'percentage')})</td></tr>
          <tr><td className="label">EBITDA Margin</td><td className="amount">{formatValue(report.profitability.ebitdaMargin, 'percentage')}</td></tr>
        </tbody>
      </table>
      <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>{report.profitability.operatingProfitNote}</p>

      {/* ── Profitability Chart Data ──────────────────────────────────── */}
      <table className="data-table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Period</th>
            <th className="num">Revenue</th>
            <th className="num">Gross Profit</th>
            <th className="num">Operating Profit</th>
            <th className="num">Net Profit</th>
          </tr>
        </thead>
        <tbody>
          {report.profitabilityChartData.map((p) => (
            <tr key={p.period}>
              <td>{p.period}</td>
              <td className="num">{formatCurrency(p.revenue)}</td>
              <td className="num">{formatCurrency(p.grossProfit)}</td>
              <td className="num">{formatValue(p.operatingProfit, 'currency')}</td>
              <td className="num">{formatCurrency(p.netProfit)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Cash Flow ─────────────────────────────────────────────────── */}
      <h3 style={{ margin: '2rem 0 0.75rem' }}>Cash Flow</h3>
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
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Period</th>
            <th className="num">Operating Cash Flow</th>
            <th className="num">Free Cash Flow</th>
          </tr>
        </thead>
        <tbody>
          {report.cashFlowChartData.map((p) => (
            <tr key={p.period}>
              <td>{p.period}</td>
              <td className="num">{formatValue(p.operatingCashFlow, 'currency')}</td>
              <td className="num">{formatValue(p.freeCashFlow, 'currency')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Financials ────────────────────────────────────────────────── */}
      <h3 style={{ margin: '2rem 0 0.75rem' }}>Financials</h3>
      <table className="report-table">
        <tbody>
          <tr className="section-header"><td colSpan={2}>Income Statement</td></tr>
          <tr><td className="label">Revenue</td><td className="amount">{formatCurrency(report.financials.revenue)}</td></tr>
          <tr><td className="label">COGS</td><td className="amount">{formatCurrency(report.financials.cogs)}</td></tr>
          <tr><td className="label">Gross Profit</td><td className="amount">{formatCurrency(report.financials.grossProfit)}</td></tr>
          <tr><td className="label">Operating Expenses</td><td className="amount">{formatCurrency(report.financials.operatingExpenses)}</td></tr>
          <tr><td className="label">Operating Profit</td><td className="amount">{formatValue(report.financials.operatingProfit, 'currency')}</td></tr>
          <tr><td className="label">Net Profit</td><td className="amount">{formatCurrency(report.financials.netProfit)}</td></tr>

          <tr className="section-header"><td colSpan={2}>Balance Sheet (as of period end)</td></tr>
          <tr><td className="label">Cash</td><td className="amount">{formatCurrency(report.financials.cash)}</td></tr>
          <tr><td className="label">Bank</td><td className="amount">{formatCurrency(report.financials.bank)}</td></tr>
          <tr><td className="label">Accounts Receivable</td><td className="amount">{formatCurrency(report.financials.accountsReceivable)}</td></tr>
          <tr><td className="label">Inventory</td><td className="amount">{formatValue(report.financials.inventory, 'currency')}</td></tr>
          <tr className="total-row"><td className="label">Total Assets</td><td className="amount">{formatCurrency(report.financials.totalAssets)}</td></tr>
          <tr><td className="label">Accounts Payable</td><td className="amount">{formatCurrency(report.financials.accountsPayable)}</td></tr>
          <tr><td className="label">Debt</td><td className="amount">{formatValue(report.financials.debt, 'currency')}</td></tr>
          <tr><td className="label">Current Liabilities</td><td className="amount">{formatCurrency(report.financials.currentLiabilities)}</td></tr>
          <tr className="total-row"><td className="label">Equity</td><td className="amount">{formatCurrency(report.financials.equity)}</td></tr>
        </tbody>
      </table>
    </div>
  )
}
