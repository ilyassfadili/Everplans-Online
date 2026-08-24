/**
 * Currency formatting - pure, no database access. All monetary amounts are
 * persisted as integer cents (`Trip.totalBudgetCents`, `TripBudgetCategory.plannedAmountCents`,
 * etc.) and only ever converted to a display string here, at the boundary,
 * never stored as a formatted or floating-point value. Same implementation
 * as `@/lib/wedding/currency` - not imported from there directly, since
 * Travel Planner's money helpers are meant to stay independent of Wedding
 * Planner's (two different products that happen to share a pattern, not a
 * shared dependency between them).
 */
export function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Parses a user-typed amount ("1,250" / "1250.50" / "$1250") into whole
 * cents, or `null` if it isn't a valid non-negative amount. Rounds rather
 * than truncates, so "10.005" (a typo, not a real cent value) doesn't
 * silently lose a cent.
 */
export function parseAmountToCents(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return null;

  return Math.round(amount * 100);
}
