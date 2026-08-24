import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Entitlement, EntitlementStatus } from "@/types/entitlement";

/**
 * The commerce-ops read layer over `public.entitlements` - same
 * service-role-only shape as `@/lib/commerce-ops/orders.ts`, and the same
 * "only ever call this from code already gated by `requireCommerceOperator()`"
 * rule. Read-only: Prompt 7 Phase 3 is explicit that this prompt does not
 * add unrestricted manual entitlement creation/revocation - operators see
 * entitlement state here, they don't set it directly.
 */

const ENTITLEMENT_COLUMNS = "id, user_id, planner_id, status, granted_at, expires_at, order_id, revoked_at, metadata, created_at, updated_at";

type EntitlementRow = {
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
};

function mapEntitlementRow(row: EntitlementRow): Entitlement {
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

/** The entitlement a specific order granted (via `entitlements.order_id`), for the Order Detail view's own "Customer -> Product -> Order -> ... -> Entitlement" chain - `null` if this order never resulted in one (never paid, or a grant that predates `order_id` being tracked). */
export async function getEntitlementByOrderIdForOps(orderId: string): Promise<Entitlement | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase.from("entitlements").select(ENTITLEMENT_COLUMNS).eq("order_id", orderId).maybeSingle();

  if (error) {
    console.error("getEntitlementByOrderIdForOps: failed to load entitlement", error);
    return null;
  }

  return data ? mapEntitlementRow(data) : null;
}
