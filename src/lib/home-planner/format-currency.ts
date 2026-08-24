/**
 * Home Planner's own currency formatter - integer cents to a USD display
 * string. Deliberately its own small module rather than reused from
 * `@/lib/format-price` (public site) or `@/lib/budget/currency`
 * (Budget Planner) - each product keeps its own formatter on purpose (see
 * `@/lib/format-price`'s own comment), and Home Planner has no
 * multi-currency need Budget Planner's version exists for. Shared across
 * every Home Planner feature that shows a dollar amount (Inventory, Bills,
 * ...) - one formatter for the whole product, not one per feature.
 */
export function formatMoney(cents: number | null): string {
  if (cents === null) return "Not set";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
