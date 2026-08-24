import type { AgingReport as AgingReportType } from '../types/report.types'
import { formatCurrency } from '@/utils/formatCurrency'

interface Props {
  report: AgingReportType
  onToggleType: (type: 'RECEIVABLES' | 'PAYABLES') => void
}

export default function AgingReport({ report, onToggleType }: Props) {
  const isAR = report.agingType === 'RECEIVABLES'

  return (
    <div className="report-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="report-title">{report.title}</h2>
          <p className="report-subtitle">{report.periodLabel}</p>
        </div>

        {/* Sub-toggle between AR and AP */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '6px' }}>
          <button
            className="tab-button"
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              backgroundColor: isAR ? '#ffffff' : 'transparent',
              color: isAR ? '#2563eb' : '#64748b',
              boxShadow: isAR ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              borderBottom: 'none',
            }}
            onClick={() => onToggleType('RECEIVABLES')}
          >
            Accounts Receivable (AR)
          </button>
          <button
            className="tab-button"
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              backgroundColor: !isAR ? '#ffffff' : 'transparent',
              color: !isAR ? '#2563eb' : '#64748b',
              boxShadow: !isAR ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              borderBottom: 'none',
            }}
            onClick={() => onToggleType('PAYABLES')}
          >
            Accounts Payable (AP)
          </button>
        </div>
      </div>

      {/* Summary KPI Aging Buckets */}
      <div className="summary-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
        <div className="summary-card">
          <div className="summary-card-title">Current (Not Due)</div>
          <div className="summary-card-value" style={{ color: '#16a34a', fontSize: '1.1rem' }}>
            {formatCurrency(report.summary.current)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">1–30 Days Past</div>
          <div className="summary-card-value" style={{ color: '#ca8a04', fontSize: '1.1rem' }}>
            {formatCurrency(report.summary.days1_30)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">31–60 Days Past</div>
          <div className="summary-card-value" style={{ color: '#ea580c', fontSize: '1.1rem' }}>
            {formatCurrency(report.summary.days31_60)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">61–90 Days Past</div>
          <div className="summary-card-value" style={{ color: '#dc2626', fontSize: '1.1rem' }}>
            {formatCurrency(report.summary.days61_90)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">90+ Days Past</div>
          <div className="summary-card-value" style={{ color: '#991b1b', fontSize: '1.1rem' }}>
            {formatCurrency(report.summary.over90)}
          </div>
        </div>
        <div className="summary-card" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div className="summary-card-title">Total Outstanding</div>
          <div className="summary-card-value" style={{ color: '#1e40af', fontSize: '1.1rem' }}>
            {formatCurrency(report.totalOutstanding)}
          </div>
        </div>
      </div>

      {/* Detailed Aging Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>{isAR ? 'Customer' : 'Vendor'}</th>
            <th style={{ textAlign: 'center' }}>Count</th>
            <th className="num">Current</th>
            <th className="num">1–30 Days</th>
            <th className="num">31–60 Days</th>
            <th className="num">61–90 Days</th>
            <th className="num">90+ Days</th>
            <th className="num">Total Due</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No outstanding {isAR ? 'receivables' : 'payables'} as of {report.asOfDate}.
              </td>
            </tr>
          ) : (
            report.rows.map((row) => (
              <tr key={row.entityId}>
                <td><strong>{row.entityName}</strong></td>
                <td style={{ textAlign: 'center' }}>{row.documentCount}</td>
                <td className="num">{row.current > 0 ? formatCurrency(row.current) : '—'}</td>
                <td className="num" style={{ color: row.days1_30 > 0 ? '#ca8a04' : 'inherit' }}>
                  {row.days1_30 > 0 ? formatCurrency(row.days1_30) : '—'}
                </td>
                <td className="num" style={{ color: row.days31_60 > 0 ? '#ea580c' : 'inherit' }}>
                  {row.days31_60 > 0 ? formatCurrency(row.days31_60) : '—'}
                </td>
                <td className="num" style={{ color: row.days61_90 > 0 ? '#dc2626' : 'inherit' }}>
                  {row.days61_90 > 0 ? formatCurrency(row.days61_90) : '—'}
                </td>
                <td className="num" style={{ color: row.over90 > 0 ? '#991b1b' : 'inherit', fontWeight: row.over90 > 0 ? 700 : 400 }}>
                  {row.over90 > 0 ? formatCurrency(row.over90) : '—'}
                </td>
                <td className="num" style={{ fontWeight: 700 }}>
                  {formatCurrency(row.total)}
                </td>
              </tr>
            ))
          )}
          {report.rows.length > 0 && (
            <tr style={{ fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
              <td>Total</td>
              <td style={{ textAlign: 'center' }}>—</td>
              <td className="num">{formatCurrency(report.summary.current)}</td>
              <td className="num" style={{ color: '#ca8a04' }}>{formatCurrency(report.summary.days1_30)}</td>
              <td className="num" style={{ color: '#ea580c' }}>{formatCurrency(report.summary.days31_60)}</td>
              <td className="num" style={{ color: '#dc2626' }}>{formatCurrency(report.summary.days61_90)}</td>
              <td className="num" style={{ color: '#991b1b' }}>{formatCurrency(report.summary.over90)}</td>
              <td className="num" style={{ color: '#2563eb' }}>{formatCurrency(report.totalOutstanding)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
