import type { SalesReport as SalesReportType } from '../types/report.types'
import { formatCurrency } from '@/utils/formatCurrency'

interface Props {
  report: SalesReportType
}

export default function SalesReport({ report }: Props) {
  return (
    <div className="report-container">
      <h2 className="report-title">{report.title}</h2>
      <p className="report-subtitle">{report.periodLabel}</p>

      {/* Summary KPI Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-title">Total Invoiced Sales</div>
          <div className="summary-card-value" style={{ color: '#2563eb' }}>
            {formatCurrency(report.totalSales)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Paid / Collected</div>
          <div className="summary-card-value" style={{ color: '#16a34a' }}>
            {formatCurrency(report.paidSales)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Outstanding / AR</div>
          <div className="summary-card-value" style={{ color: '#d97706' }}>
            {formatCurrency(report.unpaidSales)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Avg. Invoice Value</div>
          <div className="summary-card-value">
            {formatCurrency(report.averageInvoiceValue)}
          </div>
        </div>
      </div>

      {/* Breakdown by Customer */}
      <h3 style={{ fontSize: '1.1rem', marginTop: '2rem', marginBottom: '0.75rem', color: '#1e293b' }}>
        Sales Breakdown by Customer
      </h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Customer Name</th>
            <th style={{ textAlign: 'center' }}>Invoices</th>
            <th className="num">Paid Amount</th>
            <th className="num">Unpaid Amount</th>
            <th className="num">Total Sales</th>
            <th className="num">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {report.byCustomer.map((cust) => (
            <tr key={cust.customerId}>
              <td><strong>{cust.customerName}</strong></td>
              <td style={{ textAlign: 'center' }}>{cust.invoiceCount}</td>
              <td className="num" style={{ color: '#16a34a' }}>{formatCurrency(cust.paidAmount)}</td>
              <td className="num" style={{ color: '#d97706' }}>{formatCurrency(cust.unpaidAmount)}</td>
              <td className="num" style={{ fontWeight: 600 }}>{formatCurrency(cust.totalAmount)}</td>
              <td className="num">
                <span className="badge badge-sent">{cust.percentageOfTotal}%</span>
              </td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
            <td>Total</td>
            <td style={{ textAlign: 'center' }}>{report.totalInvoices}</td>
            <td className="num" style={{ color: '#16a34a' }}>{formatCurrency(report.paidSales)}</td>
            <td className="num" style={{ color: '#d97706' }}>{formatCurrency(report.unpaidSales)}</td>
            <td className="num">{formatCurrency(report.totalSales)}</td>
            <td className="num">100.0%</td>
          </tr>
        </tbody>
      </table>

      {/* Breakdown by Item/Service Line */}
      <h3 style={{ fontSize: '1.1rem', marginTop: '2.5rem', marginBottom: '0.75rem', color: '#1e293b' }}>
        Sales by Product / Service Line
      </h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Service / Product Line</th>
            <th>Account</th>
            <th style={{ textAlign: 'center' }}>Units / Hours</th>
            <th className="num">Total Amount</th>
            <th className="num">% Share</th>
          </tr>
        </thead>
        <tbody>
          {report.byItem.map((item) => (
            <tr key={`${item.accountId}-${item.description}`}>
              <td><strong>{item.description}</strong></td>
              <td><span className="badge badge-revenue">{item.accountId}</span></td>
              <td style={{ textAlign: 'center' }}>{item.quantity}</td>
              <td className="num" style={{ fontWeight: 600 }}>{formatCurrency(item.totalAmount)}</td>
              <td className="num"><span className="badge badge-draft">{item.percentageOfTotal}%</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
