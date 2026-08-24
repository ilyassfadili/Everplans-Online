import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { PageHeader } from "../../../_components/page-header";
import { NewGoalForm } from "./_components/new-goal-form";

export const metadata: Metadata = {
  title: "New Goal",
  robots: { index: false, follow: false },
};

/**
 * The Goals module's creation route (Phase 2 §4) - its own page rather than
 * an expand-in-place panel on the list (see `NewGoalForm`'s own comment for
 * why). Same "confirm the root workspace exists, auto-provision if not,
 * then redirect back" gate every other Life Planner route uses.
 */
export default async function NewGoalPage() {
  await requireLifePlanForCurrentUser();

  const areas = await getLifeAreasForCurrentUser();

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="New goal" description="What are you working toward?" />
      <NewGoalForm areas={areas} />
    </Container>
  );
}
