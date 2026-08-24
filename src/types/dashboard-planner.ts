/**
 * The Dashboard's own view of "a planner this user has started" - a
 * distinct concept from `@/types/planner-definition`'s `PlannerDefinition`
 * (the catalog/product shell: title, description, category, status) and
 * from `@/types/planner-runtime`'s `PlannerRuntimeState` (one in-memory,
 * per-session runtime's current page/field-values). `DashboardPlanner` is
 * neither: it's what a card on `/app` needs to show - catalog identity
 * *plus* this specific user's own progress against it - which today has
 * no real data source at all. Producing a real value of this type would
 * require three systems this platform doesn't have yet, each deferred
 * deliberately in earlier phases: a real published planner
 * (`planner_definitions`), a real entitlement for it
 * (`entitlements`), and a real persisted customer-progress record (no
 * such table exists - "customer planner state" was explicitly kept out of
 * scope through every prior planner-architecture phase). Until all three
 * exist, `getActivePlanners()` (`@/lib/dashboard-planners`) returns `[]`
 * honestly, the same "real signature, empty today" pattern every other
 * data-access function in this codebase already follows.
 */

export type DashboardPlannerStatus = "not-started" | "in-progress" | "completed";

export interface DashboardPlanner {
  id: string;
  /** For building the "Continue Planning" href - `/app/planners/${slug}`. */
  slug: string;
  name: string;
  categoryName: string;
  /** Optional - a card doesn't require one to render correctly. */
  description?: string;
  /** 0-100. Always derived from `completedSections`/`totalSections` where both are known - never authored independently of them, so the two can't silently disagree (see `getPlannerProgressPercentage` in `@/lib/dashboard-planners`). */
  progressPercentage: number;
  completedSections: number;
  totalSections: number;
  /** ISO timestamp, or `null` when genuinely unknown - never a fabricated "just now" to avoid an empty state. */
  lastActiveAt: string | null;
  /** `null` when there's no specific next step to surface (e.g. a freshly-added planner with nothing started, or a completed one with nothing left). */
  nextAction: string | null;
  status: DashboardPlannerStatus;
  /** Optional discovery artwork, mirroring `PlannerDefinition.coverImageUrl` - `null`/absent renders the same generic mark the catalog card already falls back to. */
  coverImageUrl?: string | null;
}
