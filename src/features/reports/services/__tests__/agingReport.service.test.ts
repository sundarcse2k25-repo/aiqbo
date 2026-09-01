import { describe, it, expect } from 'vitest'
import { generateReceivablesAging, generatePayablesAging } from '../agingReport.service'
import type { Invoice, Bill, Customer, Vendor, JournalEntry } from '@/types/accounting.types'
import type { ControlAccountGroups } from '../../utils/controlAccounts'

const controlAccounts: ControlAccountGroups = {
  cashAccountIds: ['ACC-CASH'],
  bankAccountIds: ['ACC-BANK'],
  accountsReceivableIds: ['ACC-AR'],
  accountsPayableIds: ['ACC-AP'],
  retainedEarningsAccountId: 'ACC-EQU',
}

/** A customer payment entry: Bank debit + AR credit against one documentId. */
function arPaymentEntry(id: string, date: string, documentId: string, amount: number, arAccountId: string = controlAccounts.accountsReceivableIds[0]): JournalEntry {
  return {
    id,
    date,
    description: id,
    sourceType: 'payment',
    sourceId: id,
    lines: [
      { id: `${id}-BANK`, accountId: controlAccounts.bankAccountIds[0], accountType: 'asset', debit: amount, credit: 0, description: 'Bank' },
      { id: `${id}-AR`, accountId: arAccountId, accountType: 'asset', debit: 0, credit: amount, description: 'AR', documentId },
    ],
  }
}

/** A vendor payment entry: AP debit against one documentId + Bank credit. */
function apPaymentEntry(id: string, date: string, documentId: string, amount: number, apAccountId: string = controlAccounts.accountsPayableIds[0]): JournalEntry {
  return {
    id,
    date,
    description: id,
    sourceType: 'payment',
    sourceId: id,
    lines: [
      { id: `${id}-AP`, accountId: apAccountId, accountType: 'liability', debit: amount, credit: 0, description: 'AP', documentId },
      { id: `${id}-BANK`, accountId: controlAccounts.bankAccountIds[0], accountType: 'asset', debit: 0, credit: amount, description: 'Bank' },
    ],
  }
}

/** One payment entry with multiple AR-credit lines applied to different invoices. */
function arMultiDocumentPaymentEntry(id: string, date: string, allocations: { documentId: string; amount: number }[]): JournalEntry {
  const total = allocations.reduce((sum, a) => sum + a.amount, 0)
  return {
    id,
    date,
    description: id,
    sourceType: 'payment',
    sourceId: id,
    lines: [
      { id: `${id}-BANK`, accountId: controlAccounts.bankAccountIds[0], accountType: 'asset', debit: total, credit: 0, description: 'Bank' },
      ...allocations.map((a, i) => ({
        id: `${id}-AR-${i}`,
        accountId: controlAccounts.accountsReceivableIds[0],
        accountType: 'asset' as const,
        debit: 0,
        credit: a.amount,
        description: 'AR',
        documentId: a.documentId,
      })),
    ],
  }
}

const customers: Customer[] = [
  { id: 'CUST-1', name: 'Client A' },
  { id: 'CUST-2', name: 'Client B' },
]

const vendors: Vendor[] = [
  { id: 'VEND-1', name: 'Supplier X' },
]

describe('AgingReportService — bucket boundaries (unchanged from before migration)', () => {
  // asOfDate = 2026-06-30, no payments — outstanding equals the full invoice
  // amount for every invoice, exactly like the pre-migration behavior.
  const invoices: Invoice[] = [
    { id: 'INV-1', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 10000 },
    { id: 'INV-2', customerId: 'CUST-1', date: '2026-05-15', dueDate: '2026-06-15', status: 'sent', lines: [], totalAmount: 20000 },
    { id: 'INV-3', customerId: 'CUST-2', date: '2026-04-01', dueDate: '2026-05-01', status: 'sent', lines: [], totalAmount: 30000 },
    { id: 'INV-4', customerId: 'CUST-2', date: '2026-01-01', dueDate: '2026-02-01', status: 'sent', lines: [], totalAmount: 40000 },
  ]

  const bills: Bill[] = [
    { id: 'BILL-1', vendorId: 'VEND-1', date: '2026-05-10', dueDate: '2026-06-10', status: 'received', lines: [], totalAmount: 15000 },
  ]

  it('correctly categorizes receivables into aging buckets', () => {
    const report = generateReceivablesAging(invoices, customers, [], controlAccounts, '2026-06-30')

    expect(report.reportType).toBe('AR_AGING')
    expect(report.totalOutstanding).toBe(100000)
    expect(report.summary.current).toBe(10000)
    expect(report.summary.days1_30).toBe(20000)
    expect(report.summary.days31_60).toBe(30000)
    expect(report.summary.days61_90).toBe(0)
    expect(report.summary.over90).toBe(40000)
    expect(report.rows.length).toBe(2)
  })

  it('correctly categorizes payables into aging buckets', () => {
    const report = generatePayablesAging(bills, vendors, [], controlAccounts, '2026-06-30')

    expect(report.reportType).toBe('AP_AGING')
    expect(report.totalOutstanding).toBe(15000)
    expect(report.summary.days1_30).toBe(15000)
    expect(report.rows.length).toBe(1)
  })
})

describe('AR — ledger-derived outstanding', () => {
  const asOfDate = '2026-06-30'

  it('1. fully unpaid invoice: outstanding equals the full total', () => {
    const inv: Invoice = { id: 'INV-1', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 100000 }
    const report = generateReceivablesAging([inv], customers, [], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(100000)
  })

  it('2. fully paid invoice: does not appear in the report', () => {
    const inv: Invoice = { id: 'INV-1', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'paid', lines: [], totalAmount: 100000 }
    const payment = arPaymentEntry('PAY-1', '2026-06-05', 'INV-1', 100000)
    const report = generateReceivablesAging([inv], customers, [payment], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(0)
    expect(report.rows.length).toBe(0)
  })

  it('3. partial payment: Invoice 100000, Payment 40000 -> outstanding 60000', () => {
    const inv: Invoice = { id: 'INV-1', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 100000 }
    const payment = arPaymentEntry('PAY-1', '2026-06-05', 'INV-1', 40000)
    const report = generateReceivablesAging([inv], customers, [payment], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(60000)
  })

  it('4. multiple payments accumulate: 20000 + 30000 + 10000 -> outstanding 40000', () => {
    const inv: Invoice = { id: 'INV-1', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 100000 }
    const payments = [
      arPaymentEntry('PAY-1', '2026-06-05', 'INV-1', 20000),
      arPaymentEntry('PAY-2', '2026-06-10', 'INV-1', 30000),
      arPaymentEntry('PAY-3', '2026-06-15', 'INV-1', 10000),
    ]
    const report = generateReceivablesAging([inv], customers, payments, controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(40000)
  })

  it('5/6. payment dated after asOfDate has no effect yet; the same payment applies once past its date', () => {
    const inv: Invoice = { id: 'INV-1', customerId: 'CUST-1', date: '2026-01-01', dueDate: '2026-01-31', status: 'sent', lines: [], totalAmount: 100000 }
    const payment = arPaymentEntry('PAY-1', '2026-03-01', 'INV-1', 40000)

    const asOf1 = generateReceivablesAging([inv], customers, [payment], controlAccounts, '2026-02-01')
    expect(asOf1.totalOutstanding).toBe(100000) // payment not yet applied as of this date

    const asOf2 = generateReceivablesAging([inv], customers, [payment], controlAccounts, '2026-04-01')
    expect(asOf2.totalOutstanding).toBe(60000) // now applied
  })

  it('6b. invoice date determines the aging bucket, not the payment date', () => {
    // Invoice dated 2026-01-01, due 2026-01-31, payment dated 2026-02-15.
    // As of 2026-02-10 the invoice is still fully outstanding and must age
    // from its own due date (10 days past due -> days1_30), not be reset
    // by the payment that hasn't happened yet.
    const inv: Invoice = { id: 'INV-1', customerId: 'CUST-1', date: '2026-01-01', dueDate: '2026-01-31', status: 'sent', lines: [], totalAmount: 100000 }
    const payment = arPaymentEntry('PAY-1', '2026-02-15', 'INV-1', 100000)

    const beforePayment = generateReceivablesAging([inv], customers, [payment], controlAccounts, '2026-02-10')
    expect(beforePayment.totalOutstanding).toBe(100000)
    expect(beforePayment.summary.days1_30).toBe(100000)

    const afterPayment = generateReceivablesAging([inv], customers, [payment], controlAccounts, '2026-02-20')
    expect(afterPayment.totalOutstanding).toBe(0)
  })

  it('7. multiple invoices with separate payments are tracked independently', () => {
    const invA: Invoice = { id: 'INV-A', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 50000 }
    const invB: Invoice = { id: 'INV-B', customerId: 'CUST-2', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 70000 }
    const payments = [
      arPaymentEntry('PAY-A', '2026-06-05', 'INV-A', 50000), // fully pays INV-A
      arPaymentEntry('PAY-B', '2026-06-05', 'INV-B', 20000), // partially pays INV-B
    ]
    const report = generateReceivablesAging([invA, invB], customers, payments, controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(50000) // only INV-B's remaining 50000
    expect(report.rows.length).toBe(1)
    expect(report.rows[0].entityId).toBe('CUST-2')
  })

  it('8. one payment allocated to multiple invoices via multiple AR-credit lines in a single JournalEntry', () => {
    const invA: Invoice = { id: 'INV-A', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 40000 }
    const invB: Invoice = { id: 'INV-B', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 25000 }
    const singlePayment = arMultiDocumentPaymentEntry('PAY-COMBINED', '2026-06-05', [
      { documentId: 'INV-A', amount: 40000 },
      { documentId: 'INV-B', amount: 25000 },
    ])
    const report = generateReceivablesAging([invA, invB], customers, [singlePayment], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(0) // both fully settled by the one payment
  })

  it('9. draft invoice never contributes to AR aging', () => {
    const draft: Invoice = { id: 'INV-DRAFT', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'draft', lines: [], totalAmount: 999999 }
    const report = generateReceivablesAging([draft], customers, [], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(0)
  })

  it('10. void invoice never contributes to AR aging', () => {
    const voided: Invoice = { id: 'INV-VOID', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'void', lines: [], totalAmount: 999999 }
    const report = generateReceivablesAging([voided], customers, [], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(0)
  })

  it('11. zero-balance invoice (total 0) never appears as outstanding', () => {
    const zero: Invoice = { id: 'INV-ZERO', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 0 }
    const report = generateReceivablesAging([zero], customers, [], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(0)
    expect(report.rows.length).toBe(0)
  })

  it('12. overpayment: applied payments exceed the invoice total -> outstanding clamps to 0, not negative', () => {
    const inv: Invoice = { id: 'INV-1', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 100000 }
    const payment = arPaymentEntry('PAY-1', '2026-06-05', 'INV-1', 120000)
    const report = generateReceivablesAging([inv], customers, [payment], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(0)
    expect(report.totalOutstanding >= 0).toBe(true)
  })
})

describe('AR — multiple Accounts Receivable accounts (e.g. "AR - Trade" + "AR - Other")', () => {
  // A company with two separate AR accounts. controlAccounts here carries
  // both ids in accountsReceivableIds; a payment applied against either
  // account must be recognized, and neither account may be silently
  // ignored (the pre-Phase-1 single-accountsReceivableId design would drop
  // whichever account wasn't the resolved one).
  const multiArControlAccounts: ControlAccountGroups = {
    ...controlAccounts,
    accountsReceivableIds: ['ACC-AR-TRADE', 'ACC-AR-OTHER'],
  }
  const asOfDate = '2026-06-30'
  const customersMulti = [
    { id: 'CUST-1', name: 'Client A' },
    { id: 'CUST-2', name: 'Client B' },
  ]

  it('nets payments applied against either AR account for the same invoice', () => {
    const inv: Invoice = { id: 'INV-1', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 100000 }
    // Paid via the "AR - Other" account rather than "AR - Trade".
    const payment = arPaymentEntry('PAY-1', '2026-06-05', 'INV-1', 40000, 'ACC-AR-OTHER')
    const report = generateReceivablesAging([inv], customersMulti, [payment], multiArControlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(60000)
  })

  it('aggregates outstanding balances across invoices settled through different AR accounts', () => {
    const invA: Invoice = { id: 'INV-A', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 50000 }
    const invB: Invoice = { id: 'INV-B', customerId: 'CUST-2', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 70000 }
    const payments = [
      arPaymentEntry('PAY-A', '2026-06-05', 'INV-A', 50000, 'ACC-AR-TRADE'), // fully pays INV-A via AR-Trade
      arPaymentEntry('PAY-B', '2026-06-05', 'INV-B', 20000, 'ACC-AR-OTHER'), // partially pays INV-B via AR-Other
    ]
    const report = generateReceivablesAging([invA, invB], customersMulti, payments, multiArControlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(50000) // only INV-B's remaining 50000, regardless of which AR account it moved through
  })

  it('a single AR account (accountsReceivableIds with one entry) still behaves exactly as before', () => {
    const singleArControlAccounts: ControlAccountGroups = { ...controlAccounts, accountsReceivableIds: ['ACC-AR'] }
    const inv: Invoice = { id: 'INV-1', customerId: 'CUST-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'sent', lines: [], totalAmount: 100000 }
    const payment = arPaymentEntry('PAY-1', '2026-06-05', 'INV-1', 40000)
    const report = generateReceivablesAging([inv], customersMulti, [payment], singleArControlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(60000)
  })
})

describe('AP — multiple Accounts Payable accounts (e.g. "AP - Vendors" + "AP - Contractors")', () => {
  const multiApControlAccounts: ControlAccountGroups = {
    ...controlAccounts,
    accountsPayableIds: ['ACC-AP-VENDORS', 'ACC-AP-CONTRACTORS'],
  }
  const asOfDate = '2026-06-30'

  it('nets payments applied against either AP account for the same bill', () => {
    const bill: Bill = { id: 'BILL-1', vendorId: 'VEND-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'received', lines: [], totalAmount: 50000 }
    const payment = apPaymentEntry('PAY-1', '2026-06-05', 'BILL-1', 20000, 'ACC-AP-CONTRACTORS')
    const report = generatePayablesAging([bill], vendors, [payment], multiApControlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(30000)
  })

  it('aggregates outstanding balances across bills settled through different AP accounts', () => {
    const billA: Bill = { id: 'BILL-A', vendorId: 'VEND-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'received', lines: [], totalAmount: 30000 }
    const billB: Bill = { id: 'BILL-B', vendorId: 'VEND-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'received', lines: [], totalAmount: 40000 }
    const payments = [
      apPaymentEntry('PAY-A', '2026-06-05', 'BILL-A', 30000, 'ACC-AP-VENDORS'), // fully pays BILL-A via AP-Vendors
      apPaymentEntry('PAY-B', '2026-06-05', 'BILL-B', 10000, 'ACC-AP-CONTRACTORS'), // partially pays BILL-B via AP-Contractors
    ]
    const report = generatePayablesAging([billA, billB], vendors, payments, multiApControlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(30000) // only BILL-B's remaining 30000
  })
})

describe('AP — ledger-derived outstanding (mirrors AR)', () => {
  const asOfDate = '2026-06-30'

  it('13. fully unpaid bill: outstanding equals the full total', () => {
    const bill: Bill = { id: 'BILL-1', vendorId: 'VEND-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'received', lines: [], totalAmount: 50000 }
    const report = generatePayablesAging([bill], vendors, [], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(50000)
  })

  it('14. fully paid bill: does not appear in the report', () => {
    const bill: Bill = { id: 'BILL-1', vendorId: 'VEND-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'paid', lines: [], totalAmount: 50000 }
    const payment = apPaymentEntry('PAY-1', '2026-06-05', 'BILL-1', 50000)
    const report = generatePayablesAging([bill], vendors, [payment], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(0)
    expect(report.rows.length).toBe(0)
  })

  it('15. partial vendor payment: Bill 50000, Payment 20000 -> outstanding 30000', () => {
    const bill: Bill = { id: 'BILL-1', vendorId: 'VEND-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'received', lines: [], totalAmount: 50000 }
    const payment = apPaymentEntry('PAY-1', '2026-06-05', 'BILL-1', 20000)
    const report = generatePayablesAging([bill], vendors, [payment], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(30000)
  })

  it('16. multiple vendor payments accumulate', () => {
    const bill: Bill = { id: 'BILL-1', vendorId: 'VEND-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'received', lines: [], totalAmount: 50000 }
    const payments = [
      apPaymentEntry('PAY-1', '2026-06-05', 'BILL-1', 10000),
      apPaymentEntry('PAY-2', '2026-06-10', 'BILL-1', 15000),
    ]
    const report = generatePayablesAging([bill], vendors, payments, controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(25000)
  })

  it('17. vendor payment dated after asOfDate has no effect yet', () => {
    const bill: Bill = { id: 'BILL-1', vendorId: 'VEND-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'received', lines: [], totalAmount: 50000 }
    const payment = apPaymentEntry('PAY-1', '2026-07-05', 'BILL-1', 50000)
    const report = generatePayablesAging([bill], vendors, [payment], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(50000)
  })

  it('18. draft bill never contributes to AP aging', () => {
    const draft: Bill = { id: 'BILL-DRAFT', vendorId: 'VEND-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'draft', lines: [], totalAmount: 999999 }
    const report = generatePayablesAging([draft], vendors, [], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(0)
  })

  it('19. void bill never contributes to AP aging', () => {
    const voided: Bill = { id: 'BILL-VOID', vendorId: 'VEND-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'void', lines: [], totalAmount: 999999 }
    const report = generatePayablesAging([voided], vendors, [], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(0)
  })

  it('20. vendor overpayment clamps to 0, not negative', () => {
    const bill: Bill = { id: 'BILL-1', vendorId: 'VEND-1', date: '2026-06-01', dueDate: '2026-07-01', status: 'received', lines: [], totalAmount: 50000 }
    const payment = apPaymentEntry('PAY-1', '2026-06-05', 'BILL-1', 70000)
    const report = generatePayablesAging([bill], vendors, [payment], controlAccounts, asOfDate)
    expect(report.totalOutstanding).toBe(0)
    expect(report.totalOutstanding >= 0).toBe(true)
  })
})
