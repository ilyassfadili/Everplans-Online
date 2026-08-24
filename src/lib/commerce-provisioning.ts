import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Entitlement, EntitlementStatus } from "@/types/entitlement";
import type { EntitlementProvisioningRequest } from "@/types/commerce";

/**
 * The "Everplans Purchase/Access Processing" step from PROMPT 7's own
 * diagram - the ONLY place in the application layer allowed to grant or
 * revoke a planner entitlement. PROMPT 7 itself deferred everything
 * upstream (verifying a payment provider's signal, resolving its external
 * product/customer references to real Everplans ids) as "a future commerce
 * adapter's job" - see `@/types/commerce`'s own comment on the
 * `CommerceEvent` → `EntitlementProvisioningRequest` boundary this file
 * sits on the far side of. Everplans Money Prompt 3 is that adapter
 * arriving, in two forms: `checkout/return/page.tsx` (the customer's own
 * browser round-trip back from PayPal) and `/api/webhooks/paypal`'s Route
 * Handler (PayPal's own server-to-server delivery). Both independently
 * verify a real PayPal payment - a server-side `getPayPalOrder`/
 * `capturePayPalOrder` call whose result is checked against the expected
 * amount/currency/order - before ever constructing an
 * `EntitlementProvisioningRequest` and calling `grantPlannerAccess`; the
 * checkout return page doing this is not the "ordinary signed-in user's own
 * action" this comment used to warn against, because nothing at that call
 * site trusts the user's own request as proof of payment - only PayPal's
 * own verified API response is.
 *
 * Both functions call a `security definer` Postgres RPC
 * (`grant_planner_entitlement`/`revoke_planner_entitlement`, see
 * `supabase/migrations/20260819000003_commerce_provisioning.sql`)
 * through `createSupabaseServiceClient()` - the one Supabase client in
 * this codebase authenticated with the secret key, deliberately never
 * the ordinary per-request server client. This is what makes "safe
 * against arbitrary client invocation" (PROMPT 7 Phase 1 §5) a fact about
 * the system, not a promise about this file's callers alone: even a bug
 * that called `grantPlannerAccess` from some other, unverified request
 * path could still only succeed because `SUPABASE_SECRET_KEY` is
 * configured - there is still no code path where a user's own session
 * could reach this privilege directly, only through code that has already
 * independently verified a real payment.
 *
 * `server-only`. Never call this from code that hasn't itself verified a
 * real, provider-confirmed payment first - `orders.status === "paid"`
 * (`@/lib/orders.ts`'s own `markOrderPaid`, called immediately before this
 * in both real callers) is the one condition that makes a call here
 * legitimate.
 */

function mapEntitlementRow(row: {
  id: string;
  user_id: string;
  planner_id: string;
  status: string;
  granted_at: string;
  expires_at: string | null;
  order_id: string | null;
  revoked_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}): Entitlement {
  return {
    id: row.id,
    userId: row.user_id,
    plannerId: row.planner_id,
    status: row.status as EntitlementStatus,
    grantedAt: row.granted_at,
    expiresAt: row.expires_at,
    orderId: row.order_id,
    revokedAt: row.revoked_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Grants (or re-activates) `request.userId`'s entitlement to
 * `request.plannerId`. Idempotent: redelivering the exact same
 * `(request.source, request.externalEventId)` pair is a safe no-op - see
 * the RPC function's own comment for how that's enforced. `userId` and
 * `plannerId` must already be real, resolved Everplans ids by the time
 * this is called - resolving a provider's own external references to
 * these is the future adapter's responsibility, not this function's; it
 * trusts its input completely, which is exactly why nothing except a
 * verified server-side adapter should ever be able to call it (see this
 * file's own top comment).
 */
export async function grantPlannerAccess(request: EntitlementProvisioningRequest): Promise<Entitlement> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase.rpc("grant_planner_entitlement", {
    p_user_id: request.userId,
    p_planner_id: request.plannerId,
    p_external_event_id: request.externalEventId,
    p_source: request.source,
    p_expires_at: request.expiresAt,
    p_order_id: request.orderId ?? null,
    p_metadata: request.metadata ?? {},
  });

  if (error) {
    // Deliberately thrown, not swallowed into a `null`/result-object
    // return the way `@/lib/profile` and `@/lib/entitlements` fail
    // closed for ordinary user-facing reads - a failed *grant* is not a
    // safe-to-ignore outcome the way "couldn't check access, so assume
    // none" is. A future adapter must know this failed so it can retry
    // or alert, not silently treat a failed grant as "handled."
    throw new Error(`grantPlannerAccess failed: ${error.message}`);
  }

  return mapEntitlementRow(data);
}

/** Revokes `request.userId`'s entitlement to `request.plannerId`. Same idempotency and error-handling shape as `grantPlannerAccess` - see its comment. `request.expiresAt` is ignored for a revoke (there's nothing to set an expiry on); `request.orderId` is likewise ignored (a revoke doesn't repoint provenance, only `metadata`/`revoked_at`/`status` change - see the RPC function's own body). */
export async function revokePlannerAccess(
  request: Omit<EntitlementProvisioningRequest, "expiresAt" | "orderId">,
): Promise<Entitlement> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase.rpc("revoke_planner_entitlement", {
    p_user_id: request.userId,
    p_planner_id: request.plannerId,
    p_external_event_id: request.externalEventId,
    p_source: request.source,
    p_metadata: request.metadata ?? {},
  });

  if (error) {
    throw new Error(`revokePlannerAccess failed: ${error.message}`);
  }

  return mapEntitlementRow(data);
}
