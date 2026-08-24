import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, Link } from "@/components/ui";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { getJournalEntryById } from "@/lib/life-planner/life-journal";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { JournalEntryDetailView } from "./_components/journal-entry-detail-view";

interface JournalEntryDetailPageProps {
  params: Promise<{ entryId: string }>;
}

export const metadata: Metadata = {
  title: "Journal Entry",
  robots: { index: false, follow: false },
};

/**
 * One Journal Entry's detail/edit view (Life Planner Prompt 4 Phase 2) - the
 * redirect-to-detail destination the composer sends a new entry to, and the
 * destination every entry card on the list links to. `getJournalEntryById`
 * is already owner-scoped (see that function's own comment - this table is
 * the most sensitive in the product, so that double-check matters more here
 * than anywhere else), so a `null` result covers both "doesn't exist" and
 * "belongs to someone else" with the same honest 404 `GoalDetailPage`/
 * `TaskDetailPage` already establish.
 */
export default async function JournalEntryDetailPage({ params }: JournalEntryDetailPageProps) {
  const { entryId } = await params;
  await requireLifePlanForCurrentUser();

  const entry = await getJournalEntryById(entryId);
  if (!entry) {
    notFound();
  }

  const [areas, goals] = await Promise.all([getLifeAreasForCurrentUser(), getLifeGoalsForCurrentUser()]);

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <Link href="/app/life-planner/journal" variant="subtle" className="text-body-sm">
        ← All entries
      </Link>
      <JournalEntryDetailView entry={entry} areas={areas} goals={goals} />
    </Container>
  );
}
