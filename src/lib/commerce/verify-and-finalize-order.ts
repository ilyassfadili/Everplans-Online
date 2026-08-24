import "server-only";

import { grantPlannerAccess } from "@/lib/commerce-provisioning";
import { markOrderPaid, markOrderTerminal } from "@/lib/orders";
import { capturePayPalOrder, decimalStringToCents, getPayPalOrder, type PayPalOrder } from "@/lib/paypal/orders";
import type { Order } from "@/types/order";

/**
 * The one real "verify this order's payment with PayPal, and finalize it if
 * genuinely paid" operation - originally duplicated between
 * `checkout/return/page.tsx` (the customer's own browser round-trip) and
 * `/api/webhooks/paypal` (PayPal's own server-to-server delivery), and now
 * a third caller as of Everplans Money Prompt 7: the commerce-ops "safe
 * retry" action. Extracted here so all three callers share the exact same
 * verification logic rather than three copies that could quietly drift -
 * Prompt 7 Phase 3's own explicit requirement ("any retry operation must
 * reuse the existing idempotent commerce logic").
 *
 * Every step is a real server-side check against PayPal's API; nothing
 * here trusts `order`'s own `providerOrderId` as proof of anything beyond
 * "this is which PayPal order to go verify." Idempotent and race-safe by
 * construction: `markOrderPaid`'s own conditional `status = "pending"`
 * update (see its comment) means calling this function twice concurrently
 * for the same order can never produce two `paid` transitions or two
 * entitlement grants - the second caller's update simply matches zero rows
 * and the function reports `"already-paid"` (or whatever the order's
 * now-current status implies) instead.
 */
export type VerifyAndFinalizeOrderResult =
  | { status: "paid"; order: Order }
  | { status: "already-paid"; order: Order }
  | { status: "not-eligible" }
  | { status: "not-approved" }
  | { status: "verification-failed" }
  | { status: "capture-failed" }
  | { status: "mismatch" };

export async function verifyAndFinalizeOrder(order: Order): Promise<VerifyAndFinalizeOrderResult> {
  if (order.status === "paid") {
    return { status: "already-paid", order };
  }

  if (order.status !== "pending" || !order.providerOrderId) {
    // Nothing to verify: never reached PayPal (`created`), or already
    // resolved terminally (`failed`/`cancelled`/`refunded`) - none of
    // these should ever be resurrected into `paid` by a retry.
    return { status: "not-eligible" };
  }

  let paypalOrder: PayPalOrder;
  try {
    paypalOrder = await getPayPalOrder(order.providerOrderId);
  } catch (error) {
    console.error("verifyAndFinalizeOrder: failed to verify the PayPal order", error);
    await markOrderTerminal(order.id, "failed");
    return { status: "verification-failed" };
  }

  // Confirms this PayPal order is genuinely the one Everplans created for
  // this exact order - `reference_id` was set to `order.id` at checkout
  // time. A mismatch here means something is very wrong, never a normal
  // outcome to quietly proceed past.
  const referenceId = paypalOrder.purchase_units[0]?.reference_id;
  if (referenceId !== order.id) {
    console.error("verifyAndFinalizeOrder: PayPal order reference_id does not match the order", {
      orderId: order.id,
      referenceId,
    });
    return { status: "mismatch" };
  }

  if (paypalOrder.status !== "APPROVED" && paypalOrder.status !== "COMPLETED") {
    // The customer never actually approved payment (e.g.
    // `PAYER_ACTION_REQUIRED`) - never captured, never marked paid.
    await markOrderTerminal(order.id, "failed");
    return { status: "not-approved" };
  }

  let capturedOrder: PayPalOrder = paypalOrder;
  if (paypalOrder.status === "APPROVED") {
    try {
      capturedOrder = await capturePayPalOrder(order.providerOrderId);
    } catch (error) {
      // A capture can fail for a genuinely declined/instrument-error
      // payment, not just a network blip - either way, nothing was
      // charged, so `failed` (never `paid`) is correct.
      console.error("verifyAndFinalizeOrder: failed to capture the PayPal order", error);
      await markOrderTerminal(order.id, "failed");
      return { status: "capture-failed" };
    }
  }

  const capture = capturedOrder.purchase_units[0]?.payments?.captures?.[0];
  if (!capture || capture.status !== "COMPLETED") {
    await markOrderTerminal(order.id, "failed");
    return { status: "capture-failed" };
  }

  const capturedAmountCents = decimalStringToCents(capture.amount.value);
  const capturedCurrency = capture.amount.currency_code;

  if (capturedAmountCents !== order.amountCents || capturedCurrency !== order.currency) {
    console.error("verifyAndFinalizeOrder: captured amount/currency does not match the order", {
      orderId: order.id,
      expected: { amountCents: order.amountCents, currency: order.currency },
      captured: { amountCents: capturedAmountCents, currency: capturedCurrency },
    });
    return { status: "mismatch" };
  }

  const paidOrder = await markOrderPaid({
    orderId: order.id,
    providerCaptureId: capture.id,
    capturedAmountCents,
    capturedCurrency,
  });

  if (!paidOrder || paidOrder.status !== "paid") {
    return { status: "verification-failed" };
  }

  // The one and only place a Budget Planner entitlement is ever granted -
  // idempotent by construction (`grantPlannerAccess`'s own comment), so
  // even if this function somehow ran twice for the same successful
  // payment, access is granted exactly once.
  await grantPlannerAccess({
    userId: paidOrder.userId,
    plannerId: paidOrder.plannerId,
    externalEventId: capture.id,
    source: "paypal",
    expiresAt: null,
    orderId: paidOrder.id,
  });

  return { status: "paid", order: paidOrder };
}
