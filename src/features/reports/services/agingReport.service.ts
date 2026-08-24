import type { Invoice, Bill, Customer, Vendor } from '@/types/accounting.types'
import type {
  AgingReport,
  AgingBucketValues,
  EntityAgingRow,
} from '../types/report.types'
import type {
  ReportRequest,
  ReportService,
  DataProvider,
} from '../types/reporting.contracts'

export interface AgingReportRequest extends ReportRequest {
  agingType: 'RECEIVABLES' | 'PAYABLES'
  asOfDate: string
}

function calculateDaysPastDue(dueDate: string, asOfDate: string): number {
  const due = new Date(dueDate + 'T00:00:00').getTime()
  const asOf = new Date(asOfDate + 'T00:00:00').getTime()
  return Math.floor((asOf - due) / (1000 * 60 * 60 * 24))
}

function createEmptyBucket(): AgingBucketValues {
  return {
    current: 0,
    days1_30: 0,
    days31_60: 0,
    days61_90: 0,
    over90: 0,
    total: 0,
  }
}

function placeInBucket(bucket: AgingBucketValues, amount: number, daysPastDue: number) {
  bucket.total += amount
  if (daysPastDue <= 0) {
    bucket.current += amount
  } else if (daysPastDue <= 30) {
    bucket.days1_30 += amount
  } else if (daysPastDue <= 60) {
    bucket.days31_60 += amount
  } else if (daysPastDue <= 90) {
    bucket.days61_90 += amount
  } else {
    bucket.over90 += amount
  }
}

/**
 * Generates an Accounts Receivable (AR) Aging Summary Report.
 *
 * Evaluates unpaid customer invoices against the asOfDate.
 */
export function generateReceivablesAging(
  invoices: Invoice[],
  customers: Customer[],
  asOfDate: string,
  periodLabel: string = `AR Aging as of ${asOfDate}`,
): AgingReport {
  const customerMap = new Map<string, string>(customers.map((c) => [c.id, c.name]))

  // Invoices up to asOfDate that are unpaid (sent, overdue, draft)
  const outstandingInvoices = invoices.filter(
    (inv) => inv.date <= asOfDate && (inv.status === 'sent' || inv.status === 'overdue'),
  )

  const summary = createEmptyBucket()
  const entityRowsMap = new Map<string, { bucket: AgingBucketValues; count: number }>()

  for (const inv of outstandingInvoices) {
    const daysPastDue = calculateDaysPastDue(inv.dueDate, asOfDate)
    placeInBucket(summary, inv.totalAmount, daysPastDue)

    const entry = entityRowsMap.get(inv.customerId) || { bucket: createEmptyBucket(), count: 0 }
    entry.count += 1
    placeInBucket(entry.bucket, inv.totalAmount, daysPastDue)
    entityRowsMap.set(inv.customerId, entry)
  }

  const rows: EntityAgingRow[] = []
  entityRowsMap.forEach((entry, customerId) => {
    rows.push({
      entityId: customerId,
      entityName: customerMap.get(customerId) || customerId,
      documentCount: entry.count,
      ...entry.bucket,
    })
  })

  rows.sort((a, b) => b.total - a.total)

  return {
    reportType: 'AR_AGING',
    title: 'Accounts Receivable (AR) Aging Summary',
    agingType: 'RECEIVABLES',
    periodLabel,
    fromDate: '1970-01-01',
    toDate: asOfDate,
    asOfDate,
    generatedAt: new Date().toISOString(),
    totalOutstanding: summary.total,
    summary,
    rows,
  }
}

/**
 * Generates an Accounts Payable (AP) Aging Summary Report.
 *
 * Evaluates unpaid vendor bills against the asOfDate.
 */
export function generatePayablesAging(
  bills: Bill[],
  vendors: Vendor[],
  asOfDate: string,
  periodLabel: string = `AP Aging as of ${asOfDate}`,
): AgingReport {
  const vendorMap = new Map<string, string>(vendors.map((v) => [v.id, v.name]))

  // Bills up to asOfDate that are unpaid (received, overdue)
  const outstandingBills = bills.filter(
    (b) => b.date <= asOfDate && (b.status === 'received' || b.status === 'overdue'),
  )

  const summary = createEmptyBucket()
  const entityRowsMap = new Map<string, { bucket: AgingBucketValues; count: number }>()

  for (const bill of outstandingBills) {
    const daysPastDue = calculateDaysPastDue(bill.dueDate, asOfDate)
    placeInBucket(summary, bill.totalAmount, daysPastDue)

    const entry = entityRowsMap.get(bill.vendorId) || { bucket: createEmptyBucket(), count: 0 }
    entry.count += 1
    placeInBucket(entry.bucket, bill.totalAmount, daysPastDue)
    entityRowsMap.set(bill.vendorId, entry)
  }

  const rows: EntityAgingRow[] = []
  entityRowsMap.forEach((entry, vendorId) => {
    rows.push({
      entityId: vendorId,
      entityName: vendorMap.get(vendorId) || vendorId,
      documentCount: entry.count,
      ...entry.bucket,
    })
  })

  rows.sort((a, b) => b.total - a.total)

  return {
    reportType: 'AP_AGING',
    title: 'Accounts Payable (AP) Aging Summary',
    agingType: 'PAYABLES',
    periodLabel,
    fromDate: '1970-01-01',
    toDate: asOfDate,
    asOfDate,
    generatedAt: new Date().toISOString(),
    totalOutstanding: summary.total,
    summary,
    rows,
  }
}

/**
 * Aging Report Service.
 */
export class AgingReportService implements ReportService<AgingReportRequest, AgingReport> {
  async generate(request: AgingReportRequest, provider: DataProvider): Promise<AgingReport> {
    if (request.agingType === 'RECEIVABLES') {
      const invoices = provider.getInvoices ? await provider.getInvoices() : []
      const customers = provider.getCustomers ? await provider.getCustomers() : []
      return generateReceivablesAging(invoices, customers, request.asOfDate, request.periodLabel)
    } else {
      const bills = provider.getBills ? await provider.getBills() : []
      const vendors = provider.getVendors ? await provider.getVendors() : []
      return generatePayablesAging(bills, vendors, request.asOfDate, request.periodLabel)
    }
  }

  generateSync(request: AgingReportRequest, provider: DataProvider): AgingReport {
    if (request.agingType === 'RECEIVABLES') {
      const invoices = (provider.getInvoices ? provider.getInvoices() : []) as Invoice[]
      const customers = (provider.getCustomers ? provider.getCustomers() : []) as Customer[]
      return generateReceivablesAging(invoices, customers, request.asOfDate, request.periodLabel)
    } else {
      const bills = (provider.getBills ? provider.getBills() : []) as Bill[]
      const vendors = (provider.getVendors ? provider.getVendors() : []) as Vendor[]
      return generatePayablesAging(bills, vendors, request.asOfDate, request.periodLabel)
    }
  }
}

export const agingReportService = new AgingReportService()
