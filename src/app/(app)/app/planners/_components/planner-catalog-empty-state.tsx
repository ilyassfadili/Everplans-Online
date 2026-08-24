import { NotebookPen } from "lucide-react";

import { Button, EmptyState } from "@/components/ui";

/**
 * `/app/planners`'s true zero-state - rendered only when the user owns no
 * real planner at all (`getOwnedPlanners()` returned nothing) *and* the
 * generic catalog has nothing published either. A user who owns Wedding
 * Planner, Budget Planner, or a started generic one never sees this - their
 * own planner cards render above instead (`AppPlannersPage`'s own comment).
 * Same `EmptyState` primitive as the dashboard's `WorkspaceEmptyState` and
 * every public-site empty catalog, rendered directly (not nested in a
 * `Card` - see `WorkspaceEmptyState`'s own comment for why that combination
 * reads as a double border rather than added polish).
 *
 * The action points at `/app/store`, not back at `/app` (a dead end - `/app`
 * has nothing further to show either until a planner is added) - the Store
 * is the one real, working "see what's available" surface, the same
 * destination every other zero-planner empty state in the app now points
 * to (see `WorkspaceEmptyState`'s own comment).
 */
export function PlannerCatalogEmptyState() {
  return (
    <EmptyState
      icon={NotebookPen}
      titleAs="h2"
      title="No planners published yet"
      description="Everplans is being built one planner at a time. Nothing is available to open right now, but the Store is exactly where they'll appear the moment they're ready."
      // Same dashboard-only padding override as WorkspaceEmptyState's own
      // comment explains - the shared EmptyState default stays untouched.
      className="py-10 sm:py-14 md:py-16"
      action={
        <Button href="/app/store" size="sm">
          Discover Planners
        </Button>
      }
    />
  );
}
