import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/dal";
import { verifyAndFinalizeOrder } from "@/lib/commerce/verify-and-finalize-order";
import { getOrderForCurrentUser } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Confirming your purchase",
  robots: { index: false, follow: false },
};

interface CheckoutReturnPageProps {
  /** PayPal's own redirect convention: `token` is the PayPal order id, `PayerID` is the payer's PayPal account id (not used here - the order id alone is enough to look up and verify). */
  searchParams: Promise<{ token?: string }>;
}

function toCheckoutError(code: string): never {
  redirect(`/app/budget-planner/checkout?error=${code}`);
}

/**
 * Everplans Money Prompt 3 Phase 3: PayPal's own redirect target after a
 * customer approves (or is asked to approve) payment - this is where a
 * PayPal order actually becomes a verified Everplans purchase. Resolves and
 * authorizes the order itself (ownership via `getOrderForCurrentUser`'s own
 * RLS scoping), then delegates the actual "verify with PayPal and finalize"
 * work to `verifyAndFinalizeOrder` (`@/lib/commerce/verify-and-finalize-order.ts`,
 * Everplans Money Prompt 7) - the same shared, idempotent logic
 * `/api/webhooks/paypal` and the commerce-ops "safe retry" action both use,
 * so all three callers can never quietly drift into different verification
 * behavior.
 *
 * Safe to hit more than once for the same order (a reload, a duplicate
 * return): `verifyAndFinalizeOrder` itself is idempotent and race-safe
 * (see its own comment) - Prompt 3's own "prevent duplicate fulfillment"
 * requirement is satisfied at that shared layer, not re-implemented here.
 */
export default async function CheckoutReturnPage({ searchParams }: CheckoutReturnPageProps) {
  const user = await requireUser();
  const { token } = await searchParams;

  if (!token) {
    toCheckoutError("missing_token");
  }

  // Scoped by `user.id` via RLS (`getOrderForCurrentUser`'s own comment) -
  // an order that exists but belongs to someone else resolves identically
  // to "no such order," never leaking whether it exists at all.
  const order = await getOrderForCurrentUser(user.id, token);
  if (!order || order.userId !== user.id) {
    toCheckoutError("order_not_found");
  }

  const result = await verifyAndFinalizeOrder(order);

  switch (result.status) {
    case "paid":
    case "already-paid":
      redirect("/app/budget-planner/checkout/success");
      break;
    case "not-eligible":
      // `created` (never actually reached PayPal), or already terminally
      // `failed`/`cancelled`/`refunded` - none of these should ever be
      // resurrected into `paid` by revisiting an old return URL.
      toCheckoutError("order_not_found");
      break;
    case "not-approved":
      toCheckoutError("not_approved");
      break;
    case "verification-failed":
      toCheckoutError("verification_failed");
      break;
    case "capture-failed":
      toCheckoutError("capture_failed");
      break;
    case "mismatch":
      toCheckoutError("mismatch");
      break;
  }
}
