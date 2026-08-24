import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Order, OrderStatus } from "@/types/order";

/**
 * The commerce-ops read layer over `public.orders` - unlike
 * `@/lib/orders.ts`'s customer-facing functions (RLS-scoped to the
 * signed-in user's own rows), everything here uses the service-role client
 * to deliberately see EVERY customer's orders, because that's the entire
 * point of an operations view. Safe only because every caller of this
 * module is itself gated by `requireCommerceOperator()`
 * (`@/lib/commerce-ops/auth.ts`) before ever reaching here - never import
 * this from anything that hasn't already verified that.
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

const OPS_ORDERS_LIMIT = 200;

/**
 * Every order across every customer, most recent first, optionally
 * narrowed to one status - the Orders operations view's own read.
 * Deliberately capped (`OPS_ORDERS_LIMIT`) rather than unbounded - Prompt
 * 7's own "do not build a huge dashboard": an operator triaging recent
 * activity needs the newest orders, not the platform's entire history in
 * one page. A future "load more"/date-range filter can extend this without
 * changing the shape here.
 */
export async function getOrdersForOps(status?: OrderStatus): Promise<Order[]> {
  const supabase = createSupabaseServiceClient();

  let query = supabase.from("orders").select(ORDER_COLUMNS);
  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(OPS_ORDERS_LIMIT);

  if (error) {
    console.error("getOrdersForOps: failed to load orders", error);
    return [];
  }

  return (data ?? []).map(mapOrderRow);
}

/** A single order by id, for the Order Detail operations view - no ownership scoping (an operator can inspect any customer's order, which is the entire point). */
export async function getOrderForOps(orderId: string): Promise<Order | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", orderId).maybeSingle();

  if (error) {
    console.error("getOrderForOps: failed to load order", error);
    return null;
  }

  return data ? mapOrderRow(data) : null;
}

/**
 * The customer's own email, for the Order Detail view only (never the
 * Orders list, to avoid one admin-API call per row on a page that can show
 * up to `OPS_ORDERS_LIMIT` orders at once) - resolved via the Auth Admin
 * API (`auth.admin.getUserById`, only ever available through the
 * service-role client), since `auth.users.email` isn't queryable through
 * an ordinary `.from(...)` call and `public.profiles` doesn't store email
 * at all. Returns `null` on any failure rather than throwing - an order's
 * own detail is still worth showing even if the customer's email can't be
 * resolved for some reason (a deleted auth user, an API hiccup).
 */
export async function getCustomerEmailForOps(userId: string): Promise<string | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) {
    console.error("getCustomerEmailForOps: failed to load customer", error);
    return null;
  }

  return data.user.email ?? null;
}
