import "server-only";

import { payPalFetch, requirePayPalWebhookId } from "@/lib/paypal/client";

/**
 * PayPal webhook signature verification - the one thing that makes
 * `POST /api/webhooks/paypal` trustworthy input rather than an open,
 * unauthenticated endpoint anyone could call. Uses PayPal's own
 * `verify-webhook-signature` API rather than a local HMAC check: PayPal
 * signs webhook deliveries with a rotating certificate it hosts, not a
 * shared-secret HMAC, so verification is itself a signed, authenticated API
 * call back to PayPal - exactly the pattern PayPal's own docs prescribe.
 */

export interface VerifyPayPalWebhookInput {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  /** The raw, already-`JSON.parse`d request body - passed through to PayPal verbatim; never re-serialized in a way that could alter its bytes and invalidate the signature check. */
  webhookEvent: unknown;
}

interface VerifyWebhookSignatureResponse {
  verification_status: "SUCCESS" | "FAILURE" | string;
}

/** `true` only when PayPal itself confirms the signature is valid for the configured `PAYPAL_WEBHOOK_ID`. Fails closed: any error, a non-2xx response, or anything other than an explicit `"SUCCESS"` is treated as unverified. */
export async function verifyPayPalWebhookSignature(input: VerifyPayPalWebhookInput): Promise<boolean> {
  try {
    const result = await payPalFetch<VerifyWebhookSignatureResponse>("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: JSON.stringify({
        auth_algo: input.authAlgo,
        cert_url: input.certUrl,
        transmission_id: input.transmissionId,
        transmission_sig: input.transmissionSig,
        transmission_time: input.transmissionTime,
        webhook_id: requirePayPalWebhookId(),
        webhook_event: input.webhookEvent,
      }),
    });

    return result.verification_status === "SUCCESS";
  } catch (error) {
    console.error("verifyPayPalWebhookSignature: verification request failed", error);
    return false;
  }
}
