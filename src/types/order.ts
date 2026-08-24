/**
 * The Everplans-authoritative order/purchase record - `public.orders`
 * (Everplans Money Prompt 3's "order foundation"). Deliberately distinct
 * from PayPal's own order/payment state: `status` here only ever changes in
 * response to a *verified* server-side check against PayPal's API (see
 * `@/lib/orders`'s own comment) - creating a PayPal order never, by itself,
 * means a customer paid.
 *
 * `plannerId` references `public.planner_definitions` - the same generic
 * product-identity table `public.entitlements` already keys off (see
 * `@/types/entitlement`) - so a future second paid product reuses this exact
 * table and lifecycle without a schema change. `productSlug`/`productName`/
 * `unitAmountCents`/`currency` are a snapshot taken at checkout time, not a
 * live join - a later price or copy change must never rewrite history for
 * an order that already happened.
 */

/**
 * The order's own lifecycle, independent of what PayPal reports for the
 * underlying payment (see this file's own top comment). `created` - just
 * initiated, no PayPal order yet. `pending` - a PayPal order exists but
 * hasn't been verified as paid. `paid` - server-side verification against
 * PayPal succeeded; the only status eligible for entitlement/access
 * creation. `failed`/`cancelled` - the attempt didn't complete, never
 * automatically retried into `paid`. `refunded` - a `paid` order was
 * reversed (webhook-driven, Prompt 3 Phase 4's own scope).
 */
export type OrderStatus = "created" | "pending" | "paid" | "failed" | "cancelled" | "refunded";

export interface Order {
  id: string;
  userId: string;
  plannerId: string;
  productSlug: string;
  productName: string;
  quantity: number;
  currency: string;
  /** Snapshot of the per-unit price at checkout time, in integer minor units (cents) - never re-derived from the product config later. */
  unitAmountCents: number;
  /** `unitAmountCents * quantity` at checkout time - the amount this order actually charges, independent of any later price change. */
  amountCents: number;
  status: OrderStatus;
  paymentProvider: string;
  /** PayPal's own order id (`EC-...`/a v2 order id) - `null` until the PayPal-side order is created. */
  providerOrderId: string | null;
  /** PayPal's own capture id - `null` until a successful capture. This, paired with `paymentProvider`, is the idempotency key `markOrderPaid` checks before applying a capture twice. */
  providerCaptureId: string | null;
  /** `null` until `status` becomes `paid`. */
  paidAt: string | null;
  /** `null` until `status` becomes `refunded` (Everplans Money Prompt 5's refund foundation). */
  refundedAt: string | null;
  /** PayPal's own refund id - `null` until refunded. Paired with `paymentProvider`, the idempotency key `markOrderRefunded` checks before applying a refund twice. */
  providerRefundId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
