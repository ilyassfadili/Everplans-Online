/**
 * Formats a planner's price for public-site display - the one place cents
 * become a dollar string for the marketing site, mirroring
 * `@/lib/wedding/currency.ts`'s `formatCurrency` but kept separate rather
 * than imported from there: that module belongs to the authenticated
 * Wedding Planner's own budget domain, not the public catalog's pricing
 * concept, even though the underlying formatting logic is the same shape.
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
