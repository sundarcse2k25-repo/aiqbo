import type { Payment, JournalEntry } from '@/types/accounting.types'

/**
 * Payment allocation utilities for the reporting engine.
 *
 * The domain model already supports many-to-one payment allocation: a
 * Payment references a single invoice/bill via `referenceId`, and any
 * number of Payment records may share the same `referenceId` (partial
 * payments, or a payment plus a later top-up). No change to the Payment,
 * Invoice, or Bill types was needed — outstanding amounts are a derived
 * value, computed here rather than stored, so the model stays
 * provider-independent (QBO also reports payments as separate objects
 * linked to an invoice/bill, not as a field on the invoice/bill itself).
 */

/**
 * Sums all payments allocated to a given invoice/bill id.
 */
export function getAllocatedPaymentTotal(documentId: string, payments: Payment[]): number {
  return payments
    .filter((p) => p.referenceId === documentId)
    .reduce((sum, p) => sum + p.amount, 0)
}

/**
 * Computes the outstanding (unpaid) amount for an invoice/bill: its total
 * minus all payments allocated against it. Clamped at 0 so an over-payment
 * never produces a negative outstanding balance.
 */
export function getOutstandingAmount(documentTotal: number, documentId: string, payments: Payment[]): number {
  const allocated = getAllocatedPaymentTotal(documentId, payments)
  return Math.max(0, documentTotal - allocated)
}

// ---------------------------------------------------------------------------
// Ledger-derived allocation (used by Aging as of the double-entry migration)
// ---------------------------------------------------------------------------
//
// getOutstandingAmount() above computes outstanding directly from Payment[]
// and is kept for the domain-model-support tests it already had. Aging
// instead needs the ledger's view: it must respect asOfDate (a payment
// dated after the report date must not reduce the balance) and must be
// able to see a payment applied to a document via any JournalEntryLine
// carrying that document's id — including a future entry with several
// AR-credit lines against different documentIds in one payment, which
// Payment[] (one record, one referenceId) cannot represent but JournalEntry
// already can.

/**
 * Sums the AR-credit or AP-debit lines posted against one document
 * (documentId) on a given control account, up to and including asOfDate.
 * This is the "applied" amount: payments and credits that have reduced the
 * document's balance as of that date.
 */
export function getLedgerAppliedAmount(
  journalEntries: JournalEntry[],
  documentId: string,
  controlAccountId: string,
  side: 'debit' | 'credit',
  asOfDate: string,
): number {
  let applied = 0
  for (const entry of journalEntries) {
    if (entry.date > asOfDate) continue
    for (const line of entry.lines) {
      if (line.accountId !== controlAccountId) continue
      if (line.documentId !== documentId) continue
      applied += side === 'debit' ? line.debit : line.credit
    }
  }
  return applied
}

/**
 * Computes the outstanding amount for one invoice/bill from the ledger:
 * the document's original total minus everything applied against it
 * (payments, credits) as of asOfDate. Clamped at 0 — an over-payment
 * reduces the outstanding balance to zero rather than going negative; the
 * excess is not currently exposed anywhere in the report output (see the
 * overpayment limitation documented alongside the Aging Report).
 */
export function getLedgerOutstandingAmount(
  documentTotal: number,
  journalEntries: JournalEntry[],
  documentId: string,
  controlAccountId: string,
  side: 'debit' | 'credit',
  asOfDate: string,
): number {
  const applied = getLedgerAppliedAmount(journalEntries, documentId, controlAccountId, side, asOfDate)
  return Math.max(0, documentTotal - applied)
}
