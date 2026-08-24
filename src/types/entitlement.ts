/**
 * The generic entitlement domain - the "does this user have access to this
 * product" relationship, deliberately independent of how that access was
 * ever granted. No payment-specific field belongs here (no Stripe charge
 * id, no Etsy order id, no amount, no payment method) - PROMPT 6's own
 * scope boundary is explicit that entitlements must not be coupled to a
 * future payment provider. A future commerce integration would create
 * rows in this same shape after a purchase completes; this type has no
 * opinion on how a row came to exist, only on what one means once it does.
 *
 * Distinct from `@/types/planner-access`'s `PlannerAccessResult`: that
 * type is the *answer* to "can this user open this planner right now"
 * (which also accounts for authentication and the planner's own status,
 * not entitlement alone) - this type is the underlying *record* one
 * specific entitlement check is based on.
 */

/**
 * Three states, matching PROMPT 6 Phase 1 §4 exactly: `active` (currently
 * grants access), `expired` (a time-limited grant that lapsed on its own),
 * `revoked` (access was explicitly withdrawn, independent of expiry). Kept
 * distinct rather than collapsed into "active | inactive" because a future
 * UI showing entitlement history genuinely benefits from knowing *why*
 * access ended, even though `resolvePlannerAccess` (`@/lib/planners`)
 * only ever needs to know "active or not" today.
 */
export type EntitlementStatus = "active" | "expired" | "revoked";

export interface Entitlement {
  id: string;
  userId: string;
  plannerId: string;
  status: EntitlementStatus;
  grantedAt: string;
  /** `null` means "does not expire." A non-null value in the past means lapsed even if `status` still says `active` - see `getActiveEntitlement` in `@/lib/entitlements` for why the access check verifies both independently rather than trusting `status` alone. */
  expiresAt: string | null;
  /**
   * The verified order that granted this entitlement (Everplans Money
   * Prompt 4's "User -> Order -> Entitlement" provenance) - `null` for a
   * grant with no order behind it (not possible for Budget Planner today,
   * but never assumed impossible for a future non-purchase grant). Never
   * repointed at a different order once set - a re-grant after a revoke
   * updates it to whatever order triggered the re-grant, same as every
   * other field `grant_planner_entitlement` upserts.
   */
  orderId: string | null;
  /** When this entitlement was revoked - `null` while `status` is `active`. Set alongside `status = "revoked"`, cleared back to `null` on any later re-grant - see `grant_planner_entitlement`'s own comment. */
  revokedAt: string | null;
  /** Small, non-sensitive audit context (e.g. `{"reason":"refund"}`) - never a payment secret, provider token, or anything a customer-facing surface can't safely read. */
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
