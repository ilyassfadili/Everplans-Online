/**
 * "This specific user's working copy of this specific planner" -
 * `public.planner_instances` (see
 * `supabase/migrations/20260822000000_planner_persistence.sql`).
 * Deliberately separate from three neighboring concepts it's easy to
 * conflate with:
 *
 * - `@/types/planner-definition`'s `PlannerDefinition` - what the planner
 *   *is* (global catalog data, the same row for every user).
 * - `@/types/entitlement`'s `Entitlement` - *whether* this user is
 *   allowed to have an instance at all (checked once, at instance-
 *   creation time - see the migration's own insert policy).
 * - `@/types/planner-runtime`'s `PlannerRuntimeState` - the in-memory,
 *   per-render-session slice of this (current page, field values) a
 *   mounted `PlannerRuntime` component holds; this type is what a
 *   session is loaded from and saved back to.
 */

export type PlannerInstanceStatus = "not-started" | "in-progress" | "completed";

export interface PlannerInstance {
  id: string;
  userId: string;
  plannerId: string;
  status: PlannerInstanceStatus;
  /** Resume position - a page id from whatever `PlannerStructure` this planner's current `schemaVersion` describes. `null` before the user has ever opened the runtime. */
  currentPageId: string | null;
  /** `null` until the first real save - distinct from `createdAt`, which the database sets the instant a row exists (see `getOrStartPlannerInstance`, `@/lib/planner-persistence`). */
  startedAt: string | null;
  lastActiveAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Every saved answer for one instance, flat by field id - the persisted counterpart to `PlannerFieldValues` (`@/types/planner-runtime`), which is exactly what loading this into a mounted runtime produces. */
export type PlannerAnswers = Record<string, string | number | boolean | null>;
