import { describe, it, expect } from 'vitest'
import {
  invoicesToJournalEntries,
  billsToJournalEntries,
  paymentsToJournalEntries,
  resolveControlAccounts,
  DUMMY_JOURNAL_ENTRIES,
} from '../journalEntries'
import { DUMMY_ACCOUNTS } from '../accounts'
import { DUMMY_INVOICES } from '../invoices'
import { DUMMY_BILLS } from '../bills'
import { isJournalEntryBalanced, getEntryDebitTotal, getEntryCreditTotal } from '../../../features/reports/utils/journalValidation'
import { generateProfitAndLoss } from '../../../features/reports/services/profitAndLoss.service'
import type { Invoice, Bill, Payment } from '@/types/accounting.types'

const accountMap = new Map(DUMMY_ACCOUNTS.map((a) => [a.id, a]))
const controlAccounts = resolveControlAccounts(DUMMY_ACCOUNTS)

describe('Journal entry balance invariant', () => {
  it('every generated dummy journal entry balances: total debit === total credit', () => {
    for (const entry of DUMMY_JOURNAL_ENTRIES) {
      expect(isJournalEntryBalanced(entry)).toBe(true)
    }
  })

  it('the full dummy journal balances in aggregate too', () => {
    const totalDebits = DUMMY_JOURNAL_ENTRIES.reduce((sum, e) => sum + getEntryDebitTotal(e), 0)
    const totalCredits = DUMMY_JOURNAL_ENTRIES.reduce((sum, e) => sum + getEntryCreditTotal(e), 0)
    expect(totalDebits).toBe(totalCredits)
  })
})

describe('invoicesToJournalEntries', () => {
  it('represents a ₹100,000 invoice as AR debit + Revenue credit', () => {
    const invoice: Invoice = {
      id: 'INV-TEST',
      customerId: 'CUST-1',
      date: '2026-01-10',
      dueDate: '2026-02-10',
      status: 'sent',
      lines: [{ id: 'L1', accountId: 'ACC-REV-001', description: 'Test sale', quantity: 1, unitPrice: 100000, amount: 100000 }],
      totalAmount: 100000,
    }

    const [entry] = invoicesToJournalEntries([invoice], accountMap, controlAccounts)
    expect(isJournalEntryBalanced(entry)).toBe(true)

    const arLine = entry.lines.find((l) => l.accountId === controlAccounts.accountsReceivableId)
    const revenueLine = entry.lines.find((l) => l.accountId === 'ACC-REV-001')
    expect(arLine?.debit).toBe(100000)
    expect(arLine?.credit).toBe(0)
    expect(revenueLine?.credit).toBe(100000)
    expect(revenueLine?.debit).toBe(0)
  })

  it('does not create a journal entry for a draft invoice', () => {
    const entries = invoicesToJournalEntries(DUMMY_INVOICES, accountMap, controlAccounts)
    expect(entries.some((e) => e.sourceId === 'INV-016')).toBe(false)
  })
})

describe('billsToJournalEntries', () => {
  it('represents a ₹50,000 bill as Expense debit + AP credit', () => {
    const bill: Bill = {
      id: 'BILL-TEST',
      vendorId: 'VEND-1',
      date: '2026-01-10',
      dueDate: '2026-02-10',
      status: 'received',
      lines: [{ id: 'L1', accountId: 'ACC-EXP-001', description: 'Test expense', quantity: 1, unitPrice: 50000, amount: 50000 }],
      totalAmount: 50000,
    }

    const [entry] = billsToJournalEntries([bill], accountMap, controlAccounts)
    expect(isJournalEntryBalanced(entry)).toBe(true)

    const expenseLine = entry.lines.find((l) => l.accountId === 'ACC-EXP-001')
    const apLine = entry.lines.find((l) => l.accountId === controlAccounts.accountsPayableId)
    expect(expenseLine?.debit).toBe(50000)
    expect(apLine?.credit).toBe(50000)
  })

  it('does not create a journal entry for a draft bill', () => {
    const draftBill: Bill = {
      id: 'BILL-DRAFT',
      vendorId: 'VEND-1',
      date: '2026-01-10',
      dueDate: '2026-02-10',
      status: 'draft',
      lines: [{ id: 'L1', accountId: 'ACC-EXP-001', description: 'Unconfirmed', quantity: 1, unitPrice: 999999, amount: 999999 }],
      totalAmount: 999999,
    }

    const entries = billsToJournalEntries([draftBill, ...DUMMY_BILLS], accountMap, controlAccounts)
    expect(entries.some((e) => e.sourceId === 'BILL-DRAFT')).toBe(false)
  })
})

describe('paymentsToJournalEntries', () => {
  it('represents a customer payment as Bank/Cash debit + AR credit', () => {
    const payment: Payment = { id: 'PAY-TEST', type: 'invoice', referenceId: 'INV-TEST', date: '2026-01-20', amount: 40000, method: 'bank_transfer' }
    const [entry] = paymentsToJournalEntries([payment], accountMap, controlAccounts)
    expect(isJournalEntryBalanced(entry)).toBe(true)

    const bankLine = entry.lines.find((l) => l.accountId === controlAccounts.bankAccountId)
    const arLine = entry.lines.find((l) => l.accountId === controlAccounts.accountsReceivableId)
    expect(bankLine?.debit).toBe(40000)
    expect(arLine?.credit).toBe(40000)
    expect(arLine?.documentId).toBe('INV-TEST')
  })

  it('represents a vendor payment as AP debit + Bank/Cash credit', () => {
    const payment: Payment = { id: 'PAY-TEST-2', type: 'bill', referenceId: 'BILL-TEST', date: '2026-01-20', amount: 20000, method: 'bank_transfer' }
    const [entry] = paymentsToJournalEntries([payment], accountMap, controlAccounts)
    expect(isJournalEntryBalanced(entry)).toBe(true)

    const apLine = entry.lines.find((l) => l.accountId === controlAccounts.accountsPayableId)
    const bankLine = entry.lines.find((l) => l.accountId === controlAccounts.bankAccountId)
    expect(apLine?.debit).toBe(20000)
    expect(bankLine?.credit).toBe(20000)
  })

  it('routes a cash-method payment to the Cash account, not Bank', () => {
    const payment: Payment = { id: 'PAY-TEST-3', type: 'invoice', referenceId: 'INV-TEST', date: '2026-01-20', amount: 5000, method: 'cash' }
    const [entry] = paymentsToJournalEntries([payment], accountMap, controlAccounts)
    const cashLine = entry.lines.find((l) => l.accountId === controlAccounts.cashAccountId)
    expect(cashLine?.debit).toBe(5000)
  })

  it('supports multiple partial payments against one invoice: 40000 + 30000, outstanding = 30000', () => {
    const payments: Payment[] = [
      { id: 'PAY-A', type: 'invoice', referenceId: 'INV-PARTIAL', date: '2026-01-10', amount: 40000, method: 'bank_transfer' },
      { id: 'PAY-B', type: 'invoice', referenceId: 'INV-PARTIAL', date: '2026-01-20', amount: 30000, method: 'bank_transfer' },
    ]
    const entries = paymentsToJournalEntries(payments, accountMap, controlAccounts)
    expect(entries.length).toBe(2)

    const totalApplied = entries
      .flatMap((e) => e.lines)
      .filter((l) => l.accountId === controlAccounts.accountsReceivableId && l.documentId === 'INV-PARTIAL')
      .reduce((sum, l) => sum + l.credit, 0)

    expect(totalApplied).toBe(70000)
    expect(100000 - totalApplied).toBe(30000)
  })
})

describe('P&L regression pin: migrated JournalEntry-based result matches the previously validated totals', () => {
  // The JournalEntry-based P&L was verified against an independent
  // Transaction-based reference implementation during migration (exact
  // match on every figure below). That legacy reference — and the
  // Transaction type, DUMMY_TRANSACTIONS, and transactions.ts it depended
  // on — has since been removed as dead code now that GL, Balance Sheet,
  // and P&L all run natively on JournalEntry[]. This pin preserves the
  // proof permanently without keeping the retired code path around.
  it('pins the migrated P&L to the previously validated full-year totals', () => {
    const report = generateProfitAndLoss(DUMMY_JOURNAL_ENTRIES, '2026-01-01', '2026-08-31')
    expect(report.totalRevenue).toBe(3774000)
    expect(report.totalCogs).toBe(525000)
    expect(report.grossProfit).toBe(3249000)
    expect(report.totalExpenses).toBe(425500)
    expect(report.netProfit).toBe(2823500)
  })
})
