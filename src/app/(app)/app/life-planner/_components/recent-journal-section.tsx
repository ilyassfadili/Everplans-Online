import { ArrowRight } from "lucide-react";

import { Button, Card, EmptyState, Heading, Link, Text } from "@/components/ui";
import type { LifeJournalEntry } from "@/types/life-planner";

import { formatJournalDate, journalExcerpt } from "../journal/_components/journal-visuals";

interface RecentJournalSectionProps {
  entries: LifeJournalEntry[];
}

/**
 * The dashboard's own compact "Recent reflections" section (Life Planner
 * Prompt 4 Phase 2 §6) - the real system that replaces the Journal half of
 * the "Journal & Important Information" tile `FutureModulesSection` used to
 * render as a placeholder (see that file's own comment for how the
 * remaining "Important Plans & Information" placeholder was kept honest
 * about what's still not built). Up to 3 recent, non-archived entries
 * (`getRecentJournalEntriesForCurrentUser`, `@/lib/life-planner/life-journal`),
 * each with its own title/date/excerpt, plus a "Write a new entry" CTA - a
 * glanceable preview, not a second place to write or edit (the same
 * "preview, not editor" role `TodaysPrioritiesSection`/`WeeklyPlanningSection`
 * play for their own sections). No interactivity needed here (unlike
 * `WeeklyPlanningSection`'s completion toggles), so this stays a plain
 * Server Component.
 */
export function RecentJournalSection({ entries }: RecentJournalSectionProps) {
  return (
    <Card variant="standard" padding="lg" className="border-line-subtle/60">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h3" size="h4">
          Recent reflections
        </Heading>
        <Link href="/app/life-planner/journal" variant="nav" className="flex items-center gap-1 text-body-sm font-medium">
          Open journal
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {entries.length === 0 ? (
        <EmptyState title="Nothing written yet" description="Start capturing your thoughts as you plan." className="mt-4 py-6" />
      ) : (
        <div className="mt-4 flex flex-col gap-3">
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

      <div className="mt-4">
        <Button href="/app/life-planner/journal/new" variant="outline" size="sm">
          Write a new entry
        </Button>
      </div>
    </Card>
  );
}
