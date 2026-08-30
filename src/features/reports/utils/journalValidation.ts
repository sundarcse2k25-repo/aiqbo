import type { JournalEntry } from '@/types/accounting.types'

/**
 * Journal entry balance validation.
 *
 * The fundamental double-entry rule: for every JournalEntry, the sum of
 * its lines' debits must equal the sum of its lines' credits.
 */

export function getEntryDebitTotal(entry: JournalEntry): number {
  return entry.lines.reduce((sum, line) => sum + line.debit, 0)
}

export function getEntryCreditTotal(entry: JournalEntry): number {
  return entry.lines.reduce((sum, line) => sum + line.credit, 0)
}

export function isJournalEntryBalanced(entry: JournalEntry): boolean {
  return getEntryDebitTotal(entry) === getEntryCreditTotal(entry)
}

/**
 * Throws if the given JournalEntry does not balance. Intended to be called
 * at generation time (data layer) so an unbalanced entry fails fast, before
 * it ever reaches the reporting engine.
 */
export function validateJournalEntry(entry: JournalEntry): void {
  const debitTotal = getEntryDebitTotal(entry)
  const creditTotal = getEntryCreditTotal(entry)
  if (debitTotal !== creditTotal) {
    throw new Error(
      `JournalEntry ${entry.id} does not balance: total debits ${debitTotal} !== total credits ${creditTotal}`,
    )
  }
}
