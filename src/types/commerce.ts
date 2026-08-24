/**
 * The future-commerce boundary PROMPT 7 asks for - concepts only, no
 * provider, no payment logic, no SDK. Two deliberately separate shapes,
 * matching the diagram's two distinct arrows ("Commerce Event" → "Everplans
 * Purchase/Access Processing" → "Entitlement"):
 *
 * - `CommerceEvent` is the raw, untrusted signal as a future external
 *   integration would report it - every reference on it is *external*
 *   (the provider's own ids), because a raw event has no idea what an
 *   Everplans `auth.users.id` or `planner_definitions.id` even is.
 * - `EntitlementProvisioningRequest` is what "trusted internal processing"
 *   (a future adapter, never built here) produces *after* resolving those
 *   external references to real Everplans ids - the only shape
 *   `@/lib/commerce-provisioning`'s functions ever accept. Nothing in this
 *   codebase currently produces an `EntitlementProvisioningRequest` from a
 *   `CommerceEvent` - that resolution logic is exactly "the adapter,"
 *   which PROMPT 7 Phase 1 §7 explicitly says not to implement yet.
 *
 * Provider-neutral by construction: `source` is an opaque label a future
 * integration assigns itself, not a fixed union of known providers - a
 * closed `"stripe" | "etsy"` type here would itself be the kind of
 * provider-specific architecture this prompt rules out. Nothing in
 * `@/lib/commerce-provisioning` or the `entitlements` table branches on
 * its value.
 */

/**
 * What kind of thing happened, at the most abstract level a future
 * provider's own vocabulary could map onto: `purchase` grants access,
 * `reversal` revokes it. Deliberately not `"refund" | "chargeback" |
 * "cancellation"` - those are specific *reasons* a reversal might occur,
 * which vary by provider and carry no distinction that matters to
 * Everplans' own access logic. A future adapter maps its own provider's
 * specific event vocabulary onto one of these two outcomes.
 */
export type CommerceEventType = "purchase" | "reversal";

/** Whether this specific event has actually settled. A `pending` purchase must not grant access yet; a `pending` reversal must not revoke it yet - only `completed` events should ever reach `@/lib/commerce-provisioning`. */
export type CommerceEventStatus = "completed" | "pending";

export interface CommerceEvent {
  /**
   * The provider's own id for this exact occurrence - the idempotency
   * key, paired with `source`, a future adapter must pass through
   * unchanged. Never generated internally; this is what makes "the same
   * webhook delivered twice" detectable at all. See
   * `@/lib/commerce-provisioning`'s own comment for where this is
   * actually enforced (a real unique constraint, not just a convention).
   */
  externalEventId: string;
  /** Opaque label identifying which future integration this came from - see this file's own comment on provider neutrality. */
  source: string;
  type: CommerceEventType;
  status: CommerceEventStatus;
  /** The provider's own reference for the product involved - NOT assumed to equal a `planner_definitions.id`. Resolving this to a real planner is the future adapter's job. */
  externalProductReference: string;
  /** The provider's own reference for the customer involved - NOT assumed to equal an `auth.users.id`. Resolving this to a real Everplans user is the future adapter's job. */
  externalCustomerReference: string;
  occurredAt: string;
}

/**
 * The trusted instruction that results from resolving a `CommerceEvent`'s
 * external references to real Everplans ids - the only input
 * `grantPlannerAccess`/`revokePlannerAccess` (`@/lib/commerce-provisioning`)
 * accept. By the time one of these exists, "which user, which planner" is
 * no longer a question - only "grant or revoke, and don't double-apply
 * this exact event" remain.
 */
export interface EntitlementProvisioningRequest {
  userId: string;
  plannerId: string;
  externalEventId: string;
  source: string;
  /** `null` for a non-expiring grant. Ignored entirely for a revoke. */
  expiresAt: string | null;
  /** The verified Everplans order this grant/revoke is provenance-linked to (`Entitlement.orderId`) - `undefined`/omitted for a grant/revoke with no specific order behind it. */
  orderId?: string | null;
  /** Small, non-sensitive audit context stored alongside the entitlement (`Entitlement.metadata`) - e.g. `{"reason":"refund"}`. Never a payment secret or provider token. */
  metadata?: Record<string, unknown>;
}
