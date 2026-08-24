import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { ensureDefaultLifeAreas, getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalCountsByArea } from "@/lib/life-planner/life-goals";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { PageHeader } from "../../_components/page-header";
import { AddAreaForm } from "./_components/add-area-form";
import { AreaCard } from "./_components/area-card";

export const metadata: Metadata = {
  title: "Life Areas",
  robots: { index: false, follow: false },
};

/**
 * The dedicated Life Areas page (Life Planner Prompt 2 Phase 1) - view,
 * add, edit, and remove the areas a user's plan is organized around, in
 * `position` order. Same "confirm the root workspace exists, auto-provision
 * if not, then redirect back" gate the dashboard page
 * (`@/app/(app)/app/life-planner/page.tsx`) uses, since this route can be
 * reached directly (a bookmark, a typed URL) without ever passing through
 * that page first.
 *
 * `ensureDefaultLifeAreas` runs here too, not only from the dashboard - the
 * same idempotent "seed once" call, so a user whose very first Life Planner
 * visit happens to land on this route (rather than the dashboard) still
 * gets the 9 defaults instead of an empty list.
 *
 * Prompt 2 Phase 2 adds each area's real goal count
 * (`getLifeGoalCountsByArea`, `@/lib/life-planner/life-goals`) - one small
 * query grouped in memory, not a per-area query in the map below.
 */
export default async function LifeAreasPage() {
  const plan = await requireLifePlanForCurrentUser();

  await ensureDefaultLifeAreas(plan.id);
  const [areas, goalCounts] = await Promise.all([getLifeAreasForCurrentUser(), getLifeGoalCountsByArea()]);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader
        title="Life Areas"
        description="The areas your Life Planner is organized around - the same context your Life Profile draws on, made concrete and editable."
      />

      <AddAreaForm planId={plan.id} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area, index) => (
          <AreaCard key={area.id} area={area} isFirst={index === 0} isLast={index === areas.length - 1} goalCount={goalCounts.get(area.id) ?? 0} />
        ))}
      </div>
    </Container>
  );
}
