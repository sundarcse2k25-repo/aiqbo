import type { ExpenseReport as ExpenseReportType } from '../types/report.types'
import { formatCurrency } from '@/utils/formatCurrency'

interface Props {
  report: ExpenseReportType
}

export default function ExpensesReport({ report }: Props) {
  return (
    <div className="report-container">
      <h2 className="report-title">{report.title}</h2>
      <p className="report-subtitle">{report.periodLabel}</p>

      {/* Summary KPI Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-title">Total Expenses</div>
          <div className="summary-card-value" style={{ color: '#dc2626' }}>
            {formatCurrency(report.totalExpenses)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Cost of Goods Sold (COGS)</div>
          <div className="summary-card-value" style={{ color: '#ea580c' }}>
            {formatCurrency(report.totalCOGS)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Operating Expenses (OPEX)</div>
          <div className="summary-card-value" style={{ color: '#be185d' }}>
            {formatCurrency(report.totalOperatingExpenses)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Paid vs. Unpaid</div>
          <div className="summary-card-value" style={{ fontSize: '1rem' }}>
            <span style={{ color: '#16a34a' }}>{formatCurrency(report.paidExpenses)}</span>
            {' / '}
            <span style={{ color: '#d97706' }}>{formatCurrency(report.unpaidExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Breakdown by Vendor */}
      <h3 style={{ fontSize: '1.1rem', marginTop: '2rem', marginBottom: '0.75rem', color: '#1e293b' }}>
        Expenses Breakdown by Vendor
      </h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Vendor Name</th>
            <th style={{ textAlign: 'center' }}>Bills</th>
            <th className="num">Paid Amount</th>
            <th className="num">Unpaid Amount</th>
            <th className="num">Total Amount</th>
            <th className="num">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {report.byVendor.map((v) => (
            <tr key={v.vendorId}>
              <td><strong>{v.vendorName}</strong></td>
              <td style={{ textAlign: 'center' }}>{v.billCount}</td>
              <td className="num" style={{ color: '#16a34a' }}>{formatCurrency(v.paidAmount)}</td>
              <td className="num" style={{ color: '#d97706' }}>{formatCurrency(v.unpaidAmount)}</td>
              <td className="num" style={{ fontWeight: 600 }}>{formatCurrency(v.totalAmount)}</td>
              <td className="num"><span className="badge badge-debit">{v.percentageOfTotal}%</span></td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
            <td>Total</td>
            <td style={{ textAlign: 'center' }}>{report.totalBills}</td>
            <td className="num" style={{ color: '#16a34a' }}>{formatCurrency(report.paidExpenses)}</td>
            <td className="num" style={{ color: '#d97706' }}>{formatCurrency(report.unpaidExpenses)}</td>
            <td className="num">{formatCurrency(report.totalExpenses)}</td>
            <td className="num">100.0%</td>
          </tr>
        </tbody>
      </table>

      {/* Breakdown by Category / Account */}
      <h3 style={{ fontSize: '1.1rem', marginTop: '2.5rem', marginBottom: '0.75rem', color: '#1e293b' }}>
        Expenses by Category / Account
      </h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Account Code</th>
            <th>Category Name</th>
            <th>Type</th>
            <th className="num">Total Amount</th>
            <th className="num">% Share</th>
          </tr>
        </thead>
        <tbody>
          {report.byCategory.map((cat) => (
            <tr key={cat.accountId}>
              <td style={{ fontFamily: 'JetBrains Mono' }}>{cat.accountId}</td>
              <td><strong>{cat.accountName}</strong></td>
              <td><span className={`badge badge-${cat.accountType}`}>{cat.accountType}</span></td>
              <td className="num" style={{ fontWeight: 600 }}>{formatCurrency(cat.totalAmount)}</td>
              <td className="num"><span className="badge badge-draft">{cat.percentageOfTotal}%</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
