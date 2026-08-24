import { Link, Text } from "@/components/ui";
import type { LifeJournalEntry } from "@/types/life-planner";

import { formatJournalDate, journalExcerpt } from "../../../journal/_components/journal-visuals";

interface GoalJournalReflectionsProps {
  goalId: string;
  entries: LifeJournalEntry[];
}

/**
 * The goal detail page's own compact "Journal reflections" section (Life
 * Planner Prompt 4 Phase 2 §5) - every non-archived Journal Entry linked to
 * this goal (`getJournalEntriesForCurrentUser({ goalId })`,
 * `@/lib/life-planner/life-journal`), newest first. A plain list of
 * title/date/excerpt rows linking out to each entry's own detail page,
 * deliberately not an inline editor - the same "link out to the real detail
 * page rather than edit inline" role `GoalTasks`/`GoalHabits` already play
 * for their own linked records one section up. "New reflection" pre-fills
 * this goal via `?goalId=`, read back by the composer
 * (`NewJournalEntryForm`'s own `defaultGoalId` prop) so a reflection started
 * from a goal's page doesn't require re-picking it.
 */
export function GoalJournalReflections({ goalId, entries }: GoalJournalReflectionsProps) {
  return (
    <div className="flex flex-col gap-3">
      {entries.length === 0 ? (
        <Text size="body-sm" tone="muted">
          No journal entries linked to this goal yet.
        </Text>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/app/life-planner/journal/${entry.id}`}
              variant="inline"
              className="block rounded-lg border border-line-subtle/60 bg-surface p-4 no-underline transition-colors duration-200 ease-standard hover:bg-surface-muted/40"
            >
              <div className="flex items-baseline justify-between gap-3">
                <Text size="body-sm" weight="medium" className="truncate text-ink">
                  {entry.title}
                </Text>
                <Text size="body-sm" tone="faint" className="shrink-0">
                  {formatJournalDate(entry.entryDate)}
                </Text>
              </div>
              <Text size="body-sm" tone="muted" className="mt-1">
                {journalExcerpt(entry.content)}
              </Text>
            </Link>
          ))}
        </div>
      )}

      <Link href={`/app/life-planner/journal/new?goalId=${goalId}`} variant="subtle" className="self-start text-body-sm">
        New reflection →
      </Link>
    </div>
  );
}
