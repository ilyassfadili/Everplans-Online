/**
 * Currency formatting - pure, no database access. Life Planner itself has no
 * monetary domain of its own; this exists solely so its checkout page
 * (`@/app/(app)/app/life-planner/checkout/page.tsx`) can format
 * `LIFE_PLANNER_PRODUCT.priceCents` the same way every other product's
 * checkout does. Same implementation as `@/lib/travel/currency` - not
 * imported from there directly, since each product's money helpers are
 * meant to stay independent of another product's (two different products
 * that happen to share a pattern, not a shared dependency between them; see
 * that module's own comment for the same reasoning).
 */
export function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
