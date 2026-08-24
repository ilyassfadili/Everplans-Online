import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Order, OrderStatus } from "@/types/order";

/**
 * The Everplans-authoritative order/purchase data-access layer -
 * `public.orders` (Everplans Money Prompt 3's order foundation). Every
 * status-changing function here uses the SERVICE-role client
 * (`createSupabaseServiceClient`, `@/lib/supabase/service.ts`), the same
 * privileged-write pattern `@/lib/commerce-provisioning.ts` already
 * established for `public.entitlements` - `orders`' own RLS policy grants
 * `authenticated` read-only access to a user's own rows and NO insert/
 * update/delete at all (see the migration), so a signed-in user's own
 * session could never perform these writes even by accident. Only code that
 * has independently verified something *outside* the user's own claim - a
 * server-side PayPal API response, a verified PayPal webhook signature -
 * should ever call the mutating functions here.
 *
 * Reads that a signed-in user is allowed to see their own result of
 * (`getOrderForCurrentUser`) instead go through the ordinary per-request
 * server client, so RLS's `user_id = auth.uid()` policy is the actual
 * enforcement, not merely an unlisted assumption - the checkout return page
 * still double-checks `order.userId === user.id` itself as defense in
 * depth, the same "don't trust one layer alone" principle
 * `getActiveEntitlement`'s own comment documents.
 */

const ORDER_COLUMNS =
  "id, user_id, planner_id, product_slug, product_name, quantity, currency, unit_amount_cents, amount_cents, status, payment_provider, provider_order_id, provider_capture_id, paid_at, refunded_at, provider_refund_id, metadata, created_at, updated_at";

type OrderRow = {
  id: string;
  user_id: string;
  planner_id: string;
  product_slug: string;
  product_name: string;
  quantity: number;
  currency: string;
  unit_amount_cents: number;
  amount_cents: number;
  status: string;
  payment_provider: string;
  provider_order_id: string | null;
  provider_capture_id: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  provider_refund_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    plannerId: row.planner_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    quantity: row.quantity,
    currency: row.currency,
    unitAmountCents: row.unit_amount_cents,
    amountCents: row.amount_cents,
    // Cast, not re-validated: `orders_status_valid` (the migration) already
    // guarantees the database can never hold anything outside this union.
    status: row.status as OrderStatus,
    paymentProvider: row.payment_provider,
    providerOrderId: row.provider_order_id,
    providerCaptureId: row.provider_capture_id,
    paidAt: row.paid_at,
    refundedAt: row.refunded_at,
    providerRefundId: row.provider_refund_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreatePendingOrderInput {
  userId: string;
  plannerId: string;
  productSlug: string;
  productName: string;
  unitAmountCents: number;
  currency: string;
  quantity?: number;
}

/**
 * Creates a brand-new order in `created` status - step 1 of the checkout
 * flow (Prompt 3 Phase 2: "Everplans creates an internal pending order"
 * before any PayPal order exists). `userId` must already be a
 * server-verified id (`requireUser()`), never a client-supplied value - the
 * only caller of this function is the checkout Server Action, which
 * resolves the session itself first.
 */
export async function createPendingOrder(input: CreatePendingOrderInput): Promise<Order> {
  const supabase = createSupabaseServiceClient();
  const quantity = input.quantity ?? 1;

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: input.userId,
      planner_id: input.plannerId,
      product_slug: input.productSlug,
      product_name: input.productName,
      quantity,
      currency: input.currency,
      unit_amount_cents: input.unitAmountCents,
      amount_cents: input.unitAmountCents * quantity,
      status: "created",
    })
    .select(ORDER_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("createPendingOrder: failed to create order", error);
    throw new Error("Couldn't start your order. Please try again.");
  }

  return mapOrderRow(data);
}

/**
 * Attaches the newly-created PayPal order id and moves the order to
 * `pending` - step 3 of the checkout flow, right after Everplans asks
 * PayPal to create the corresponding order. Still not `paid`: a PayPal
 * order existing is not proof of payment (this file's own top comment).
 */
export async function attachPayPalOrder(orderId: string, providerOrderId: string): Promise<Order> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "pending", provider_order_id: providerOrderId })
    .eq("id", orderId)
    .eq("status", "created")
    .select(ORDER_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    console.error("attachPayPalOrder: failed to attach PayPal order", error);
    throw new Error("Couldn't continue to PayPal. Please try again.");
  }

  return mapOrderRow(data);
}

export interface MarkOrderPaidInput {
  orderId: string;
  providerCaptureId: string;
  /** The amount PayPal actually captured, in cents - compared by the caller against `order.amountCents` before this is invoked; this function itself also refuses to record a mismatched amount as a defense-in-depth check. */
  capturedAmountCents: number;
  capturedCurrency: string;
}

/**
 * Marks an order `paid` - the ONLY function in this codebase allowed to set
 * that status, and only ever called after the caller has independently
 * verified a real PayPal capture (server-side API response or a verified
 * webhook). Idempotent and race-safe two ways:
 *
 * 1. `.eq("status", "pending")` on the update - a second concurrent call (a
 *    webhook arriving while the return-flow is also processing the same
 *    order) matches zero rows the second time, since the first call already
 *    moved the row past `pending`. Returns `null` in that case, which
 *    callers must treat as "already handled," not an error.
 * 2. `orders_provider_capture_id_unique` (the migration) - PayPal itself
 *    guarantees a given capture id is unique per payment, so even a bug
 *    that bypassed the `status` guard above would still fail at the
 *    database layer rather than silently recording a duplicate capture.
 *
 * Refuses to record a captured amount/currency that doesn't match what this
 * order expects - a defense-in-depth check on top of whatever the caller
 * already verified against PayPal's response, never the only check.
 */
export async function markOrderPaid(input: MarkOrderPaidInput): Promise<Order | null> {
  const supabase = createSupabaseServiceClient();

  const { data: existing, error: loadError } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", input.orderId)
    .maybeSingle();

  if (loadError || !existing) {
    console.error("markOrderPaid: failed to load order", loadError);
    return null;
  }

  if (existing.status === "paid") {
    // Already processed - a duplicate return-flow hit or a redelivered
    // webhook. A safe no-op, not an error (Prompt 3 Phase 3: "prevent
    // replaying the same successful transaction").
    return mapOrderRow(existing);
  }

  if (existing.amount_cents !== input.capturedAmountCents || existing.currency !== input.capturedCurrency) {
    console.error("markOrderPaid: captured amount/currency does not match the order", {
      orderId: input.orderId,
      expected: { amountCents: existing.amount_cents, currency: existing.currency },
      captured: { amountCents: input.capturedAmountCents, currency: input.capturedCurrency },
    });
    return null;
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      provider_capture_id: input.providerCaptureId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", input.orderId)
    .eq("status", "pending")
    .select(ORDER_COLUMNS)
    .maybeSingle();

  if (error) {
    // A unique-violation here (`23505`) means another concurrent request
    // already recorded this exact capture - not a real failure, the same
    // "duplicate delivery is expected, not a bug" reasoning
    // `grant_planner_entitlement` documents.
    if (error.code === "23505") {
      const { data: current } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", input.orderId).maybeSingle();
      return current ? mapOrderRow(current) : null;
    }

    console.error("markOrderPaid: failed to mark order paid", error);
    return null;
  }

  // `data` is null when the `.eq("status", "pending")` guard matched zero
  // rows - a concurrent call already moved this order past `pending`
  // between the load above and this update. Re-read and return its current
  // state rather than treating that race as a failure.
  if (!data) {
    const { data: current } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", input.orderId).maybeSingle();
    return current ? mapOrderRow(current) : null;
  }

  return mapOrderRow(data);
}

/**
 * Marks an order `failed` or `cancelled` - only ever from `created` or
 * `pending` (Everplans Money Prompt 6's own "does not accidentally
 * downgrade a successful order because of an unrelated or stale event"
 * hardening requirement). Deliberately an explicit allow-list
 * (`.in("status", ["created", "pending"])`), not merely `.neq("status",
 * "paid")` - the earlier, narrower guard correctly protected a `paid`
 * order but left `refunded` unprotected, so a stale/duplicate/out-of-order
 * cancel or capture-denied signal arriving after a refund had already been
 * recorded could otherwise overwrite that refund's own status with
 * `failed`, destroying real history. A completed purchase, in any of its
 * post-payment states, is never silently downgraded by a late signal.
 */
export async function markOrderTerminal(orderId: string, status: Extract<OrderStatus, "failed" | "cancelled">): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId).in("status", ["created", "pending"]);

  if (error) {
    console.error(`markOrderTerminal(${status}): failed to update order`, error);
  }
}

/**
 * Marks a previously-`paid` order `refunded` - the webhook-driven reversal
 * path (Prompt 3 Phase 4, extended with real refund provenance in Prompt 5
 * Phase 3). Only ever moves `paid` -> `refunded`, never any other
 * transition - `.eq("status", "paid")` makes a duplicate-delivered refund
 * event a safe no-op the same way `markOrderPaid`'s own `.eq("status",
 * "pending")` guard does, and `orders_provider_refund_id_unique` (the
 * migration) backs that at the database layer too. Never deletes or
 * overwrites the original purchase's own fields (`paid_at`,
 * `provider_capture_id`, `amount_cents`, ...) - a refunded order's full
 * purchase history stays intact and auditable, only `status`/`refunded_at`/
 * `provider_refund_id` change.
 */
export async function markOrderRefunded(orderId: string, providerRefundId?: string): Promise<Order | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "refunded",
      refunded_at: new Date().toISOString(),
      provider_refund_id: providerRefundId ?? null,
    })
    .eq("id", orderId)
    .eq("status", "paid")
    .select(ORDER_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      // Same "duplicate delivery already applied" no-op `markOrderPaid`
      // documents for its own unique-constraint race.
      const { data: current } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", orderId).maybeSingle();
      return current ? mapOrderRow(current) : null;
    }

    console.error("markOrderRefunded: failed to update order", error);
    return null;
  }

  if (!data) {
    // The `.eq("status", "paid")` guard matched zero rows - either already
    // refunded (redelivered event) or never reached `paid` in the first
    // place. Either way, re-read and return current state rather than
    // treating it as a failure.
    const { data: current } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", orderId).maybeSingle();
    return current ? mapOrderRow(current) : null;
  }

  return mapOrderRow(data);
}

/**
 * Looks up an order by its PayPal order id using the SERVICE client - the
 * one legitimate read-path outside RLS, because the webhook route
 * (`/api/webhooks/paypal`) has no user session at all to scope a normal
 * query by. Never exported for use from anything handling an ordinary
 * user's own request - see `getOrderForCurrentUser` for that.
 */
export async function getOrderByProviderOrderId(providerOrderId: string): Promise<Order | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("payment_provider", "paypal")
    .eq("provider_order_id", providerOrderId)
    .maybeSingle();

  if (error) {
    console.error("getOrderByProviderOrderId: failed to load order", error);
    return null;
  }

  return data ? mapOrderRow(data) : null;
}

/**
 * Looks up one of the CURRENT user's own orders by its PayPal order id -
 * the checkout return page's own read. Uses the ordinary per-request server
 * client (not the service client), so RLS's `user_id = auth.uid()` policy
 * is the real enforcement that this can never resolve another user's order;
 * `userId` is still checked again by the caller as defense in depth.
 */
export async function getOrderForCurrentUser(userId: string, providerOrderId: string): Promise<Order | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("user_id", userId)
    .eq("payment_provider", "paypal")
    .eq("provider_order_id", providerOrderId)
    .maybeSingle();

  if (error) {
    console.error("getOrderForCurrentUser: failed to load order", error);
    return null;
  }

  return data ? mapOrderRow(data) : null;
}

/**
 * The current user's full purchase history (Everplans Money Prompt 5) -
 * every order they've ever started, most recent first, regardless of
 * status (a `pending`/`failed`/`cancelled` attempt is still real history a
 * customer might reasonably want to see, not just their successful
 * purchases). Uses the ordinary per-request server client - RLS's
 * `user_id = auth.uid()` policy is the real enforcement, not this query's
 * own `.eq("user_id", ...)` alone, the same "don't trust one layer alone"
 * principle every other read in this file follows. Product-agnostic by
 * construction (no Budget Planner-specific filtering) - a future second
 * paid product's orders appear here automatically, satisfying Prompt 5's
 * own "reusable for future products" requirement without this function
 * ever changing.
 */
export async function getOrdersForCurrentUser(userId: string): Promise<Order[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getOrdersForCurrentUser: failed to load orders", error);
    return [];
  }

  return (data ?? []).map(mapOrderRow);
}

/**
 * A single order, for the current user's own Order Details view - scoped by
 * both `id` and `user_id` at the query layer (defense in depth on top of
 * RLS, the same pattern `getOrderForCurrentUser` already establishes). An
 * order that exists but belongs to someone else, or doesn't exist at all,
 * resolves identically to `null` - never distinguishable to the caller,
 * exactly like `getPlannerDefinitionBySlug`'s own reasoning for not
 * revealing "it exists but isn't yours" (`@/lib/planners.ts`).
 */
export async function getOrderForCurrentUserById(userId: string, orderId: string): Promise<Order | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", orderId).eq("user_id", userId).maybeSingle();

  if (error) {
    console.error("getOrderForCurrentUserById: failed to load order", error);
    return null;
  }

  return data ? mapOrderRow(data) : null;
}
