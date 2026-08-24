import "server-only";

import { payPalFetch } from "@/lib/paypal/client";

/**
 * The PayPal Orders v2 API surface Everplans Money actually needs - create
 * (start a checkout), get (read current status/amount for verification),
 * capture (actually take payment once the customer approved it). Every
 * function here is a plain, typed `fetch` call through `payPalFetch`; none
 * of them touch `public.orders` - that's `@/lib/orders.ts`'s job, one layer
 * up, which calls these and then records the *verified* result.
 */

export interface PayPalOrderAmount {
  currency_code: string;
  value: string;
}

export interface PayPalCapture {
  id: string;
  status: string;
  amount: PayPalOrderAmount;
}

export interface PayPalPurchaseUnit {
  reference_id?: string;
  amount: PayPalOrderAmount;
  payments?: {
    captures?: PayPalCapture[];
  };
}

export interface PayPalOrderLink {
  href: string;
  rel: string;
  method: string;
}

export interface PayPalOrder {
  id: string;
  status: "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED" | string;
  purchase_units: PayPalPurchaseUnit[];
  links: PayPalOrderLink[];
}

export interface CreatePayPalOrderInput {
  /** Our own internal `orders.id` - carried on the PayPal order as `reference_id` so a webhook/return-flow lookup can always cross-check which Everplans order this corresponds to, never inferred from amount/timing alone. */
  referenceId: string;
  amountCents: number;
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Cents, parsed back from PayPal's own decimal-string amount format - the inverse of `centsToDecimalString`, used to verify a returned amount against what Everplans expects (never trust the string comparison alone; compare as integers). */
export function decimalStringToCents(value: string): number {
  return Math.round(Number(value) * 100);
}

/** Creates a PayPal order for a checkout attempt. Returns the PayPal order id and its `approve` link - the URL the customer is redirected to next. Never itself a record of payment; see this file's own top comment. */
export async function createPayPalOrder(input: CreatePayPalOrderInput): Promise<{ id: string; approveUrl: string }> {
  const order = await payPalFetch<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.referenceId,
          description: input.description,
          amount: {
            currency_code: input.currency,
            value: centsToDecimalString(input.amountCents),
          },
        },
      ],
      application_context: {
        brand_name: "Everplans",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  });

  const approveLink = order.links.find((link) => link.rel === "approve")?.href;
  if (!approveLink) {
    throw new Error("createPayPalOrder: PayPal did not return an approve link.");
  }

  return { id: order.id, approveUrl: approveLink };
}

/** Reads a PayPal order's current state - used to verify amount/currency/status before ever trusting a return-flow redirect. */
export async function getPayPalOrder(paypalOrderId: string): Promise<PayPalOrder> {
  return payPalFetch<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, { method: "GET" });
}

/**
 * Captures an approved PayPal order - the step that actually takes payment.
 * Safe to call more than once for the same order: PayPal itself returns the
 * existing capture (not a new charge) if one already succeeded, and
 * `@/lib/orders.ts`'s `markOrderPaid` independently guards against
 * double-processing on the Everplans side via `provider_capture_id`'s
 * unique constraint.
 */
export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalOrder> {
  return payPalFetch<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
