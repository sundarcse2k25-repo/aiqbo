import type { Invoice, Customer } from '@/types/accounting.types'
import type {
  SalesReport,
  CustomerSalesBreakdown,
  ItemSalesBreakdown,
} from '../types/report.types'
import type {
  ReportRequest,
  ReportService,
  DataProvider,
} from '../types/reporting.contracts'

/**
 * Generates a Sales Breakdown report by Customer and Product/Service.
 *
 * Pure function with zero external side effects.
 */
export function generateSalesReport(
  invoices: Invoice[],
  customers: Customer[],
  fromDate: string,
  toDate: string,
  periodLabel: string = `${fromDate} – ${toDate}`,
): SalesReport {
  const customerMap = new Map<string, string>(customers.map((c) => [c.id, c.name]))

  // Filter invoices in range
  const periodInvoices = invoices.filter(
    (inv) => inv.date >= fromDate && inv.date <= toDate && inv.status !== 'void',
  )

  const totalSales = periodInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalInvoices = periodInvoices.length
  const paidSales = periodInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const unpaidSales = totalSales - paidSales
  const averageInvoiceValue = totalInvoices > 0 ? Math.round(totalSales / totalInvoices) : 0

  // 1. Group by Customer
  const customerTotals = new Map<string, {
    count: number
    total: number
    paid: number
  }>()

  for (const inv of periodInvoices) {
    const existing = customerTotals.get(inv.customerId) || { count: 0, total: 0, paid: 0 }
    existing.count += 1
    existing.total += inv.totalAmount
    if (inv.status === 'paid') {
      existing.paid += inv.totalAmount
    }
    customerTotals.set(inv.customerId, existing)
  }

  const byCustomer: CustomerSalesBreakdown[] = []
  customerTotals.forEach((val, customerId) => {
    byCustomer.push({
      customerId,
      customerName: customerMap.get(customerId) || customerId,
      invoiceCount: val.count,
      totalAmount: val.total,
      paidAmount: val.paid,
      unpaidAmount: val.total - val.paid,
      percentageOfTotal: totalSales > 0 ? Number(((val.total / totalSales) * 100).toFixed(1)) : 0,
    })
  })

  // Sort by highest sales volume
  byCustomer.sort((a, b) => b.totalAmount - a.totalAmount)

  // 2. Group by Product / Service Line
  const itemTotals = new Map<string, { description: string; quantity: number; amount: number }>()

  for (const inv of periodInvoices) {
    for (const line of inv.lines) {
      const key = `${line.accountId}-${line.description}`
      const existing = itemTotals.get(key) || { description: line.description, quantity: 0, amount: 0 }
      existing.quantity += line.quantity
      existing.amount += line.amount
      itemTotals.set(key, existing)
    }
  }

  const byItem: ItemSalesBreakdown[] = []
  itemTotals.forEach((val, key) => {
    const accountId = key.split('-')[0]
    byItem.push({
      accountId,
      description: val.description,
      quantity: val.quantity,
      totalAmount: val.amount,
      percentageOfTotal: totalSales > 0 ? Number(((val.amount / totalSales) * 100).toFixed(1)) : 0,
    })
  })

  byItem.sort((a, b) => b.totalAmount - a.totalAmount)

  return {
    reportType: 'SALES_REPORT',
    title: 'Sales Summary Report',
    periodLabel,
    fromDate,
    toDate,
    generatedAt: new Date().toISOString(),
    totalSales,
    totalInvoices,
    paidSales,
    unpaidSales,
    averageInvoiceValue,
    byCustomer,
    byItem,
  }
}

/**
 * Sales Report Service.
 */
export class SalesReportService implements ReportService<ReportRequest, SalesReport> {
  async generate(request: ReportRequest, provider: DataProvider): Promise<SalesReport> {
    const invoices = provider.getInvoices ? await provider.getInvoices() : []
    const customers = provider.getCustomers ? await provider.getCustomers() : []
    const periodLabel = request.periodLabel || `${request.fromDate} – ${request.toDate}`

    return generateSalesReport(invoices, customers, request.fromDate, request.toDate, periodLabel)
  }

  generateSync(request: ReportRequest, provider: DataProvider): SalesReport {
    const invoices = (provider.getInvoices ? provider.getInvoices() : []) as Invoice[]
    const customers = (provider.getCustomers ? provider.getCustomers() : []) as Customer[]
    const periodLabel = request.periodLabel || `${request.fromDate} – ${request.toDate}`

    return generateSalesReport(invoices, customers, request.fromDate, request.toDate, periodLabel)
  }
}

export const salesReportService = new SalesReportService()
