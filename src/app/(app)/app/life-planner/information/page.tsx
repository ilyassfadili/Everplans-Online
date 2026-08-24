import type { Metadata } from "next";
import { BookMarked } from "lucide-react";

import { Button, Container, EmptyState } from "@/components/ui";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { getImportantItemsForCurrentUser } from "@/lib/life-planner/life-important-items";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";
import { LIFE_IMPORTANT_ITEM_CATEGORIES, type LifeImportantItemCategory } from "@/types/life-planner";

import { PageHeader } from "../../_components/page-header";
import { ImportantItemCard } from "./_components/important-item-card";
import { ImportantItemsFilterBar, type ImportantItemCategoryFilter } from "./_components/important-items-filter-bar";

export const metadata: Metadata = {
  title: "Important Plans & Information",
  robots: { index: false, follow: false },
};

interface InformationPageProps {
  searchParams: Promise<{ category?: string; archived?: string }>;
}

function parseCategoryFilter(value: string | undefined): ImportantItemCategoryFilter {
  return (LIFE_IMPORTANT_ITEM_CATEGORIES as readonly string[]).includes(value ?? "") ? (value as LifeImportantItemCategory) : "all";
}

/**
 * The Important Plans & Information list/browse page (Life Planner Prompt 4
 * Phase 3) - every non-archived item the user has saved, newest first, with
 * a category filter (`?category=`) and an archive toggle (`?archived=1`),
 * both plain `searchParams` driving `getImportantItemsForCurrentUser`
 * directly - no client-side filtering, the same shape Journal's own list
 * page uses one module over. Same "confirm the root workspace exists,
 * auto-provision if not, then redirect back" gate every other Life Planner
 * route uses, since this page can be reached directly (from the workspace
 * nav) without ever passing through the dashboard first.
 *
 * Deliberately reads as a personal reference archive, not a notebook or a
 * file manager - a denser grid of `ImportantItemCard`s (see that
 * component's own comment for why it borrows `GoalCard`'s layout rather
 * than Journal's spacious rows) organized by category, the register this
 * table's own "plans, intentions, milestones, references, notes" content is
 * meant to carry.
 */
export default async function InformationPage({ searchParams }: InformationPageProps) {
  await requireLifePlanForCurrentUser();

  const params = await searchParams;
  const categoryFilter = parseCategoryFilter(params.category);
  const includeArchived = params.archived === "1";
  const isFiltered = categoryFilter !== "all";

  const [items, areas, goals] = await Promise.all([
    getImportantItemsForCurrentUser({ includeArchived, category: categoryFilter === "all" ? undefined : categoryFilter }),
    getLifeAreasForCurrentUser(),
    getLifeGoalsForCurrentUser(),
  ]);
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const goalById = new Map(goals.map((goal) => [goal.id, goal]));

  const hasAnyItems = items.length > 0 || isFiltered || includeArchived;

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader
        title="Important Plans & Information"
        description="The details worth keeping close - key plans, intentions, milestones, and reference notes, organized so you can find them again."
        action={
          <Button href="/app/life-planner/information/new" size="sm">
            New item
          </Button>
        }
      />

      {hasAnyItems && <ImportantItemsFilterBar active={categoryFilter} includeArchived={includeArchived} />}

      {items.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title={includeArchived ? "No archived items" : isFiltered ? "Nothing in this category yet" : "Nothing saved yet"}
          description={
            includeArchived
              ? "Items you archive will show up here."
              : isFiltered
                ? "Try a different category, or clear the filter to see everything."
                : "Save the plans, intentions, and reference details worth keeping close - your first item is just a click away."
          }
          action={
            !includeArchived && !isFiltered ? (
              <Button href="/app/life-planner/information/new" size="sm">
                Add your first item
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const area = item.lifeAreaId ? (areaById.get(item.lifeAreaId) ?? null) : null;
            const goal = item.goalId ? (goalById.get(item.goalId) ?? null) : null;
            return <ImportantItemCard key={item.id} item={item} areaName={area?.name ?? null} goalTitle={goal?.title ?? null} />;
          })}
        </div>
      )}
    </Container>
  );
}
