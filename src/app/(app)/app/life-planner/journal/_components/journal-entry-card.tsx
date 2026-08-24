import type { LucideIcon } from "lucide-react";

import { Heading, Icon, Link, Text } from "@/components/ui";
import type { LifeJournalEntry } from "@/types/life-planner";

import { formatJournalDate, journalExcerpt } from "./journal-visuals";

interface JournalEntryCardProps {
  entry: LifeJournalEntry;
  areaName: string | null;
  areaIcon: LucideIcon | null;
  goalTitle: string | null;
}

/**
 * One Journal Entry's own list row (Life Planner Prompt 4 Phase 2) -
 * deliberately not styled like `GoalCard`/`TaskRow`: this product's journal
 * is meant to feel personal, calm, and private, closer to a page in a
 * notebook than a row in a CMS table. Concretely: generous padding
 * (`p-6`/`p-7` rather than the `p-3`/`p-4` most compact rows use), looser
 * body line-height on the excerpt, and a hairline-only
 * `border-line-subtle/60` (softer than the plain `border-line-subtle`
 * every other card in this product uses) - every one of those is still a
 * token this design system already defines (AGENTS.md's own "never reach
 * for a raw hex value" rule), just composed more spaciously than a
 * task/goal row would be. No status badge, no priority chip, no completion
 * checkbox - a journal entry doesn't have a status, and pretending it does
 * would undercut the "this is writing, not a task" register the whole
 * module is going for.
 */
export function JournalEntryCard({ entry, areaName, areaIcon: AreaIcon, goalTitle }: JournalEntryCardProps) {
  return (
    <Link
      href={`/app/life-planner/journal/${entry.id}`}
      variant="inline"
      className="block rounded-xl border border-line-subtle/60 bg-surface p-6 no-underline transition-colors duration-200 ease-standard hover:border-line-subtle hover:bg-surface-muted/40 sm:p-7"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-ink-faint">
          <Text size="body-sm" tone="faint">
            {formatJournalDate(entry.entryDate)}
          </Text>
          {areaName && (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                {AreaIcon && <Icon icon={AreaIcon} size="sm" />}
                <Text size="body-sm" tone="faint">
                  {areaName}
                </Text>
              </span>
            </>
          )}
          {goalTitle && (
            <>
              <span aria-hidden="true">·</span>
              <Text size="body-sm" tone="faint">
                {goalTitle}
              </Text>
            </>
          )}
        </div>

        <Heading as="h2" size="h3">
          {entry.title}
        </Heading>

        <Text size="body" tone="muted" className="leading-relaxed">
          {journalExcerpt(entry.content)}
        </Text>
      </div>
    </Link>
  );
}
