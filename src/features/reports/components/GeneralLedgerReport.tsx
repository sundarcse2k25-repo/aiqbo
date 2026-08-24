import type { GeneralLedgerReport as GLReportType } from '../types/report.types'
import { formatCurrency } from '@/utils/formatCurrency'

interface Props {
  report: GLReportType
}

export default function GeneralLedgerReport({ report }: Props) {
  return (
    <div className="report-container">
      <h2 className="report-title">{report.title}</h2>
      <p className="report-subtitle">{report.periodLabel}</p>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-title">Active Accounts</div>
          <div className="summary-card-value">{report.accounts.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Total Debits</div>
          <div className="summary-card-value" style={{ color: '#dc2626' }}>
            {formatCurrency(report.totalDebits)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Total Credits</div>
          <div className="summary-card-value" style={{ color: '#16a34a' }}>
            {formatCurrency(report.totalCredits)}
          </div>
        </div>
      </div>

      {report.accounts.map((group) => (
        <div key={group.accountId} style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.6rem 0.8rem',
              backgroundColor: '#f1f5f9',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            <div>
              <span style={{ fontFamily: 'JetBrains Mono', marginRight: '0.75rem', color: '#64748b' }}>
                {group.accountId}
              </span>
              <span>{group.accountName}</span>
              <span className={`badge badge-${group.accountType}`} style={{ marginLeft: '0.75rem' }}>
                {group.accountType}
              </span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono' }}>
              Closing: {formatCurrency(group.closingBalance)}
            </div>
          </div>

          <table className="data-table" style={{ marginTop: '0.5rem' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Txn ID</th>
                <th>Description</th>
                <th>Type</th>
                <th className="num">Debit</th>
                <th className="num">Credit</th>
                <th className="num">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {group.openingBalance !== 0 && (
                <tr style={{ fontStyle: 'italic', backgroundColor: '#f8fafc' }}>
                  <td>{report.fromDate}</td>
                  <td>—</td>
                  <td>Beginning / Opening Balance</td>
                  <td>—</td>
                  <td className="num">—</td>
                  <td className="num">—</td>
                  <td className="num" style={{ fontWeight: 600 }}>{formatCurrency(group.openingBalance)}</td>
                </tr>
              )}
              {group.transactions.map((txn) => (
                <tr key={txn.id}>
                  <td>{txn.date}</td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: '#64748b' }}>{txn.id}</td>
                  <td>{txn.description}</td>
                  <td><span className={`badge badge-${txn.type}`}>{txn.type}</span></td>
                  <td className="num">{txn.type === 'debit' ? formatCurrency(txn.amount) : '—'}</td>
                  <td className="num">{txn.type === 'credit' ? formatCurrency(txn.amount) : '—'}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{formatCurrency(txn.runningBalance)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                <td colSpan={4}>Total Activity for {group.accountId}</td>
                <td className="num" style={{ color: '#dc2626' }}>{formatCurrency(group.totalDebits)}</td>
                <td className="num" style={{ color: '#16a34a' }}>{formatCurrency(group.totalCredits)}</td>
                <td className="num" style={{ color: '#2563eb' }}>{formatCurrency(group.closingBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
