import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, Link } from "@/components/ui";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";
import { getRoutineWithItems, getTodaysRoutineItemsForCurrentUser } from "@/lib/life-planner/life-routines";

import { RoutineDetailView } from "./_components/routine-detail-view";

interface RoutineDetailPageProps {
  params: Promise<{ routineId: string }>;
}

export const metadata: Metadata = {
  title: "Routine",
  robots: { index: false, follow: false },
};

/**
 * One Routine's detail view (Phase 2 §4) - the redirect-to-detail
 * destination `createRoutineFormAction` sends a new routine to, and the
 * destination `RoutineCard` links every routine in the list to.
 * `getRoutineWithItems` is already owner-scoped (see that function's own
 * comment), so a `null` result covers both "doesn't exist" and "belongs to
 * someone else" with the same honest 404 the goal/task detail pages use.
 *
 * Today's checklist (if this routine is actually due today) is sourced by
 * finding this one routine within `getTodaysRoutineItemsForCurrentUser()`'s
 * result, rather than a second bespoke query - the same "reuse the
 * dashboard's own read" reasoning is simpler here than adding a
 * routine-scoped variant of that query for a single-routine page this
 * small.
 */
export default async function RoutineDetailPage({ params }: RoutineDetailPageProps) {
  const { routineId } = await params;
  await requireLifePlanForCurrentUser();

  const result = await getRoutineWithItems(routineId);
  if (!result) {
    notFound();
  }

  const todaysGroups = await getTodaysRoutineItemsForCurrentUser();
  const todaysGroup = todaysGroups.find((group) => group.routine.id === routineId) ?? null;

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <Link href="/app/life-planner/routines" variant="subtle" className="text-body-sm">
        ← All routines
      </Link>
      <RoutineDetailView routine={result.routine} items={result.items} todaysGroup={todaysGroup} />
    </Container>
  );
}
