/**
 * The access-resolution boundary the PROMPT 3 brief asks for explicitly:
 * "discovery" (what planners exist) and "access" (can this user open this
 * one) are two different questions, answered by two different functions
 * (`getPlannerDefinitionBySlug` vs. `resolvePlannerAccess` in
 * `@/lib/planners`), and this type is what keeps a caller from collapsing
 * them into one. A future detail route asks discovery "does this exist?"
 * first, then asks access "can THIS user open it?" second - never infers
 * the second answer from the first.
 *
 * A discriminated union rather than a boolean so each failure mode stays
 * distinguishable at the type level - a route handler can pattern-match
 * on `reason` to decide 404 vs. 403 vs. "sign in first" without stringly-
 * typed comparisons, and TypeScript enforces every case gets handled.
 */
export type PlannerAccessResult =
  /**
   * The planner exists, is published, and this user has a real, active
   * `entitlements` row for it (see `@/lib/entitlements`, added in
   * PROMPT 6). Architecturally reachable today - the entitlement check
   * is real, not a stub - but never actually produced in practice, since
   * no planner content source exists yet for `getPlannerDefinitionBySlug`
   * to resolve in the first place (see `@/lib/planners`). `schemaVersion`
   * rides along so a caller can fetch the matching `PlannerStructure`
   * (`getPlannerStructure`, `@/lib/planners`) without a second definition
   * lookup - the same value `PlannerDefinition.schemaVersion` already
   * tracked, just surfaced at the one point a caller actually needs it.
   */
  | { status: "granted"; plannerId: string; schemaVersion: number }
  /** No planner definition matches the requested identifier - a true 404, not an access question. */
  | { status: "not-found" }
  /** The definition exists but isn't in a state customers can open (`draft`/`archived`) - also a 404 to the requester, never revealed as "it exists but you can't have it." */
  | { status: "unavailable" }
  /** The request has no session at all - the caller should redirect to sign-in, not render a 403. */
  | { status: "unauthenticated" }
  /**
   * A real session exists, the planner is published, but this specific
   * user has no active `entitlements` row for it - a genuine query
   * result (see `getActiveEntitlement`, `@/lib/entitlements`), not a
   * hardcoded stub. This is the variant every real request currently
   * produces past the `not-found` stage, precisely because zero
   * entitlements exist anywhere (matching PROMPT 6's zero-product,
   * zero-purchase scope) - not because the check is unimplemented.
   */
  | { status: "unauthorized" };
