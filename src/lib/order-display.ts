import type { Order, OrderStatus } from "@/types/order";

/**
 * Shared customer/operator-facing display logic for an order - "how do we
 * describe this order's status/date/reference to a human," independent of
 * layout. Used by both the customer-facing Purchase History/Order Details
 * (`src/app/(app)/app/purchases/`) and the commerce-ops Orders views
 * (`src/app/(app)/app/ops/`, Everplans Money Prompt 7) - promoted here from
 * `purchases/_components/order-display.ts` the moment a second route
 * needed it (`AGENTS.md`'s own "colocate until a second route needs it,
 * promote when one does"), the same reasoning every shared `src/lib/*`
 * formatting helper in this codebase already follows. Never renders
 * `order.status` directly as human copy - every status gets a real label
 * and a tone that matches what actually happened.
 */

type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "error" | "outline";

/**
 * `refunded` is deliberately `warning`, not `neutral`/`error`: it
 * communicates "this WAS paid, then reversed," not "never paid" (a plain
 * `neutral` reads too close to `cancelled`) and not a failure on the
 * customer's part either.
 */
export const orderStatusBadge: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  created: { label: "Pending", variant: "warning" },
  pending: { label: "Pending", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  failed: { label: "Failed", variant: "error" },
  cancelled: { label: "Cancelled", variant: "neutral" },
  refunded: { label: "Refunded", variant: "warning" },
};

/** A `paid` order's own current access state - only ever meaningful for a `paid` order; there is no access to describe for anything else. */
export const accessStatusBadge: Record<"active" | "revoked", { label: string; variant: BadgeVariant }> = {
  active: { label: "Active", variant: "success" },
  revoked: { label: "Revoked", variant: "neutral" },
};

const orderDateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

/** What the shown date actually represents, per status - paired with the date itself so the UI never shows a bare, unlabeled date. */
const orderDateLabel: Record<OrderStatus, string> = {
  created: "Started",
  pending: "Started",
  paid: "Paid",
  failed: "Attempted",
  cancelled: "Cancelled",
  refunded: "Paid",
};

/**
 * The one human-meaningful date for an order, formatted for display -
 * never a raw ISO string. `paid`/`refunded` show `paidAt` (falling back to
 * `createdAt` only in the defensive case a `paid` row somehow has no
 * `paidAt` yet); every other status shows `createdAt`, since there is no
 * `paidAt` to show.
 */
export function formatOrderDate(order: Order): { label: string; value: string } {
  const usesPaidAt = order.status === "paid" || order.status === "refunded";
  const iso = usesPaidAt ? (order.paidAt ?? order.createdAt) : order.createdAt;

  return { label: orderDateLabel[order.status], value: orderDateFormatter.format(new Date(iso)) };
}

/** A short, presentable order reference - never the raw UUID (`order.id`) in full. */
export function orderReference(order: Order): string {
  return `#${order.id.slice(0, 8).toUpperCase()}`;
}
