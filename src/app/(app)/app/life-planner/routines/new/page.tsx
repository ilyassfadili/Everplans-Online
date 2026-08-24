import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { PageHeader } from "../../../_components/page-header";
import { NewRoutineForm } from "./_components/new-routine-form";

export const metadata: Metadata = {
  title: "New Routine",
  robots: { index: false, follow: false },
};

/**
 * The Routines module's creation route (Phase 2 §4) - its own page rather
 * than an expand-in-place panel on the list, the same "carries enough
 * fields to earn a full page" reasoning `NewGoalForm`'s own comment gives
 * for Life Goals. Same "confirm the root workspace exists, auto-provision
 * if not, then redirect back" gate every other Life Planner route uses.
 * On success, redirects straight to the new routine's detail page, where
 * adding checklist items happens next.
 */
export default async function NewRoutinePage() {
  await requireLifePlanForCurrentUser();

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="New routine" description="A recurring checklist for a rhythm you want to build or keep up with." />
      <NewRoutineForm />
    </Container>
  );
}
