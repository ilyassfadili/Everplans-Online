/**
 * Everplans Money's internal commerce-operations domain (Prompt 7) - the
 * operator-only visibility layer over the same `orders`/`entitlements`
 * data customers already see a scoped slice of via `@/types/order`/
 * `@/types/entitlement`. Nothing here is ever reachable through the
 * publishable-key clients (see `supabase/migrations/20260906000000_commerce_operations_foundation.sql`'s
 * own comment) - every read/write goes through the service-role client
 * from code that has already verified the caller via
 * `@/lib/commerce-ops/auth.ts`.
 */

/** A PayPal webhook delivery's own processing outcome, as recorded by `/api/webhooks/paypal` after signature verification succeeds - `public.commerce_webhook_events`. Distinct from `commerce_event_log` (the RPCs' own idempotency ledger) - this exists purely for operator visibility. */
export type WebhookEventStatus = "received" | "processed" | "ignored" | "failed";

export interface CommerceWebhookEvent {
  id: string;
  provider: string;
  providerEventId: string;
  eventType: string;
  orderId: string | null;
  status: WebhookEventStatus;
  /** A short, safe operator-facing message - never a raw provider payload or stack trace. */
  errorMessage: string | null;
  receivedAt: string;
  processedAt: string | null;
}

/** One row in the commerce-ops audit trail - `public.commerce_ops_audit_log`. */
export interface CommerceOpsAuditLogEntry {
  id: string;
  operatorId: string;
  action: string;
  targetType: string;
  targetId: string;
  result: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
