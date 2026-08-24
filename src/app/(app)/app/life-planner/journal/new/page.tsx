import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { PageHeader } from "../../../_components/page-header";
import { NewJournalEntryForm } from "./_components/new-journal-entry-form";

export const metadata: Metadata = {
  title: "New Journal Entry",
  robots: { index: false, follow: false },
};

interface NewJournalEntryPageProps {
  searchParams: Promise<{ goalId?: string }>;
}

/**
 * The Journal's own composer route (Life Planner Prompt 4 Phase 2) - its own
 * page rather than an expand-in-place panel on the list, the same "a
 * composer earns a full page" reasoning `NewGoalForm`'s own comment
 * documents one product over (a journal entry carries even more to write
 * than a goal - title, date, Life Area, goal, and a full body - and needs
 * the room). Same "confirm the root workspace exists, auto-provision if
 * not, then redirect back" gate every other Life Planner creation route
 * uses.
 *
 * `?goalId=` is the goal detail page's own "New reflection" link
 * pre-filling which goal this entry should default to - read here and
 * handed to the form as its default, rather than the form guessing it from
 * referrer or requiring the writer to re-pick it.
 */
export default async function NewJournalEntryPage({ searchParams }: NewJournalEntryPageProps) {
  await requireLifePlanForCurrentUser();

  const params = await searchParams;

  const [areas, goals] = await Promise.all([getLifeAreasForCurrentUser(), getLifeGoalsForCurrentUser()]);
  const defaultGoalId = params.goalId && goals.some((goal) => goal.id === params.goalId) ? params.goalId : undefined;

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="New journal entry" description="Write freely - this is just for you." />
      <NewJournalEntryForm areas={areas} goals={goals} defaultGoalId={defaultGoalId} />
    </Container>
  );
}
