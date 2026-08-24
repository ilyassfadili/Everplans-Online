import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { CommerceWebhookEvent, WebhookEventStatus } from "@/types/commerce-ops";

/**
 * `public.commerce_webhook_events` - written by `/api/webhooks/paypal`
 * itself (after signature verification succeeds) and read here for the
 * commerce-ops Webhook/Event visibility view (Prompt 7 Phase 2). See that
 * table's own migration comment for why it's distinct from
 * `commerce_event_log` (the RPCs' internal idempotency ledger).
 */

const WEBHOOK_EVENT_COLUMNS = "id, provider, provider_event_id, event_type, order_id, status, error_message, received_at, processed_at";

type WebhookEventRow = {
  id: string;
  provider: string;
  provider_event_id: string;
  event_type: string;
  order_id: string | null;
  status: string;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
};

function mapWebhookEventRow(row: WebhookEventRow): CommerceWebhookEvent {
  return {
    id: row.id,
    provider: row.provider,
    providerEventId: row.provider_event_id,
    eventType: row.event_type,
    orderId: row.order_id,
    status: row.status as WebhookEventStatus,
    errorMessage: row.error_message,
    receivedAt: row.received_at,
    processedAt: row.processed_at,
  };
}

/**
 * Records a verified webhook delivery as `received`, upserting on
 * `(provider, provider_event_id)` so a redelivered event updates its own
 * row (fresh `status`, e.g. `received` -> `processed`) rather than ever
 * creating a duplicate log entry - the audit log stays one row per real
 * PayPal event, matching the same "duplicate delivery is expected, not a
 * bug" idempotency principle the actual processing logic already follows.
 * Called from `/api/webhooks/paypal` immediately after signature
 * verification succeeds, before processing begins.
 */
export async function recordWebhookEventReceived(input: {
  providerEventId: string;
  eventType: string;
  orderId: string | null;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.from("commerce_webhook_events").upsert(
    {
      provider: "paypal",
      provider_event_id: input.providerEventId,
      event_type: input.eventType,
      order_id: input.orderId,
      status: "received",
    },
    { onConflict: "provider,provider_event_id" },
  );

  if (error) {
    // Visibility logging is never allowed to block real payment
    // processing - a failure here is logged for operators to notice via
    // server logs, never thrown back into the webhook handler's own
    // control flow.
    console.error("recordWebhookEventReceived: failed to record webhook event", error);
  }
}

/** Updates a previously-recorded webhook event with its final processing outcome - `errorMessage` should always be a short, safe, operator-facing string, never a raw provider payload or stack trace. */
export async function recordWebhookEventProcessed(input: {
  providerEventId: string;
  status: Extract<WebhookEventStatus, "processed" | "ignored" | "failed">;
  errorMessage?: string;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from("commerce_webhook_events")
    .update({
      status: input.status,
      error_message: input.errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("provider", "paypal")
    .eq("provider_event_id", input.providerEventId);

  if (error) {
    console.error("recordWebhookEventProcessed: failed to update webhook event", error);
  }
}

const OPS_WEBHOOK_EVENTS_LIMIT = 100;

/** Recent webhook events across every order, most recent first - the Webhook/Event operations view's own read. Capped for the same "do not build a huge dashboard" reasoning `getOrdersForOps` documents. */
export async function getRecentWebhookEventsForOps(): Promise<CommerceWebhookEvent[]> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("commerce_webhook_events")
    .select(WEBHOOK_EVENT_COLUMNS)
    .order("received_at", { ascending: false })
    .limit(OPS_WEBHOOK_EVENTS_LIMIT);

  if (error) {
    console.error("getRecentWebhookEventsForOps: failed to load webhook events", error);
    return [];
  }

  return (data ?? []).map(mapWebhookEventRow);
}

/** Webhook events related to one specific order - the Order Detail view's own "which webhook deliveries touched this order" read. */
export async function getWebhookEventsForOrderForOps(orderId: string): Promise<CommerceWebhookEvent[]> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("commerce_webhook_events")
    .select(WEBHOOK_EVENT_COLUMNS)
    .eq("order_id", orderId)
    .order("received_at", { ascending: false });

  if (error) {
    console.error("getWebhookEventsForOrderForOps: failed to load webhook events", error);
    return [];
  }

  return (data ?? []).map(mapWebhookEventRow);
}
