import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, Link } from "@/components/ui";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { getImportantItemById } from "@/lib/life-planner/life-important-items";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { ImportantItemDetailView } from "./_components/important-item-detail-view";

interface ImportantItemDetailPageProps {
  params: Promise<{ itemId: string }>;
}

export const metadata: Metadata = {
  title: "Important Item",
  robots: { index: false, follow: false },
};

/**
 * One Important Item's detail/edit view (Life Planner Prompt 4 Phase 3) -
 * the redirect-to-detail destination the composer sends a new item to, and
 * the destination every card on the list links to. `getImportantItemById`
 * is already owner-scoped, so a `null` result covers both "doesn't exist"
 * and "belongs to someone else" with the same honest 404
 * `JournalEntryDetailPage`/`GoalDetailPage` already establish.
 */
export default async function ImportantItemDetailPage({ params }: ImportantItemDetailPageProps) {
  const { itemId } = await params;
  await requireLifePlanForCurrentUser();

  const item = await getImportantItemById(itemId);
  if (!item) {
    notFound();
  }

  const [areas, goals] = await Promise.all([getLifeAreasForCurrentUser(), getLifeGoalsForCurrentUser()]);

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <Link href="/app/life-planner/information" variant="subtle" className="text-body-sm">
        ← All items
      </Link>
      <ImportantItemDetailView item={item} areas={areas} goals={goals} />
    </Container>
  );
}
