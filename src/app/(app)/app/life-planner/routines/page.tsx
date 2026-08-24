import type { Metadata } from "next";
import { Repeat } from "lucide-react";

import { Button, Container, EmptyState } from "@/components/ui";
import { getRoutineItemCountsForCurrentUser, getRoutinesForCurrentUser } from "@/lib/life-planner/life-routines";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { PageHeader } from "../../_components/page-header";
import { RoutineCard } from "./_components/routine-card";

export const metadata: Metadata = {
  title: "Routines",
  robots: { index: false, follow: false },
};

/**
 * The dedicated Routines page (Life Planner Prompt 3 Phase 2) - every
 * routine the user has, active ones first
 * (`getRoutinesForCurrentUser`'s own order), each as a summary card with a
 * pause/resume toggle and delete. Same "confirm the root workspace exists,
 * auto-provision if not, then redirect back" gate every other Life Planner
 * route uses, since this route can be reached directly without ever passing
 * through the dashboard first.
 */
export default async function RoutinesPage() {
  await requireLifePlanForCurrentUser();

  const [routines, itemCounts] = await Promise.all([getRoutinesForCurrentUser(), getRoutineItemCountsForCurrentUser()]);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader
        title="Routines"
        description="Recurring checklists for the rhythms you want to keep - a morning routine, a weekly reset, anything you repeat on purpose."
        action={
          <Button href="/app/life-planner/routines/new" size="sm">
            New routine
          </Button>
        }
      />

      {routines.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No routines yet"
          description="Create your first routine to start building a repeatable checklist."
          action={<Button href="/app/life-planner/routines/new">New routine</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} itemCount={itemCounts.get(routine.id) ?? 0} />
          ))}
        </div>
      )}
    </Container>
  );
}
