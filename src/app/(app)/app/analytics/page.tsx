import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";

import { Button, Container, EmptyState } from "@/components/ui";
import { getActivePlanners } from "@/lib/dashboard-planners";

import { PageHeader } from "../_components/page-header";
import { AnalyticsView } from "./_components/analytics-view";

export const metadata: Metadata = {
  title: "Quick Stats",
  robots: { index: false, follow: false },
};

/**
 * `/app/analytics` - the real route Dashboard V2 Prompt 3 Phase 1 asks
 * for (the sidebar's own label stays "Quick Stats" - a page can be titled
 * more specifically than its nav entry, the same way `/app` itself is
 * titled "Your Everplans" in `<title>` while the sidebar just says the
 * workspace's own name is implicit). Reuses `getActivePlanners()`
 * (Prompt 2) rather than a second, analytics-specific data source - the
 * same planners, viewed differently, not two competing models of "what a
 * planner is."
 *
 * `getActivePlanners()` always returns `[]` today (see its own comment
 * for the three still-missing systems) - so this page's real, live
 * behavior is the empty branch below, which explains *why* there's
 * nothing to show (Phase 1 §3: "If there is no data, explain why")
 * rather than rendering a chart full of zeroes or hiding the page
 * entirely. `AnalyticsView`'s filter + KPI cards are real, exercised
 * architecture for the moment real planner progress exists, the same
 * "real signature, empty today" status every populated branch in this
 * codebase already carries.
 */
export default async function AnalyticsPage() {
  const planners = await getActivePlanners();

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Quick Stats" description="A snapshot of your progress across every planner in your workspace." />

      {planners.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          titleAs="h2"
          title="There’s nothing to measure yet"
          description="Stats appear here once you have at least one planner in progress - there's no data to show because no planners have been started yet, not because something's broken."
          className="py-10 sm:py-14 md:py-16"
          action={
            <Button href="/app/store" size="sm">
              Discover Planners
            </Button>
          }
        />
      ) : (
        <AnalyticsView planners={planners} />
      )}
    </Container>
  );
}
