"use server";

import { headers } from "next/headers";

import { TRAVEL_PLANNER_PRODUCT } from "@/config/products/travel-planner";
import { siteConfig } from "@/config/site";
import { requireUser } from "@/lib/auth/dal";
import { verifyAndFinalizeOrder } from "@/lib/commerce/verify-and-finalize-order";
import { hasProductAccess } from "@/lib/entitlements";
import { attachPayPalOrder, createPendingOrder, getOrderForCurrentUser, markOrderTerminal } from "@/lib/orders";
import { createPayPalOrder } from "@/lib/paypal/orders";

/**
 * Travel Planner's own in-page checkout Server Actions (Prompt 6 Phase
 * 1/2) - the same shape `budget-planner/checkout/actions.ts` already
 * establishes, reusing every underlying commerce primitive
 * (`createPendingOrder`, `createPayPalOrder`, `verifyAndFinalizeOrder`,
 * `@/lib/orders.ts`/`@/lib/paypal/orders.ts`/`@/lib/commerce/verify-and-finalize-order.ts`)
 * as-is - nothing here is a second implementation of order creation,
 * PayPal API calls, or payment verification, only Travel Planner's own
 * product identity (`TRAVEL_PLANNER_PRODUCT`) and redirect paths.
 */

async function resolveOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return siteConfig.url;

  const forwardedProto = headerList.get("x-forwarded-proto");
  const protocol = forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}

export type CreateCheckoutOrderResult = { status: "success"; paypalOrderId: string } | { status: "error"; message: string };

/**
 * `createOrder` for both the Card Fields component and the Buttons
 * component - price, currency, and product identity all come from
 * `TRAVEL_PLANNER_PRODUCT` (a server constant), never from anything the
 * client sends, so there is no request the browser could shape to buy at a
 * different price or a different product.
 */
export async function createTravelPlannerPayPalOrder(): Promise<CreateCheckoutOrderResult> {
  const user = await requireUser();

  // Never let an already-entitled customer pay twice.
  if (await hasProductAccess(user.id, TRAVEL_PLANNER_PRODUCT.plannerId)) {
    return { status: "error", message: "You already own Travel Planner." };
  }

  let orderId: string | undefined;
  try {
    const order = await createPendingOrder({
      userId: user.id,
      plannerId: TRAVEL_PLANNER_PRODUCT.plannerId,
      productSlug: TRAVEL_PLANNER_PRODUCT.slug,
      productName: TRAVEL_PLANNER_PRODUCT.name,
      unitAmountCents: TRAVEL_PLANNER_PRODUCT.priceCents,
      currency: TRAVEL_PLANNER_PRODUCT.currency,
    });
    orderId = order.id;

    const origin = await resolveOrigin();
    const paypalOrder = await createPayPalOrder({
      referenceId: order.id,
      amountCents: order.amountCents,
      currency: order.currency,
      description: order.productName,
      returnUrl: `${origin}/app/travel-planner/checkout/return`,
      cancelUrl: `${origin}/app/travel-planner/checkout/cancel`,
    });

    await attachPayPalOrder(order.id, paypalOrder.id);
    return { status: "success", paypalOrderId: paypalOrder.id };
  } catch (error) {
    console.error("createTravelPlannerPayPalOrder: failed to start checkout", error);
    if (orderId) await markOrderTerminal(orderId, "failed");
    return { status: "error", message: "We couldn't start checkout with PayPal. Please try again." };
  }
}

export type CaptureCheckoutOrderResult = { status: "paid" } | { status: "error"; message: string };

const CAPTURE_ERROR_MESSAGES: Record<string, string> = {
  "not-eligible": "This order isn't eligible for capture. Please start checkout again.",
  "not-approved": "It looks like that payment wasn't completed. Please try again.",
  "verification-failed": "We couldn't verify your payment with PayPal right now. Please try again shortly.",
  "capture-failed": "PayPal couldn't complete this payment - it may have been declined.",
  mismatch: "Something didn't match up while confirming your payment. Please contact support before trying again.",
};

/**
 * `onApprove` for both the Card Fields component and the Buttons
 * component - delegates entirely to `verifyAndFinalizeOrder`, the exact
 * same idempotent logic the redirect-based return flow, the webhook
 * handler, and Budget Planner's own checkout all use. The client never
 * learns anything more specific than "paid" or "error, try again" - it
 * has no say in whether the order actually becomes paid.
 */
export async function captureTravelPlannerOrder(paypalOrderId: string): Promise<CaptureCheckoutOrderResult> {
  const user = await requireUser();

  if (!paypalOrderId) {
    return { status: "error", message: "Missing PayPal order reference." };
  }

  const order = await getOrderForCurrentUser(user.id, paypalOrderId);
  if (!order || order.userId !== user.id) {
    return { status: "error", message: "We couldn't find that order. Please start checkout again." };
  }

  const result = await verifyAndFinalizeOrder(order);

  if (result.status === "paid" || result.status === "already-paid") {
    return { status: "paid" };
  }

  return { status: "error", message: CAPTURE_ERROR_MESSAGES[result.status] ?? "Something went wrong. Please try again." };
}
