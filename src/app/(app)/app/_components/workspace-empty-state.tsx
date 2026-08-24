import { LayoutGrid } from "lucide-react";

import { Button, EmptyState } from "@/components/ui";

/**
 * The planner/workspace area's real content for today: there are no
 * planners to show, and this says so plainly rather than filling the
 * space with invented cards. `EmptyState` is the same primitive the
 * public site already uses for every "nothing here yet" surface
 * (Planners, Categories, Blog) - reused here rather than a second,
 * dashboard-specific empty-state component, since nothing about this
 * case needs different behavior, only different copy. It renders
 * directly, not nested inside a `Card`: `EmptyState` already carries its
 * own dashed border and muted surface, exactly as it does everywhere else
 * it's used - a second bordered container around it would double up that
 * treatment rather than add to it.
 *
 * The two actions are real, working destinations today. "Discover
 * Planners" points at the Store (`/app/store`) - the real, working "see
 * what's available and open it" surface, the same one every other
 * zero-planner empty state in the app points to now (Analytics, Activity,
 * Resources, and `PlannerCatalogEmptyState` on `/app/planners` itself -
 * see that component's own comment). "Browse Categories" still points at
 * the public `/categories` page - no in-app category browser exists to
 * send it to instead, and category browsing is a discovery/marketing
 * concept that's genuinely still owned by the public site. Deliberately
 * not a "Start a Planner" button: that action has nowhere to go yet, and a
 * button with no real destination is worse than no button.
 */
export function WorkspaceEmptyState() {
  return (
    <EmptyState
      icon={LayoutGrid}
      titleAs="h2"
      title="Your workspace is ready"
      description="This is where your planners will live once you add one. There's nothing to set up on your end - head to the Store to see what's available, and your workspace will be waiting when you do."
      // Overrides EmptyState's own fixed py-16 - not a change to the
      // shared primitive (which the public site's own empty catalogs
      // still use unmodified), just this dashboard instance scaling its
      // vertical rhythm across breakpoints the way PROMPT 8 asks for,
      // rather than one fixed value at every viewport width.
      className="py-10 sm:py-14 md:py-16"
      action={
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <Button href="/app/store" size="sm">
            Discover Planners
          </Button>
          <Button href="/categories" variant="outline" size="sm">
            Browse Categories
          </Button>
        </div>
      }
    />
  );
}
