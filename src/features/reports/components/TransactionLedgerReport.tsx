import type { Transaction } from '@/types/accounting.types'
import { formatCurrency } from '@/utils/formatCurrency'

interface Props {
  transactions: Transaction[]
}

export default function TransactionLedgerReport({ transactions }: Props) {
  const totalDebits = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalCredits = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="report-container">
      <h2 className="report-title">Transaction Ledger</h2>
      <p className="report-subtitle">
        Showing all {transactions.length} derived transactions
      </p>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-title">Total Entries</div>
          <div className="summary-card-value">{transactions.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Total Credits (Inflow)</div>
          <div className="summary-card-value" style={{ color: '#16a34a' }}>
            {formatCurrency(totalCredits)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Total Debits (Outflow)</div>
          <div className="summary-card-value" style={{ color: '#dc2626' }}>
            {formatCurrency(totalDebits)}
          </div>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>ID</th>
            <th>Account</th>
            <th>Category</th>
            <th>Description</th>
            <th>Type</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn.id}>
              <td>{txn.date}</td>
              <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>{txn.id}</td>
              <td><strong>{txn.accountId}</strong></td>
              <td>
                <span className={`badge badge-${txn.accountType}`}>
                  {txn.accountType}
                </span>
              </td>
              <td>{txn.description}</td>
              <td>
                <span className={`badge badge-${txn.type}`}>
                  {txn.type}
                </span>
              </td>
              <td className="num" style={{ fontWeight: 600 }}>
                {formatCurrency(txn.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
