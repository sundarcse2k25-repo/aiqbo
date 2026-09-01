/**
 * Placeholder for the future QBO → normalized-domain-model adapter
 * (Phase 5+: Account, Invoice, Bill, Payment, JournalEntry, CreditMemo,
 * VendorCredit mapping — see the QBO readiness audit for the full design).
 * Intentionally empty of mapping logic in Phase 2. This file exists only
 * to reserve the architectural slot: QBO response shapes get converted to
 * ../../../src/types/accounting.types.ts (the reporting engine's
 * normalized model) here, and nowhere else — the reporting engine itself
 * must stay QBO-independent.
 */
export {}
