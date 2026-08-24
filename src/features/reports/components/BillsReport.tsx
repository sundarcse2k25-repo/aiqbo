import type { Bill, Vendor } from '@/types/accounting.types'
import { formatCurrency } from '@/utils/formatCurrency'

interface Props {
  bills: Bill[]
  vendors: Vendor[]
}

export default function BillsReport({ bills, vendors }: Props) {
  const vendorMap = new Map(vendors.map((v) => [v.id, v.name]))
  const totalBilled = bills.reduce((sum, b) => sum + b.totalAmount, 0)
  const paidCount = bills.filter((b) => b.status === 'paid').length

  return (
    <div className="report-container">
      <h2 className="report-title">Bills &amp; Expenses (Accounts Payable)</h2>
      <p className="report-subtitle">
        Vendor bills, infrastructure costs, and operational expenses
      </p>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-title">Total Bills</div>
          <div className="summary-card-value">{bills.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Total Billed Expenses</div>
          <div className="summary-card-value" style={{ color: '#dc2626' }}>
            {formatCurrency(totalBilled)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Paid / Settled</div>
          <div className="summary-card-value" style={{ color: '#16a34a' }}>
            {paidCount} of {bills.length}
          </div>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Bill #</th>
            <th>Date</th>
            <th>Due Date</th>
            <th>Vendor</th>
            <th>Description</th>
            <th>Status</th>
            <th className="num">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => (
            <tr key={bill.id}>
              <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{bill.id}</td>
              <td>{bill.date}</td>
              <td>{bill.dueDate}</td>
              <td><strong>{vendorMap.get(bill.vendorId) || bill.vendorId}</strong></td>
              <td>
                {bill.lines.map((l) => (
                  <div key={l.id} style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {l.description}
                  </div>
                ))}
              </td>
              <td>
                <span className={`badge badge-${bill.status}`}>
                  {bill.status}
                </span>
              </td>
              <td className="num" style={{ fontWeight: 600 }}>
                {formatCurrency(bill.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
