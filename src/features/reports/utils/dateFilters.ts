/**
 * Date filtering utilities for the reporting engine.
 *
 * All dates in this system are ISO strings (YYYY-MM-DD).
 * String comparison is safe because ISO dates sort lexicographically.
 */

/**
 * Returns true if `date` falls within the inclusive range [fromDate, toDate].
 *
 * @param date      ISO date string to test (YYYY-MM-DD)
 * @param fromDate  Range start, inclusive (YYYY-MM-DD)
 * @param toDate    Range end, inclusive (YYYY-MM-DD)
 */
export function isInDateRange(
  date: string,
  fromDate: string,
  toDate: string,
): boolean {
  return date >= fromDate && date <= toDate
}

/**
 * Filters an array of objects that have a `date` field to only those within
 * the given date range.
 */
export function filterByDateRange<T extends { date: string }>(
  items: T[],
  fromDate: string,
  toDate: string,
): T[] {
  return items.filter((item) => isInDateRange(item.date, fromDate, toDate))
}
