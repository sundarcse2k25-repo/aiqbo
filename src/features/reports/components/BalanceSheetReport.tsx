import type { BalanceSheetReport as BSReportType } from '../types/report.types'
import { formatCurrency } from '@/utils/formatCurrency'

interface Props {
  report: BSReportType
}

export default function BalanceSheetReport({ report }: Props) {
  return (
    <div className="report-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="report-title">{report.title}</h2>
          <p className="report-subtitle">{report.periodLabel}</p>
        </div>
        <div>
          {report.isBalanced ? (
            <span className="badge badge-paid" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
              ✓ Balanced
            </span>
          ) : (
            <span className="badge badge-debit" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
              ⚠ Out of Balance
            </span>
          )}
        </div>
      </div>

      <table className="report-table">
        <tbody>
          {/* ── ASSETS ──────────────────────────────────────────────────── */}
          <tr className="section-header">
            <td colSpan={2}>ASSETS</td>
          </tr>
          <tr style={{ fontWeight: 600, color: '#475569' }}>
            <td colSpan={2} style={{ paddingLeft: '1rem' }}>{report.currentAssets.title}</td>
          </tr>
          {report.currentAssets.items.map((item) => (
            <tr key={item.accountId}>
              <td className="label" style={{ paddingLeft: '2rem' }}>{item.accountName}</td>
              <td className="amount">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td className="label" style={{ paddingLeft: '1rem' }}>Total {report.currentAssets.title}</td>
            <td className="amount positive">{formatCurrency(report.currentAssets.total)}</td>
          </tr>

          {report.fixedAssets.items.length > 0 && (
            <>
              <tr style={{ fontWeight: 600, color: '#475569' }}>
                <td colSpan={2} style={{ paddingLeft: '1rem', paddingTop: '1rem' }}>{report.fixedAssets.title}</td>
              </tr>
              {report.fixedAssets.items.map((item) => (
                <tr key={item.accountId}>
                  <td className="label" style={{ paddingLeft: '2rem' }}>{item.accountName}</td>
                  <td className="amount">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td className="label" style={{ paddingLeft: '1rem' }}>Total {report.fixedAssets.title}</td>
                <td className="amount positive">{formatCurrency(report.fixedAssets.total)}</td>
              </tr>
            </>
          )}

          {report.otherAssets.items.length > 0 && (
            <>
              <tr style={{ fontWeight: 600, color: '#475569' }}>
                <td colSpan={2} style={{ paddingLeft: '1rem', paddingTop: '1rem' }}>{report.otherAssets.title}</td>
              </tr>
              {report.otherAssets.items.map((item) => (
                <tr key={item.accountId}>
                  <td className="label" style={{ paddingLeft: '2rem' }}>{item.accountName}</td>
                  <td className="amount">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td className="label" style={{ paddingLeft: '1rem' }}>Total {report.otherAssets.title}</td>
                <td className="amount positive">{formatCurrency(report.otherAssets.total)}</td>
              </tr>
            </>
          )}

          <tr className="net-profit-row">
            <td className="label">TOTAL ASSETS</td>
            <td className="amount positive">{formatCurrency(report.totalAssets)}</td>
          </tr>

          {/* ── LIABILITIES ─────────────────────────────────────────────── */}
          <tr className="section-header" style={{ paddingTop: '2.5rem' }}>
            <td colSpan={2}>LIABILITIES</td>
          </tr>
          <tr style={{ fontWeight: 600, color: '#475569' }}>
            <td colSpan={2} style={{ paddingLeft: '1rem' }}>{report.currentLiabilities.title}</td>
          </tr>
          {report.currentLiabilities.items.map((item) => (
            <tr key={item.accountId}>
              <td className="label" style={{ paddingLeft: '2rem' }}>{item.accountName}</td>
              <td className="amount">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td className="label" style={{ paddingLeft: '1rem' }}>Total {report.currentLiabilities.title}</td>
            <td className="amount negative">{formatCurrency(report.currentLiabilities.total)}</td>
          </tr>

          {report.longTermLiabilities.items.length > 0 && (
            <>
              <tr style={{ fontWeight: 600, color: '#475569' }}>
                <td colSpan={2} style={{ paddingLeft: '1rem', paddingTop: '1rem' }}>{report.longTermLiabilities.title}</td>
              </tr>
              {report.longTermLiabilities.items.map((item) => (
                <tr key={item.accountId}>
                  <td className="label" style={{ paddingLeft: '2rem' }}>{item.accountName}</td>
                  <td className="amount">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td className="label" style={{ paddingLeft: '1rem' }}>Total {report.longTermLiabilities.title}</td>
                <td className="amount negative">{formatCurrency(report.longTermLiabilities.total)}</td>
              </tr>
            </>
          )}

          <tr className="total-row">
            <td className="label">TOTAL LIABILITIES</td>
            <td className="amount negative">{formatCurrency(report.totalLiabilities)}</td>
          </tr>

          {/* ── EQUITY ──────────────────────────────────────────────────── */}
          <tr className="section-header" style={{ paddingTop: '2.5rem' }}>
            <td colSpan={2}>EQUITY</td>
          </tr>
          {report.equitySection.items.map((item) => (
            <tr key={item.accountId}>
              <td className="label" style={{ paddingLeft: '2rem' }}>{item.accountName}</td>
              <td className="amount">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td className="label">TOTAL EQUITY</td>
            <td className="amount">{formatCurrency(report.totalEquity)}</td>
          </tr>

          {/* ── TOTAL LIABILITIES & EQUITY ──────────────────────────────── */}
          <tr className="divider"><td colSpan={2}></td></tr>
          <tr className="net-profit-row">
            <td className="label">TOTAL LIABILITIES &amp; EQUITY</td>
            <td className="amount positive">{formatCurrency(report.totalLiabilitiesAndEquity)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
