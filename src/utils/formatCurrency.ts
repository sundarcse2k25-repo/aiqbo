/**
 * Formats a numeric amount as US Dollars ($).
 * e.g. 200000 -> "$200,000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}
