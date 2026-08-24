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
  redirect(`/app/travel-planner/checkout?error=${code}`);
}

/**
 * PayPal's own redirect target after a customer approves (or is asked to
 * approve) payment for Travel Planner - the fallback path for a payment
 * method that needs a real redirect (a blocked popup, certain funding
 * sources), even though the primary Card Fields/Buttons flow never
 * navigates away from the checkout page. Delegates the actual "verify
 * with PayPal and finalize" work to `verifyAndFinalizeOrder`, the same
 * shared, idempotent logic `/api/webhooks/paypal` and Budget Planner's own
 * checkout return flow both use - same shape as
 * `budget-planner/checkout/return/page.tsx`.
 *
 * Safe to hit more than once for the same order (a reload, a duplicate
 * return): `verifyAndFinalizeOrder` itself is idempotent and race-safe.
 */
export default async function CheckoutReturnPage({ searchParams }: CheckoutReturnPageProps) {
  const user = await requireUser();
  const { token } = await searchParams;

  if (!token) {
    toCheckoutError("missing_token");
  }

  // Scoped by `user.id` via RLS - an order that exists but belongs to
  // someone else resolves identically to "no such order," never leaking
  // whether it exists at all.
  const order = await getOrderForCurrentUser(user.id, token);
  if (!order || order.userId !== user.id) {
    toCheckoutError("order_not_found");
  }

  const result = await verifyAndFinalizeOrder(order);

  switch (result.status) {
    case "paid":
    case "already-paid":
      redirect("/app/travel-planner/checkout/success");
      break;
    case "not-eligible":
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
