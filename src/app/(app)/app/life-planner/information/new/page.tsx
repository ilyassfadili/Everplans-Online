import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { PageHeader } from "../../../_components/page-header";
import { NewImportantItemForm } from "./_components/new-important-item-form";

export const metadata: Metadata = {
  title: "New Item",
  robots: { index: false, follow: false },
};

interface NewImportantItemPageProps {
  searchParams: Promise<{ goalId?: string }>;
}

/**
 * The Important Items module's own composer route (Life Planner Prompt 4
 * Phase 3) - its own page rather than an expand-in-place panel on the list,
 * the same "a composer earns a full page" reasoning `NewJournalEntryForm`'s
 * own comment documents one module over. Same "confirm the root workspace
 * exists, auto-provision if not, then redirect back" gate every other Life
 * Planner creation route uses.
 *
 * `?goalId=` is the goal detail page's own "Add" link pre-filling which goal
 * this item should default to - read here and handed to the form as its
 * default, the exact same `defaultGoalId` shape `NewJournalEntryPage`
 * already establishes.
 */
export default async function NewImportantItemPage({ searchParams }: NewImportantItemPageProps) {
  await requireLifePlanForCurrentUser();

  const params = await searchParams;

  const [areas, goals] = await Promise.all([getLifeAreasForCurrentUser(), getLifeGoalsForCurrentUser()]);
  const defaultGoalId = params.goalId && goals.some((goal) => goal.id === params.goalId) ? params.goalId : undefined;

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="New item" description="Save a plan, an intention, a milestone note, or any other detail worth keeping close." />
      <NewImportantItemForm areas={areas} goals={goals} defaultGoalId={defaultGoalId} />
    </Container>
  );
}
