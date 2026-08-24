import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { getActivePlanners, getRecommendedPlanner } from "@/lib/dashboard-planners";
import { getUserProfile } from "@/lib/profile";

import { DashboardOverview } from "./_components/dashboard-overview";
import { NextActionBanner } from "./_components/next-action-banner";
import { PlannerGrid } from "./_components/planner-grid";
import { WorkspaceEmptyState } from "./_components/workspace-empty-state";
import { WorkspaceWelcome } from "./_components/workspace-welcome";

export const metadata: Metadata = {
  title: "Your Everplans",
  robots: { index: false, follow: false },
};

/**
 * The authenticated application's primary home. A welcome area using the
 * actual signed-in session (see `WorkspaceWelcome`), plus the workspace/
 * planner area - which branches on `getActivePlanners()` (Dashboard V2
 * Prompt 2) rather than always rendering the empty state: the populated
 * branch (`NextActionBanner` + `DashboardOverview` + `PlannerGrid`) is
 * real, exercised architecture, not a stub - the same "real signature,
 * empty today" status the public site's own `PlannerCollection` carries
 * for its own populated grid. `getActivePlanners()` always returns `[]`
 * right now (see its own comment for the three still-missing systems
 * that would need to exist first), so in practice this page still always
 * renders `WorkspaceEmptyState` today - correctly, not as a placeholder.
 *
 * No recent-activity section in the empty branch - there's no activity to
 * show, and an empty "Recent activity" panel next to an already-empty
 * planner panel would just be two consecutive "nothing here" moments for
 * the same underlying fact, the same reasoning `PlannerCollection` on the
 * public site applies to its own single empty state.
 *
 * The display name comes from `getUserProfile()` (`public.profiles`,
 * PROMPT 4), not `user.user_metadata.full_name` directly - the profile
 * row is seeded from that same metadata at signup (see the migration's
 * trigger) but is the application's own column from then on, independent
 * of whatever `user_metadata` might later be changed to via
 * `supabase.auth.updateUser()`. No separate `requireUser()` call here -
 * `getUserProfile()` already calls it internally (and redirects to
 * sign-in if there's no session), so this page is still fully gated
 * "correct in isolation" without a redundant second call whose result
 * would go unused - see the DAL's own comment on why every protected
 * page still calls one of these itself rather than trusting the layout.
 *
 * Lives at `(app)/app/page.tsx`, not `(app)/page.tsx`: a route group's
 * parenthesized folder name is stripped from the URL, not used as a path
 * segment, so this nested `app/` folder is what actually makes the route
 * resolve to `/app` instead of colliding with `(site)`'s own `/`.
 */
export default async function AppHomePage() {
  const profile = await getUserProfile();
  const firstName = profile?.displayName?.split(" ")[0];
  const planners = await getActivePlanners();
  const recommended = getRecommendedPlanner(planners);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:gap-10 md:py-14">
      <WorkspaceWelcome firstName={firstName} />

      {planners.length === 0 ? (
        <WorkspaceEmptyState />
      ) : (
        <div className="flex flex-col gap-8">
          {recommended && <NextActionBanner planner={recommended} />}
          <DashboardOverview planners={planners} />
          <PlannerGrid planners={planners} />
        </div>
      )}
    </Container>
  );
}
