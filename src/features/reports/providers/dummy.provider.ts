import type {
  Transaction,
  Account,
  Invoice,
  Bill,
  Customer,
  Vendor,
} from '@/types/accounting.types'
import type {
  DataProvider,
  TransactionQueryFilter,
} from '../types/reporting.contracts'
import {
  DUMMY_TRANSACTIONS,
  DUMMY_ACCOUNTS,
  DUMMY_INVOICES,
  DUMMY_BILLS,
  DUMMY_CUSTOMERS,
  DUMMY_VENDORS,
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
   * Retrieves transactions, optionally filtered by date range or accounts.
   */
  getTransactions(filter?: TransactionQueryFilter): Transaction[] {
    let results = DUMMY_TRANSACTIONS

    if (filter?.fromDate && filter?.toDate) {
      results = filterByDateRange(results, filter.fromDate, filter.toDate)
    }

    if (filter?.accountIds && filter.accountIds.length > 0) {
      const idSet = new Set(filter.accountIds)
      results = results.filter((txn) => idSet.has(txn.accountId))
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
}

/** Singleton instance for general use */
export const dummyDataProvider = new DummyDataProvider()
