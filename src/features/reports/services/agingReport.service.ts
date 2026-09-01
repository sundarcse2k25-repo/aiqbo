import type { Invoice, Bill, Customer, Vendor, JournalEntry, Account } from '@/types/accounting.types'
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
import { resolveControlAccountGroups, type ControlAccountGroups } from '../utils/controlAccounts'
import { getLedgerOutstandingAmount } from '../utils/paymentAllocation'

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
 * Outstanding is calculated per invoice from the double-entry ledger, not
 * from Invoice.status:
 *
 *   outstanding = invoice.totalAmount − (AR-credit lines posted against
 *                 that invoice's documentId, on or before asOfDate, across
 *                 every account playing the Accounts Receivable role)
 *
 * A company may have more than one AR account (e.g. "AR - Trade" and
 * "AR - Other"); controlAccounts.accountsReceivableIds carries all of them,
 * and every one is netted so no AR account is silently ignored.
 *
 * Invoice.status is used only to exclude documents that were never
 * recognized in the first place ('draft') or were cancelled ('void') — the
 * same recognition rule already enforced when the invoice's own JournalEntry
 * was generated (see journalEntries.ts). It is never used to decide whether
 * an invoice is outstanding; that is a ledger fact, not a status label.
 */
export function generateReceivablesAging(
  invoices: Invoice[],
  customers: Customer[],
  journalEntries: JournalEntry[],
  controlAccounts: ControlAccountGroups,
  asOfDate: string,
  periodLabel: string = `AR Aging as of ${asOfDate}`,
): AgingReport {
  const customerMap = new Map<string, string>(customers.map((c) => [c.id, c.name]))

  // Every invoice that was ever recognized (not void/draft) and dated on
  // or before asOfDate is a candidate — whether it still has a balance is
  // determined below from the ledger, not from inv.status.
  const recognizedInvoices = invoices.filter(
    (inv) => inv.date <= asOfDate && inv.status !== 'void' && inv.status !== 'draft',
  )

  const summary = createEmptyBucket()
  const entityRowsMap = new Map<string, { bucket: AgingBucketValues; count: number }>()

  for (const inv of recognizedInvoices) {
    const outstanding = getLedgerOutstandingAmount(
      inv.totalAmount,
      journalEntries,
      inv.id,
      controlAccounts.accountsReceivableIds,
      'credit',
      asOfDate,
    )
    // Fully paid (or not yet applicable as of asOfDate has already been
    // filtered above by inv.date) — nothing left to age.
    if (outstanding <= 0) continue

    const daysPastDue = calculateDaysPastDue(inv.dueDate, asOfDate)
    placeInBucket(summary, outstanding, daysPastDue)

    const entry = entityRowsMap.get(inv.customerId) || { bucket: createEmptyBucket(), count: 0 }
    entry.count += 1
    placeInBucket(entry.bucket, outstanding, daysPastDue)
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
 * Outstanding is calculated per bill from the double-entry ledger, not
 * from Bill.status:
 *
 *   outstanding = bill.totalAmount − (AP-debit lines posted against
 *                 that bill's documentId, on or before asOfDate, across
 *                 every account playing the Accounts Payable role)
 *
 * A company may have more than one AP account (e.g. "AP - Vendors" and
 * "AP - Contractors"); controlAccounts.accountsPayableIds carries all of
 * them, and every one is netted so no AP account is silently ignored.
 *
 * Bill.status is used only to exclude documents that were never
 * recognized ('draft') or were cancelled ('void') — see the symmetric
 * note on generateReceivablesAging above.
 */
export function generatePayablesAging(
  bills: Bill[],
  vendors: Vendor[],
  journalEntries: JournalEntry[],
  controlAccounts: ControlAccountGroups,
  asOfDate: string,
  periodLabel: string = `AP Aging as of ${asOfDate}`,
): AgingReport {
  const vendorMap = new Map<string, string>(vendors.map((v) => [v.id, v.name]))

  const recognizedBills = bills.filter(
    (b) => b.date <= asOfDate && b.status !== 'void' && b.status !== 'draft',
  )

  const summary = createEmptyBucket()
  const entityRowsMap = new Map<string, { bucket: AgingBucketValues; count: number }>()

  for (const bill of recognizedBills) {
    const outstanding = getLedgerOutstandingAmount(
      bill.totalAmount,
      journalEntries,
      bill.id,
      controlAccounts.accountsPayableIds,
      'debit',
      asOfDate,
    )
    if (outstanding <= 0) continue

    const daysPastDue = calculateDaysPastDue(bill.dueDate, asOfDate)
    placeInBucket(summary, outstanding, daysPastDue)

    const entry = entityRowsMap.get(bill.vendorId) || { bucket: createEmptyBucket(), count: 0 }
    entry.count += 1
    placeInBucket(entry.bucket, outstanding, daysPastDue)
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
    const journalEntries = await provider.getJournalEntries()
    const accounts = await provider.getAccounts()
    const controlAccounts = resolveControlAccountGroups(accounts)

    if (request.agingType === 'RECEIVABLES') {
      const invoices = await provider.getInvoices()
      const customers = await provider.getCustomers()
      return generateReceivablesAging(invoices, customers, journalEntries, controlAccounts, request.asOfDate, request.periodLabel)
    } else {
      const bills = await provider.getBills()
      const vendors = await provider.getVendors()
      return generatePayablesAging(bills, vendors, journalEntries, controlAccounts, request.asOfDate, request.periodLabel)
    }
  }

  generateSync(request: AgingReportRequest, provider: DataProvider): AgingReport {
    const journalEntries = provider.getJournalEntries() as JournalEntry[]
    const accounts = provider.getAccounts() as Account[]
    const controlAccounts = resolveControlAccountGroups(accounts)

    if (request.agingType === 'RECEIVABLES') {
      const invoices = provider.getInvoices() as Invoice[]
      const customers = provider.getCustomers() as Customer[]
      return generateReceivablesAging(invoices, customers, journalEntries, controlAccounts, request.asOfDate, request.periodLabel)
    } else {
      const bills = provider.getBills() as Bill[]
      const vendors = provider.getVendors() as Vendor[]
      return generatePayablesAging(bills, vendors, journalEntries, controlAccounts, request.asOfDate, request.periodLabel)
    }
  }
}

export const agingReportService = new AgingReportService()
