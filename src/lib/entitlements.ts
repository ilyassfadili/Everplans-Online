import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Entitlement, EntitlementStatus } from "@/types/entitlement";

/**
 * The generic entitlement data-access layer - "does this user have an
 * active grant for this planner," queried against `public.entitlements`
 * (see `supabase/migrations/20260819000002_entitlements.sql`). Deliberately
 * a plain data-access function, not itself an authorization boundary: it
 * never resolves "who is the current user" on its own (unlike
 * `@/lib/profile`'s functions, which call `requireUser()` internally) -
 * `userId` must already be a server-verified id from the caller (see this
 * file's own security note below). `resolvePlannerAccess` in
 * `@/lib/planners` is the orchestration layer one level up that resolves
 * the session first and calls this function second - keeping "what
 * planners exist" (discovery), "is this a real session" (authentication),
 * and "does this session have an entitlement" (this file) as three
 * separately reviewable steps, per PROMPT 6 Phase 2 §1's explicit
 * authentication/authorization/entitlement/ownership separation.
 *
 * Security note: never call `getActiveEntitlement` with a client-supplied
 * `userId` - only with an id a server-side auth check already verified
 * (`getCurrentUser()`/`requireUser()` in `@/lib/auth/dal`). That said, this
 * is defense in depth, not the only thing standing between a bug here and
 * a cross-user leak: RLS's `user_id = auth.uid()` policy (see the
 * migration) is evaluated against the *actual signed-in session* on every
 * query regardless of what `userId` this function is called with, so even
 * a wrong/malicious `userId` parameter could only ever narrow the result
 * to empty, never widen it to another user's row.
 *
 * `server-only`: queries Supabase through the server client. Never safe
 * to import from a Client Component.
 */

const ACTIVE_STATUS: EntitlementStatus = "active";

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
 * Returns the user's active, unexpired entitlement for a planner, or
 * `null` if none exists - covers "never entitled," "revoked," "expired
 * via status," and "expired via a lapsed `expires_at` that nothing has
 * flipped `status` for yet" identically. Fails closed on every branch:
 * a database error, an unexpected multi-row conflict (structurally
 * prevented by the migration's `unique (user_id, planner_id)`
 * constraint, but not assumed away here), or genuinely no row all return
 * the same `null` - "not entitled" is always the safe default, never
 * inferred as "entitled" from an ambiguous or failed check.
 */
export async function getActiveEntitlement(userId: string, plannerId: string): Promise<Entitlement | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("entitlements")
    .select("id, user_id, planner_id, status, granted_at, expires_at, order_id, revoked_at, metadata, created_at, updated_at")
    .eq("user_id", userId)
    .eq("planner_id", plannerId)
    .eq("status", ACTIVE_STATUS)
    // Checked here, not trusted from `status` alone - an entitlement
    // whose `expires_at` has passed is not active regardless of what its
    // `status` column still says, until some future process reconciles
    // it. `or(...)` covers "never expires" (`expires_at is null`) and
    // "hasn't expired yet" (`expires_at` in the future) as the two ways
    // a row can still count as active.
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();

  if (error) {
    console.error("getActiveEntitlement: failed to check entitlement", error);
    return null;
  }

  return data ? mapEntitlementRow(data) : null;
}

/**
 * The reusable "does this authenticated user currently have access to this
 * product" check (Everplans Money Prompt 4 Phase 3) - a thin, explicitly-named
 * boolean wrapper around `getActiveEntitlement` for call sites that only
 * need a yes/no answer (a page's own access gate, a Server Action's own
 * guard) rather than the full `Entitlement` record. Same security contract
 * as `getActiveEntitlement`: `userId` must already be a server-verified id
 * (`requireUser()`), never a client-supplied value, and fails closed (`false`)
 * on any database error, ambiguous state, or genuine absence alike - never
 * infers "has access" from an uncertain check.
 */
export async function hasProductAccess(userId: string, plannerId: string): Promise<boolean> {
  const entitlement = await getActiveEntitlement(userId, plannerId);
  return entitlement !== null;
}
