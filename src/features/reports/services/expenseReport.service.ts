import type { Bill, Vendor, Account } from '@/types/accounting.types'
import type {
  ExpenseReport,
  VendorExpenseBreakdown,
  CategoryExpenseBreakdown,
} from '../types/report.types'
import type {
  ReportRequest,
  ReportService,
  DataProvider,
} from '../types/reporting.contracts'

/**
 * Generates an Expenses Breakdown report by Vendor and Category.
 *
 * Pure function with zero external side effects.
 */
export function generateExpenseReport(
  bills: Bill[],
  vendors: Vendor[],
  accounts: Account[],
  fromDate: string,
  toDate: string,
  periodLabel: string = `${fromDate} – ${toDate}`,
): ExpenseReport {
  const vendorMap = new Map<string, string>(vendors.map((v) => [v.id, v.name]))
  const accountMap = new Map<string, Account>(accounts.map((a) => [a.id, a]))

  // Draft bills have not been received/recorded as a liability and are
  // excluded from recognized expenses, matching the recognition rule used
  // by the P&L report (see transactions.ts). Void bills are cancelled.
  const periodBills = bills.filter(
    (b) =>
      b.date >= fromDate &&
      b.date <= toDate &&
      b.status !== 'void' &&
      b.status !== 'draft',
  )

  const totalExpenses = periodBills.reduce((sum, b) => sum + b.totalAmount, 0)
  const totalBills = periodBills.length
  const paidExpenses = periodBills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.totalAmount, 0)
  const unpaidExpenses = totalExpenses - paidExpenses

  let totalCOGS = 0
  let totalOperatingExpenses = 0

  // 1. Group by Vendor
  const vendorTotals = new Map<string, { count: number; total: number; paid: number }>()

  for (const bill of periodBills) {
    const existing = vendorTotals.get(bill.vendorId) || { count: 0, total: 0, paid: 0 }
    existing.count += 1
    existing.total += bill.totalAmount
    if (bill.status === 'paid') {
      existing.paid += bill.totalAmount
    }
    vendorTotals.set(bill.vendorId, existing)
  }

  const byVendor: VendorExpenseBreakdown[] = []
  vendorTotals.forEach((val, vendorId) => {
    byVendor.push({
      vendorId,
      vendorName: vendorMap.get(vendorId) || vendorId,
      billCount: val.count,
      totalAmount: val.total,
      paidAmount: val.paid,
      unpaidAmount: val.total - val.paid,
      percentageOfTotal: totalExpenses > 0 ? Number(((val.total / totalExpenses) * 100).toFixed(1)) : 0,
    })
  })

  byVendor.sort((a, b) => b.totalAmount - a.totalAmount)

  // 2. Group by Category / Account
  const categoryTotals = new Map<string, { total: number }>()

  for (const bill of periodBills) {
    for (const line of bill.lines) {
      const acc = accountMap.get(line.accountId)
      if (acc?.type === 'cogs') {
        totalCOGS += line.amount
      } else {
        totalOperatingExpenses += line.amount
      }

      const existing = categoryTotals.get(line.accountId) || { total: 0 }
      existing.total += line.amount
      categoryTotals.set(line.accountId, existing)
    }
  }

  const byCategory: CategoryExpenseBreakdown[] = []
  categoryTotals.forEach((val, accountId) => {
    const acc = accountMap.get(accountId)
    byCategory.push({
      accountId,
      accountName: acc?.name || accountId,
      accountType: acc?.type || 'expense',
      totalAmount: val.total,
      percentageOfTotal: totalExpenses > 0 ? Number(((val.total / totalExpenses) * 100).toFixed(1)) : 0,
    })
  })

  byCategory.sort((a, b) => b.totalAmount - a.totalAmount)

  return {
    reportType: 'EXPENSE_REPORT',
    title: 'Expenses Summary Report',
    periodLabel,
    fromDate,
    toDate,
    generatedAt: new Date().toISOString(),
    totalExpenses,
    totalCOGS,
    totalOperatingExpenses,
    totalBills,
    paidExpenses,
    unpaidExpenses,
    byVendor,
    byCategory,
  }
}

/**
 * Expense Report Service.
 */
export class ExpenseReportService implements ReportService<ReportRequest, ExpenseReport> {
  async generate(request: ReportRequest, provider: DataProvider): Promise<ExpenseReport> {
    const bills = await provider.getBills()
    const vendors = await provider.getVendors()
    const accounts = await provider.getAccounts()
    const periodLabel = request.periodLabel || `${request.fromDate} – ${request.toDate}`

    return generateExpenseReport(bills, vendors, accounts, request.fromDate, request.toDate, periodLabel)
  }

  generateSync(request: ReportRequest, provider: DataProvider): ExpenseReport {
    const bills = provider.getBills() as Bill[]
    const vendors = provider.getVendors() as Vendor[]
    const accounts = provider.getAccounts() as Account[]
    const periodLabel = request.periodLabel || `${request.fromDate} – ${request.toDate}`

    return generateExpenseReport(bills, vendors, accounts, request.fromDate, request.toDate, periodLabel)
  }
}

export const expenseReportService = new ExpenseReportService()
