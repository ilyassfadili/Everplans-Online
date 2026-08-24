import { ArrowDownRight, ArrowUpRight, CalendarClock, PiggyBank } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge, Card, EmptyState, Heading, Icon, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import { UPCOMING_WINDOW_DAYS, type UpcomingOccurrence } from "@/lib/budget/recurring-occurrence";
import type { BudgetCategory } from "@/types/budget";

interface TimelineBucket {
  label: string;
  occurrences: UpcomingOccurrence[];
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

/** Buckets by proximity, not calendar week boundaries - "Today," "Tomorrow," and "This week" read more naturally than "the week of the 3rd." */
function bucketOccurrences(occurrences: UpcomingOccurrence[]): TimelineBucket[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets: Record<string, UpcomingOccurrence[]> = {
    Today: [],
    Tomorrow: [],
    "This week": [],
    "Next week": [],
    "Later this month": [],
  };

  for (const occurrence of occurrences) {
    const date = new Date(`${occurrence.date}T00:00:00`);
    const diff = daysBetween(today, date);

    if (diff <= 0) buckets["Today"]!.push(occurrence);
    else if (diff === 1) buckets["Tomorrow"]!.push(occurrence);
    else if (diff <= 7) buckets["This week"]!.push(occurrence);
    else if (diff <= 14) buckets["Next week"]!.push(occurrence);
    else buckets["Later this month"]!.push(occurrence);
  }

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, occurrences: items }));
}

function formatOccurrenceDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const TYPE_ICON: Record<string, LucideIcon> = {
  income: ArrowUpRight,
  expense: ArrowDownRight,
  savings: PiggyBank,
};

interface UpcomingTimelineProps {
  occurrences: UpcomingOccurrence[];
  categories: BudgetCategory[];
  currency: string;
}

/**
 * The Upcoming Money Timeline (Prompt 4 Phase 2) - every future occurrence
 * of an active recurring item within a 30-day window, grouped by proximity.
 * Every amount here is clearly "expected," never presented as a confirmed
 * transaction or a bank balance - this is the plan's own recurring
 * definitions projected forward, nothing more.
 *
 * Only ever rendered by the page once at least one recurring item exists
 * (`RecurringPage`'s own comment) - so the empty case handled here means
 * "you have recurring items, but none land in the next 30 days" (all
 * paused, or their next date is further out), never "you haven't added
 * anything yet" - that message belongs to `RecurringList`'s own empty
 * state, not a second one stacked above it.
 */
export function UpcomingTimeline({ occurrences, categories, currency }: UpcomingTimelineProps) {
  if (occurrences.length === 0) {
    return (
      <Card variant="standard" padding="lg">
        <Heading as="h2" size="h4">
          Upcoming
        </Heading>
        <EmptyState
          icon={CalendarClock}
          title="Nothing due in the next 30 days"
          description="Everything currently paused, or scheduled further out, will show up here as it gets closer."
          className="mt-4 py-10"
        />
      </Card>
    );
  }

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const buckets = bucketOccurrences(occurrences);

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Upcoming
        </Heading>
        <Text size="body-sm" tone="faint">
          Next {UPCOMING_WINDOW_DAYS} days
        </Text>
      </div>

      <div className="mt-3 flex flex-col gap-5">
        {buckets.map((bucket) => (
          <div key={bucket.label}>
            <Text size="body-sm" weight="medium" tone="muted" className="uppercase tracking-wide">
              {bucket.label}
            </Text>
            <ul className="mt-1 flex flex-col divide-y divide-line-subtle">
              {bucket.occurrences.map((occurrence) => {
                const category = occurrence.item.categoryId ? categoryById.get(occurrence.item.categoryId) : null;
                const isIncome = occurrence.item.type === "income";
                const TypeIcon = TYPE_ICON[occurrence.item.type] ?? ArrowDownRight;

                return (
                  <li key={`${occurrence.item.id}-${occurrence.date}`} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Icon icon={TypeIcon} size="sm" className={isIncome ? "text-success" : "text-ink-faint"} />
                      <div className="min-w-0">
                        <Text size="body-sm" weight="medium" className="truncate text-ink">
                          {occurrence.item.name}
                        </Text>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Text size="caption" tone="faint">
                            {formatOccurrenceDate(occurrence.date)}
                          </Text>
                          {category && <Badge variant="neutral">{category.name}</Badge>}
                        </div>
                      </div>
                    </div>
                    <Text size="body-sm" weight="medium" className={`shrink-0 ${isIncome ? "text-success" : "text-ink"}`}>
                      {isIncome ? "+" : "-"}
                      {formatCurrency(occurrence.item.amountCents, currency)}
                    </Text>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <Text size="body-sm" tone="faint" className="mt-4">
        These are expected amounts based on your recurring items - not confirmed transactions.
      </Text>
    </Card>
  );
}
