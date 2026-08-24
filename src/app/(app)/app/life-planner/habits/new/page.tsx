import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { PageHeader } from "../../../_components/page-header";
import { NewHabitForm } from "./_components/new-habit-form";

export const metadata: Metadata = {
  title: "New Habit",
  robots: { index: false, follow: false },
};

/**
 * The Habits module's creation route (Phase 3 §5) - its own page rather
 * than an expand-in-place panel on the list, the same "carries enough
 * fields to earn a full page" reasoning `NewRoutineForm`'s own comment
 * gives for Routines. Same "confirm the root workspace exists,
 * auto-provision if not, then redirect back" gate every other Life Planner
 * route uses. On success, redirects straight to the new habit's detail
 * page.
 */
export default async function NewHabitPage() {
  await requireLifePlanForCurrentUser();

  const [areas, goals] = await Promise.all([getLifeAreasForCurrentUser(), getLifeGoalsForCurrentUser()]);

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="New habit" description="A recurring behavior you want to track and keep up with." />
      <NewHabitForm areas={areas} goals={goals} />
    </Container>
  );
}
