import type {
  JournalEntry,
  Account,
  Invoice,
  Bill,
  Customer,
  Vendor,
  Payment,
} from '@/types/accounting.types'
import type {
  DataProvider,
  TransactionQueryFilter,
} from '../types/reporting.contracts'
import {
  DUMMY_JOURNAL_ENTRIES,
  DUMMY_ACCOUNTS,
  DUMMY_INVOICES,
  DUMMY_BILLS,
  DUMMY_CUSTOMERS,
  DUMMY_VENDORS,
  DUMMY_PAYMENTS,
} from '@/data/dummy'
import { filterByDateRange } from '../utils/dateFilters'

/**
 * Data provider that serves locally defined dummy accounting records.
 *
 * Implements the same DataProvider contract that a future QBODataProvider
 * will implement.
 */
export class DummyDataProvider implements DataProvider {
  /**
   * Retrieves double-entry journal entries, optionally filtered by date range.
   */
  getJournalEntries(filter?: TransactionQueryFilter): JournalEntry[] {
    let results = DUMMY_JOURNAL_ENTRIES

    if (filter?.fromDate && filter?.toDate) {
      results = filterByDateRange(results, filter.fromDate, filter.toDate)
    }

    return results
  }

  getAccounts(): Account[] {
    return DUMMY_ACCOUNTS
  }

  getInvoices(): Invoice[] {
    return DUMMY_INVOICES
  }

  getBills(): Bill[] {
    return DUMMY_BILLS
  }

  getCustomers(): Customer[] {
    return DUMMY_CUSTOMERS
  }

  getVendors(): Vendor[] {
    return DUMMY_VENDORS
  }

  getPayments(): Payment[] {
    return DUMMY_PAYMENTS
  }
}

/** Singleton instance for general use */
export const dummyDataProvider = new DummyDataProvider()
