import { useState, useMemo } from 'react'
import type { DataProvider } from '@/features/reports/types/reporting.contracts'
import { dummyDataProvider } from '@/features/reports/providers/dummy.provider'

// Reporting Services
import { profitAndLossService } from '@/features/reports/services/profitAndLoss.service'
import { generalLedgerService } from '@/features/reports/services/generalLedger.service'
import { balanceSheetService } from '@/features/reports/services/balanceSheet.service'
import { salesReportService } from '@/features/reports/services/salesReport.service'
import { expenseReportService } from '@/features/reports/services/expenseReport.service'
import { agingReportService } from '@/features/reports/services/agingReport.service'

// Report View Components
import ProfitAndLossReport from '@/features/reports/components/ProfitAndLossReport'
import GeneralLedgerReport from '@/features/reports/components/GeneralLedgerReport'
import BalanceSheetReport from '@/features/reports/components/BalanceSheetReport'
import SalesReport from '@/features/reports/components/SalesReport'
import ExpensesReport from '@/features/reports/components/ExpensesReport'
import AgingReport from '@/features/reports/components/AgingReport'
import AccountsReport from '@/features/reports/components/AccountsReport'

type ReportTab = 'pnl' | 'balanceSheet' | 'gl' | 'sales' | 'expenses' | 'aging' | 'accounts'

interface ReportsPageProps {
  dataProvider?: DataProvider
}

export default function ReportsPage({ dataProvider = dummyDataProvider }: ReportsPageProps) {
  const currentYear = new Date().getFullYear()

  const [activeTab, setActiveTab] = useState<ReportTab>('pnl')
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`)
  const [toDate, setToDate] = useState(`${currentYear}-12-31`)
  const [agingType, setAgingType] = useState<'RECEIVABLES' | 'PAYABLES'>('RECEIVABLES')

  /** Build human-readable period label */
  const periodLabel = useMemo(() => {
    const from = new Date(fromDate + 'T00:00:00')
    const to = new Date(toDate + 'T00:00:00')

    const fromStr = from.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const toStr = to.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    return fromStr === toStr ? fromStr : `${fromStr} – ${toStr}`
  }, [fromDate, toDate])

  // 1. Profit & Loss Report
  const pnlReport = useMemo(
    () => profitAndLossService.generateSync({ fromDate, toDate, periodLabel }, dataProvider),
    [fromDate, toDate, periodLabel, dataProvider],
  )

  // 2. General Ledger Report
  const glReport = useMemo(
    () => generalLedgerService.generateSync({ fromDate, toDate, periodLabel }, dataProvider),
    [fromDate, toDate, periodLabel, dataProvider],
  )

  // 3. Balance Sheet Report (as of toDate)
  const balanceSheetReport = useMemo(
    () => balanceSheetService.generateSync({ fromDate, toDate, periodLabel: `As of ${toDate}` }, dataProvider),
    [fromDate, toDate, dataProvider],
  )

  // 4. Sales Report
  const salesReport = useMemo(
    () => salesReportService.generateSync({ fromDate, toDate, periodLabel }, dataProvider),
    [fromDate, toDate, periodLabel, dataProvider],
  )

  // 5. Expenses Report
  const expenseReport = useMemo(
    () => expenseReportService.generateSync({ fromDate, toDate, periodLabel }, dataProvider),
    [fromDate, toDate, periodLabel, dataProvider],
  )

  // 6. AR / AP Aging Report
  const agingReport = useMemo(
    () => agingReportService.generateSync(
      {
        fromDate,
        toDate,
        asOfDate: toDate,
        agingType,
        periodLabel: `${agingType === 'RECEIVABLES' ? 'AR' : 'AP'} Aging as of ${toDate}`,
      },
      dataProvider,
    ),
    [fromDate, toDate, agingType, dataProvider],
  )

  // Chart of accounts for the accounts tab
  const accounts = useMemo(
    () => (dataProvider.getAccounts ? dataProvider.getAccounts() : []) as ReturnType<typeof dummyDataProvider.getAccounts>,
    [dataProvider],
  )

  return (
    <div>
      {/* Header */}
      <nav className="nav-bar">
        <h1>AIQBO</h1>
        <span>Accounting Intelligence &amp; Reporting Engine</span>
      </nav>

      <div className="page-container">
        {/* Navigation Tabs */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'pnl' ? 'active' : ''}`}
            onClick={() => setActiveTab('pnl')}
          >
            📊 Profit &amp; Loss
          </button>
          <button
            className={`tab-button ${activeTab === 'balanceSheet' ? 'active' : ''}`}
            onClick={() => setActiveTab('balanceSheet')}
          >
            ⚖️ Balance Sheet
          </button>
          <button
            className={`tab-button ${activeTab === 'gl' ? 'active' : ''}`}
            onClick={() => setActiveTab('gl')}
          >
            📑 General Ledger
          </button>
          <button
            className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            📈 Sales Summary
          </button>
          <button
            className={`tab-button ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            💸 Expenses Summary
          </button>
          <button
            className={`tab-button ${activeTab === 'aging' ? 'active' : ''}`}
            onClick={() => setActiveTab('aging')}
          >
            ⏳ AR &amp; AP Aging
          </button>
          <button
            className={`tab-button ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            🏛 Chart of Accounts ({accounts.length})
          </button>
        </div>

        {/* Global Date Filter Controls (applicable to period and point-in-time reports) */}
        {activeTab !== 'accounts' && (
          <div className="report-controls">
            <label htmlFor="from-date">From</label>
            <input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <label htmlFor="to-date">To / As of</label>
            <input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        )}

        {/* Active Report View */}
        {activeTab === 'pnl' && <ProfitAndLossReport report={pnlReport} />}
        {activeTab === 'balanceSheet' && <BalanceSheetReport report={balanceSheetReport} />}
        {activeTab === 'gl' && <GeneralLedgerReport report={glReport} />}
        {activeTab === 'sales' && <SalesReport report={salesReport} />}
        {activeTab === 'expenses' && <ExpensesReport report={expenseReport} />}
        {activeTab === 'aging' && (
          <AgingReport
            report={agingReport}
            onToggleType={(type) => setAgingType(type)}
          />
        )}
        {activeTab === 'accounts' && <AccountsReport accounts={accounts} />}
      </div>
    </div>
  )
}
