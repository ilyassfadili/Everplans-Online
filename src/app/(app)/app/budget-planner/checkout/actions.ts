"use server";

import { headers } from "next/headers";

import { BUDGET_PLANNER_PRODUCT } from "@/config/products/budget-planner";
import { siteConfig } from "@/config/site";
import { requireUser } from "@/lib/auth/dal";
import { verifyAndFinalizeOrder } from "@/lib/commerce/verify-and-finalize-order";
import { hasProductAccess } from "@/lib/entitlements";
import { attachPayPalOrder, createPendingOrder, getOrderForCurrentUser, markOrderTerminal } from "@/lib/orders";
import { createPayPalOrder } from "@/lib/paypal/orders";

/**
 * Everplans Money Prompt 8's in-page checkout - Card Fields and the PayPal
 * Buttons component both call back into these two Server Actions directly
 * (imported and invoked from the client component, not bound to a
 * `<form action>` - React Server Actions support both). Steps 1-4 of the
 * commerce flow (resolve customer, create Everplans' own pending order,
 * ask PayPal to create the corresponding order, hand the customer their
 * payment UI) are identical to Prompt 3's original redirect-based flow
 * (`@/lib/orders.ts`, `@/lib/paypal/orders.ts`) - only what happens *after*
 * the PayPal order exists changes: instead of redirecting the whole page to
 * PayPal's hosted approval URL, the PayPal order id is handed back to the
 * client SDK, which collects payment (a card, or a PayPal login) without
 * ever leaving this page. Nothing here ever marks an order `paid` - that
 * only ever happens in `verifyAndFinalizeOrder`
 * (`@/lib/commerce/verify-and-finalize-order.ts`), after a real server-side
 * verification against PayPal, the exact same shared logic
 * `checkout/return/page.tsx` and `/api/webhooks/paypal` also use.
 */

/** Derives the current request's own origin for PayPal's `return_url`/`cancel_url` - kept as a fallback PayPal itself may use if a popup is blocked or a payment method needs a redirect step, even though the primary Card Fields/Buttons flow never navigates away from this page. */
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
 * component (Everplans Money Prompt 8 Phase 2/3) - creates a fresh
 * Everplans order every call, matching the exact same steps
 * `startBudgetPlannerCheckout` used to perform before this prompt, just
 * returning the PayPal order id to the caller instead of redirecting.
 * Price, currency, and product identity all come from
 * `BUDGET_PLANNER_PRODUCT` (a server constant) - never from anything the
 * client sends, so there is no request the browser could shape to buy at a
 * different price or a different product.
 */
export async function createBudgetPlannerPayPalOrder(): Promise<CreateCheckoutOrderResult> {
  const user = await requireUser();

  // Never let an already-entitled customer pay twice (Everplans Money
  // Prompt 4's "existing purchaser" handling) - checked before an order is
  // even created.
  if (await hasProductAccess(user.id, BUDGET_PLANNER_PRODUCT.plannerId)) {
    return { status: "error", message: "You already own Budget Planner." };
  }

  let orderId: string | undefined;
  try {
    const order = await createPendingOrder({
      userId: user.id,
      plannerId: BUDGET_PLANNER_PRODUCT.plannerId,
      productSlug: BUDGET_PLANNER_PRODUCT.slug,
      productName: BUDGET_PLANNER_PRODUCT.name,
      unitAmountCents: BUDGET_PLANNER_PRODUCT.priceCents,
      currency: BUDGET_PLANNER_PRODUCT.currency,
    });
    orderId = order.id;

    const origin = await resolveOrigin();
    const paypalOrder = await createPayPalOrder({
      referenceId: order.id,
      amountCents: order.amountCents,
      currency: order.currency,
      description: order.productName,
      returnUrl: `${origin}/app/budget-planner/checkout/return`,
      cancelUrl: `${origin}/app/budget-planner/checkout/cancel`,
    });

    await attachPayPalOrder(order.id, paypalOrder.id);
    return { status: "success", paypalOrderId: paypalOrder.id };
  } catch (error) {
    console.error("createBudgetPlannerPayPalOrder: failed to start checkout", error);
    // `orderId` may or may not have been created depending on which step
    // failed - `markOrderTerminal` is a safe no-op either way (it only
    // matches a row that both exists and is still `created`/`pending`).
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
 * `onApprove` for both the Card Fields component and the Buttons component -
 * the customer has approved payment on PayPal's side (whether that was a
 * card entered directly in Card Fields or a PayPal login in the Buttons
 * popup); this is where Everplans actually verifies and finalizes it,
 * delegating entirely to `verifyAndFinalizeOrder`, the exact same
 * idempotent logic the redirect-based return flow and the webhook handler
 * both use (Everplans Money Prompt 7's "any retry/finalization path must
 * reuse the existing idempotent commerce logic," now with a third real
 * caller). The client never learns anything more specific than "paid" or
 * "error, try again" - it has no say in whether the order actually becomes
 * paid.
 */
export async function captureBudgetPlannerOrder(paypalOrderId: string): Promise<CaptureCheckoutOrderResult> {
  const user = await requireUser();

  if (!paypalOrderId) {
    return { status: "error", message: "Missing PayPal order reference." };
  }

  // Scoped by `user.id` via RLS (`getOrderForCurrentUser`'s own comment) -
  // an order that exists but belongs to someone else resolves identically
  // to "no such order."
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
