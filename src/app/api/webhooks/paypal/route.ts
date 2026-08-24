import { NextResponse } from "next/server";

import { revokePlannerAccess } from "@/lib/commerce-provisioning";
import { verifyAndFinalizeOrder } from "@/lib/commerce/verify-and-finalize-order";
import { recordWebhookEventProcessed, recordWebhookEventReceived } from "@/lib/commerce-ops/webhook-events";
import { getOrderByProviderOrderId, markOrderRefunded, markOrderTerminal } from "@/lib/orders";
import { verifyPayPalWebhookSignature } from "@/lib/paypal/webhooks";

/**
 * PayPal's webhook delivery endpoint (Everplans Money Prompt 3 Phase 4) -
 * the reconciliation path alongside `checkout/return/page.tsx`'s own
 * synchronous verification, for cases that path can't cover on its own (a
 * customer who approved payment but closed the tab before PayPal redirected
 * them back, a later refund). Every event is verified against PayPal's own
 * signature-verification API before anything is trusted - an unverified
 * request is never processed, regardless of what it claims, and never
 * logged to `commerce_webhook_events` either (Everplans Money Prompt 7's
 * operator-visibility table only ever records genuinely PayPal-signed
 * deliveries, not arbitrary traffic hitting a public URL).
 *
 * Idempotent by construction: the paid-transition path delegates to
 * `verifyAndFinalizeOrder` (`@/lib/commerce/verify-and-finalize-order.ts`),
 * the exact same shared logic the checkout return-flow and the
 * commerce-ops "safe retry" action both use - a redelivered webhook, or one
 * that arrives after the return-flow already finished, is always a safe
 * no-op. Deliberately not a general event-processing framework (Prompt 3
 * Phase 4's own scope boundary) - a small `switch` over the handful of
 * event types Budget Planner's one-time-purchase flow actually needs,
 * everything else acknowledged and ignored.
 *
 * No route-level auth check: this endpoint is intentionally public (PayPal
 * itself is the caller, with no Everplans session) - the signature
 * verification below IS the authentication.
 */

interface PayPalWebhookResource {
  id?: string;
  status?: string;
  amount?: { currency_code: string; value: string };
  supplementary_data?: { related_ids?: { order_id?: string } };
}

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: PayPalWebhookResource;
}

/**
 * The PayPal order id an event is about. `PAYMENT.CAPTURE.*` events carry
 * it under `resource.supplementary_data.related_ids.order_id` (the
 * resource itself is the capture, not the order); `CHECKOUT.ORDER.*`
 * events carry it directly as `resource.id`. A refund event's resource is
 * further removed still (a capture's own refund, with no direct order-id
 * field at all) - this may legitimately return `null` for one, which is an
 * accepted, disclosed limit of this foundation-level handler, not treated
 * as an error.
 */
function extractPayPalOrderId(event: PayPalWebhookEvent): string | null {
  return event.resource.supplementary_data?.related_ids?.order_id ?? event.resource.id ?? null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const authAlgo = request.headers.get("paypal-auth-algo");
  const certUrl = request.headers.get("paypal-cert-url");
  const transmissionId = request.headers.get("paypal-transmission-id");
  const transmissionSig = request.headers.get("paypal-transmission-sig");
  const transmissionTime = request.headers.get("paypal-transmission-time");

  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    console.error("PayPal webhook: request is missing required verification headers");
    return NextResponse.json({ error: "missing verification headers" }, { status: 400 });
  }

  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error("PayPal webhook: request body is not valid JSON");
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const verified = await verifyPayPalWebhookSignature({
    authAlgo,
    certUrl,
    transmissionId,
    transmissionSig,
    transmissionTime,
    webhookEvent: event,
  });

  if (!verified) {
    console.error("PayPal webhook: signature verification failed", { eventType: event.event_type, eventId: event.id });
    return NextResponse.json({ error: "signature verification failed" }, { status: 400 });
  }

  const providerOrderId = extractPayPalOrderId(event);
  const order = providerOrderId ? await getOrderByProviderOrderId(providerOrderId) : null;

  // Recorded for every verified delivery, regardless of what happens next -
  // the commerce-ops Webhook/Event view's own read (Everplans Money
  // Prompt 7 Phase 2). Never blocks processing below if it fails (see the
  // function's own comment).
  await recordWebhookEventReceived({ providerEventId: event.id, eventType: event.event_type, orderId: order?.id ?? null });

  if (!providerOrderId) {
    // An event type this handler doesn't need order context for (or can't
    // resolve one for, e.g. a refund - see `extractPayPalOrderId`'s own
    // comment) - acknowledged so PayPal doesn't retry something that will
    // never resolve differently, never treated as a processing failure.
    await recordWebhookEventProcessed({ providerEventId: event.id, status: "ignored", errorMessage: "No order reference on this event type." });
    return NextResponse.json({ received: true });
  }

  if (!order) {
    // A PayPal order this Everplans instance has no record of (different
    // environment's traffic, a stale test event) - acknowledged, not an error.
    await recordWebhookEventProcessed({ providerEventId: event.id, status: "ignored", errorMessage: "No matching Everplans order." });
    return NextResponse.json({ received: true });
  }

  let outcome: { status: "processed" | "ignored" | "failed"; message?: string };

  switch (event.event_type) {
    case "CHECKOUT.ORDER.APPROVED":
    case "PAYMENT.CAPTURE.COMPLETED": {
      const result = await verifyAndFinalizeOrder(order);
      outcome =
        result.status === "paid" || result.status === "already-paid"
          ? { status: "processed" }
          : result.status === "not-eligible"
            ? { status: "ignored", message: "Order was not eligible for finalization." }
            : { status: "failed", message: result.status };
      break;
    }

    case "PAYMENT.CAPTURE.DENIED": {
      await markOrderTerminal(order.id, "failed");
      outcome = { status: "processed" };
      break;
    }

    case "PAYMENT.CAPTURE.REFUNDED": {
      // The refund's own id (Everplans Money Prompt 5's refund foundation) -
      // `event.resource` here is the refund object itself, whose `id` is
      // PayPal's refund id (distinct from the original capture id).
      const refundId = event.resource.id;
      const refundedOrder = await markOrderRefunded(order.id, refundId);

      if (refundedOrder?.status === "refunded") {
        // "Order -> refunded" implies "Entitlement -> revoked" (Prompt 5
        // Phase 3) - idempotent via the refund id as the event key, the
        // same pattern every other grant/revoke in this codebase uses, so
        // a redelivered refund webhook can never double-process.
        await revokePlannerAccess({
          userId: order.userId,
          plannerId: order.plannerId,
          externalEventId: refundId ?? `refund:${order.id}`,
          source: "paypal",
          metadata: { reason: "refund", orderId: order.id },
        });
      }
      outcome = { status: "processed" };
      break;
    }

    default:
      // Every other event type is acknowledged without action - this is a
      // small, targeted handler for Budget Planner's one-time-purchase
      // flow, not a general event-processing framework.
      outcome = { status: "ignored", message: "Event type not handled by this integration." };
      break;
  }

  await recordWebhookEventProcessed({ providerEventId: event.id, status: outcome.status, errorMessage: outcome.message });

  return NextResponse.json({ received: true });
}
