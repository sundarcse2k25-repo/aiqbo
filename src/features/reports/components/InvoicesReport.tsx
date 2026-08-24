import type { Invoice, Customer } from '@/types/accounting.types'
import { formatCurrency } from '@/utils/formatCurrency'

interface Props {
  invoices: Invoice[]
  customers: Customer[]
}

export default function InvoicesReport({ invoices, customers }: Props) {
  const customerMap = new Map(customers.map((c) => [c.id, c.name]))
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length

  return (
    <div className="report-container">
      <h2 className="report-title">Invoices (Accounts Receivable)</h2>
      <p className="report-subtitle">
        Customer sales records and collection statuses
      </p>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-title">Total Invoices</div>
          <div className="summary-card-value">{invoices.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Total Invoiced Amount</div>
          <div className="summary-card-value" style={{ color: '#2563eb' }}>
            {formatCurrency(totalInvoiced)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Paid / Settled</div>
          <div className="summary-card-value" style={{ color: '#16a34a' }}>
            {paidCount} of {invoices.length}
          </div>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Due Date</th>
            <th>Customer</th>
            <th>Line Items</th>
            <th>Status</th>
            <th className="num">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{inv.id}</td>
              <td>{inv.date}</td>
              <td>{inv.dueDate}</td>
              <td><strong>{customerMap.get(inv.customerId) || inv.customerId}</strong></td>
              <td>
                {inv.lines.map((l) => (
                  <div key={l.id} style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {l.description} ({l.quantity} × {formatCurrency(l.unitPrice)})
                  </div>
                ))}
              </td>
              <td>
                <span className={`badge badge-${inv.status}`}>
                  {inv.status}
                </span>
              </td>
              <td className="num" style={{ fontWeight: 600 }}>
                {formatCurrency(inv.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
