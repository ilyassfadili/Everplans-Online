import type { Metadata } from "next";
import { BookOpenText } from "lucide-react";

import { Button, Container, EmptyState } from "@/components/ui";
import { AREA_ICONS } from "@/app/(app)/app/life-planner/areas/_components/area-visuals";
import { getLifeAreasForCurrentUser } from "@/lib/life-planner/life-areas";
import { getLifeGoalsForCurrentUser } from "@/lib/life-planner/life-goals";
import { getJournalEntriesForCurrentUser } from "@/lib/life-planner/life-journal";
import { requireLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";

import { PageHeader } from "../../_components/page-header";
import { JournalEntryCard } from "./_components/journal-entry-card";
import { JournalFilterBar } from "./_components/journal-filter-bar";

export const metadata: Metadata = {
  title: "Journal",
  robots: { index: false, follow: false },
};

interface JournalPageProps {
  searchParams: Promise<{ q?: string; area?: string; archived?: string }>;
}

/** Matches `JournalFilterBar`'s own "all areas" sentinel - Radix `Select.Item` can't take a genuinely empty `value`, so `?area=all` is submitted instead of an absent param and treated the same way here. */
const ALL_AREAS_VALUE = "all";

/**
 * The Journal's own list/browse page (Life Planner Prompt 4 Phase 2) - every
 * non-archived entry the user has written, newest first, with a lightweight
 * search (`?q=`) and an optional Life Area filter (`?area=`), both plain
 * `searchParams` driving `getJournalEntriesForCurrentUser` directly - no
 * client-side filtering, no search index. Same "confirm the root workspace
 * exists, auto-provision if not, then redirect back" gate every other Life
 * Planner route uses, since this page can be reached directly (from the
 * workspace nav) without ever passing through the dashboard first.
 *
 * Deliberately the warmest, most personal-feeling page in Life Planner -
 * see `JournalEntryCard`'s own comment for the concrete styling choices
 * that set this apart from the goals/tasks lists, all still built from
 * existing design-system tokens.
 */
export default async function JournalPage({ searchParams }: JournalPageProps) {
  await requireLifePlanForCurrentUser();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const lifeAreaId = params.area && params.area !== ALL_AREAS_VALUE ? params.area : undefined;
  const includeArchived = params.archived === "1";
  const isFiltered = Boolean(query) || Boolean(lifeAreaId);

  const [entries, areas, goals] = await Promise.all([
    getJournalEntriesForCurrentUser({ includeArchived, lifeAreaId, search: query || undefined }),
    getLifeAreasForCurrentUser(),
    getLifeGoalsForCurrentUser(),
  ]);
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const goalById = new Map(goals.map((goal) => [goal.id, goal]));

  const hasAnyEntries = entries.length > 0 || isFiltered || includeArchived;

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader
        title="Journal"
        description="A private, running record of your own reflections - only you can ever see this."
        action={
          <Button href="/app/life-planner/journal/new" size="sm">
            New entry
          </Button>
        }
      />

      {(hasAnyEntries || areas.length > 0) && <JournalFilterBar query={query} lifeAreaId={lifeAreaId} includeArchived={includeArchived} areas={areas} />}

      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpenText}
          title={includeArchived ? "No archived entries" : isFiltered ? "Nothing matches yet" : "Your journal is empty"}
          description={
            includeArchived
              ? "Entries you archive will show up here."
              : isFiltered
                ? "Try a different search or clear the Life Area filter."
                : "Start capturing your thoughts as you plan - your first entry is just a click away."
          }
          action={
            !includeArchived && !isFiltered ? (
              <Button href="/app/life-planner/journal/new" size="sm">
                Write your first entry
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => {
            const area = entry.lifeAreaId ? (areaById.get(entry.lifeAreaId) ?? null) : null;
            const goal = entry.goalId ? (goalById.get(entry.goalId) ?? null) : null;
            return (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                areaName={area?.name ?? null}
                areaIcon={area ? AREA_ICONS[area.iconKey] : null}
                goalTitle={goal?.title ?? null}
              />
            );
          })}
        </div>
      )}
    </Container>
  );
}
