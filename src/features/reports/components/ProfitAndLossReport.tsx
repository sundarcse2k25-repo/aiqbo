import type { ProfitAndLossReport } from '../types/report.types'
import { formatCurrency } from '@/utils/formatCurrency'

interface Props {
  report: ProfitAndLossReport
}

/**
 * Profit & Loss report renderer.
 *
 * This component is intentionally presentation-only.
 * It receives a fully computed ProfitAndLossReport and renders it.
 * No calculations happen here.
 */
export default function ProfitAndLossReport({ report }: Props) {
  const isProfit = report.netProfit >= 0

  return (
    <div className="report-container">
      <h2 className="report-title">Profit &amp; Loss</h2>
      <p className="report-subtitle">{report.periodLabel}</p>

      <table className="report-table">
        <tbody>
          {/* ── Revenue ─────────────────────────────────────────────────── */}
          <tr className="section-header">
            <td colSpan={2}>Revenue</td>
          </tr>

          {report.revenueLines.map((line) => (
            <tr key={line.accountId}>
              <td className="label">{line.accountName}</td>
              <td className="amount">{formatCurrency(line.amount)}</td>
            </tr>
          ))}

          <tr className="total-row">
            <td className="label">Total Revenue</td>
            <td className="amount positive">{formatCurrency(report.totalRevenue)}</td>
          </tr>

          {/* ── Cost of Goods Sold ──────────────────────────────────────── */}
          <tr className="section-header">
            <td colSpan={2}>Cost of Goods Sold</td>
          </tr>

          {report.cogsLines.map((line) => (
            <tr key={line.accountId}>
              <td className="label">{line.accountName}</td>
              <td className="amount">{formatCurrency(line.amount)}</td>
            </tr>
          ))}

          <tr className="total-row">
            <td className="label">Total COGS</td>
            <td className="amount negative">{formatCurrency(report.totalCogs)}</td>
          </tr>

          {/* ── Gross Profit ─────────────────────────────────────────────── */}
          <tr className="divider"><td colSpan={2}></td></tr>
          <tr className="total-row">
            <td className="label">Gross Profit</td>
            <td className={`amount ${report.grossProfit >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(report.grossProfit)}
            </td>
          </tr>

          {/* ── Operating Expenses ──────────────────────────────────────── */}
          <tr className="section-header">
            <td colSpan={2}>Operating Expenses</td>
          </tr>

          {report.expenseLines.map((line) => (
            <tr key={line.accountId}>
              <td className="label">{line.accountName}</td>
              <td className="amount">{formatCurrency(line.amount)}</td>
            </tr>
          ))}

          <tr className="total-row">
            <td className="label">Total Operating Expenses</td>
            <td className="amount negative">{formatCurrency(report.totalExpenses)}</td>
          </tr>

          {/* ── Net Profit ───────────────────────────────────────────────── */}
          <tr className="divider"><td colSpan={2}></td></tr>
          <tr className="net-profit-row">
            <td className="label">Net Profit</td>
            <td className={`amount ${isProfit ? 'positive' : 'negative'}`}>
              {formatCurrency(report.netProfit)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
