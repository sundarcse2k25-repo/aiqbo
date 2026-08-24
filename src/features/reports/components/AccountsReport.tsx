import type { Account } from '@/types/accounting.types'

interface Props {
  accounts: Account[]
}

export default function AccountsReport({ accounts }: Props) {
  return (
    <div className="report-container">
      <h2 className="report-title">Chart of Accounts</h2>
      <p className="report-subtitle">
        Master list of {accounts.length} configured accounting ledger accounts
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Account Code</th>
            <th>Account Name</th>
            <th>Type</th>
            <th>Sub-Type</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc) => (
            <tr key={acc.id}>
              <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{acc.id}</td>
              <td><strong>{acc.name}</strong></td>
              <td>
                <span className={`badge badge-${acc.type}`}>
                  {acc.type}
                </span>
              </td>
              <td style={{ color: '#64748b' }}>{acc.subType || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
