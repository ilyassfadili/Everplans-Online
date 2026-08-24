"use server";

import { revalidatePath } from "next/cache";

import { logCommerceOpsAction } from "@/lib/commerce-ops/audit";
import { requireCommerceOperator } from "@/lib/commerce-ops/auth";
import { getOrderForOps } from "@/lib/commerce-ops/orders";
import { verifyAndFinalizeOrder } from "@/lib/commerce/verify-and-finalize-order";

/**
 * The one operational action Everplans Money Prompt 7 allows: re-run the
 * exact same verified-payment logic every other caller uses
 * (`verifyAndFinalizeOrder`, `@/lib/commerce/verify-and-finalize-order.ts`)
 * for one specific order - never a raw "mark as paid" that skips PayPal
 * entirely (explicitly forbidden by Prompt 7 Phase 3). Useful for the one
 * legitimate operational scenario this covers: a customer's payment
 * genuinely succeeded at PayPal but the browser return never landed (they
 * closed the tab) AND the webhook hasn't arrived yet either - an operator
 * can nudge Everplans to go check PayPal again, rather than the customer
 * being stuck waiting.
 *
 * Authorization is re-checked here, not just assumed from the page having
 * rendered a button - the same "never trust that a client reached this
 * action only through a UI path that already checked" discipline this
 * codebase applies everywhere a privileged operation exists.
 */
export type RetryOrderVerificationState = { status: "idle" | "success" | "error"; message: string };

const RESULT_MESSAGES: Record<string, string> = {
  paid: "Payment verified with PayPal - this order is now paid, and access has been granted.",
  "already-paid": "This order was already paid - nothing to do.",
  "not-eligible": "This order isn't in a state that can be retried (only a pending order with a PayPal order attached can be).",
  "not-approved": "PayPal reports this payment was never approved by the customer.",
  "verification-failed": "Couldn't verify this payment with PayPal right now. Please try again shortly.",
  "capture-failed": "PayPal couldn't capture this payment - it may have been declined.",
  mismatch: "The verified payment doesn't match this order's expected amount, currency, or reference - do not retry again without investigating first.",
};

export async function retryOrderVerificationAction(
  _prevState: RetryOrderVerificationState,
  formData: FormData,
): Promise<RetryOrderVerificationState> {
  const operator = await requireCommerceOperator();
  const orderId = formData.get("orderId");

  if (typeof orderId !== "string" || !orderId) {
    return { status: "error", message: "Missing order id." };
  }

  const order = await getOrderForOps(orderId);
  if (!order) {
    return { status: "error", message: "That order no longer exists." };
  }

  const result = await verifyAndFinalizeOrder(order);

  await logCommerceOpsAction({
    operatorId: operator.id,
    action: "retry_order_verification",
    targetType: "order",
    targetId: orderId,
    result: result.status,
  });

  revalidatePath(`/app/ops/orders/${orderId}`);
  revalidatePath("/app/ops");

  const isSuccess = result.status === "paid" || result.status === "already-paid";
  return { status: isSuccess ? "success" : "error", message: RESULT_MESSAGES[result.status] ?? "Unexpected result." };
}
