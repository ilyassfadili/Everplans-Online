import type { BudgetRecurringFrequency, BudgetRecurringItem } from "@/types/budget";

/** How far ahead the Upcoming Money Timeline (Prompt 4 Phase 2) looks - shared by the page that generates occurrences and the component that buckets them, so the two can never disagree about the window. */
export const UPCOMING_WINDOW_DAYS = 30;

/**
 * Pure occurrence math for recurring items - no database access. This is
 * the one place "when does this next happen" is calculated, so the
 * recurring list, the Upcoming Money Timeline, and `next_occurrence_date`
 * (persisted opportunistically on create/edit, but never trusted as the
 * source of truth by anything that reads it - see `getRecurringItemsForPlan`'s
 * own comment) can never disagree.
 *
 * Calendar-accurate for monthly/quarterly/yearly (via `setMonth`/
 * `setFullYear`, not day-count approximation) - `@/lib/budget/period`'s
 * ~30.44-day month is fine for "how much money," but a recurring item's
 * actual next date needs to land on the real calendar day, not drift.
 */

function parseIsoDate(value: string): Date {
  const date = new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addInterval(date: Date, frequency: BudgetRecurringFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

/**
 * The next date this item is due, on or after `referenceDate` (defaults to
 * today) - `null` once its `endDate` has passed with no further occurrence
 * left. A start date still in the future is itself the next occurrence -
 * this never fabricates an earlier date.
 */
export function calculateNextOccurrence(
  startDate: string,
  frequency: BudgetRecurringFrequency,
  endDate: string | null,
  referenceDate: Date = new Date(),
): string | null {
  const reference = new Date(referenceDate);
  reference.setHours(0, 0, 0, 0);

  const end = endDate ? parseIsoDate(endDate) : null;
  let occurrence = parseIsoDate(startDate);

  if (end && occurrence > end) return null;

  // Bounded loop, not unbounded - a start date decades in the past on a
  // weekly cadence is still at most a few thousand iterations, but the cap
  // guards against ever hanging on a malformed row.
  for (let i = 0; i < 10_000 && occurrence < reference; i++) {
    occurrence = addInterval(occurrence, frequency);
    if (end && occurrence > end) return null;
  }

  return toIsoDate(occurrence);
}

/** Recomputes and returns what `next_occurrence_date` should be for an item right now - used both to persist on create/edit and to keep display honest without a write. */
export function getCurrentNextOccurrence(item: Pick<BudgetRecurringItem, "startDate" | "frequency" | "endDate">): string | null {
  return calculateNextOccurrence(item.startDate, item.frequency, item.endDate);
}

export interface UpcomingOccurrence {
  item: BudgetRecurringItem;
  date: string;
}

/**
 * Every occurrence of one active item landing within `windowDays` of
 * `referenceDate` (inclusive) - the Upcoming Money Timeline's own data
 * source (Prompt 4 Phase 2). Paused items produce nothing: a paused
 * recurring definition has no expected future occurrence to show.
 */
export function getUpcomingOccurrencesForItem(item: BudgetRecurringItem, windowDays: number, referenceDate: Date = new Date()): UpcomingOccurrence[] {
  if (!item.isActive) return [];

  const reference = new Date(referenceDate);
  reference.setHours(0, 0, 0, 0);
  const horizon = new Date(reference);
  horizon.setDate(horizon.getDate() + windowDays);

  const occurrences: UpcomingOccurrence[] = [];
  let cursor = calculateNextOccurrence(item.startDate, item.frequency, item.endDate, reference);

  // Bounded the same way `calculateNextOccurrence` is - a window of a few
  // weeks on a weekly cadence is a handful of iterations at most.
  for (let i = 0; i < 500 && cursor; i++) {
    const cursorDate = parseIsoDate(cursor);
    if (cursorDate > horizon) break;

    occurrences.push({ item, date: cursor });
    cursor = calculateNextOccurrence(cursor, item.frequency, item.endDate, new Date(cursorDate.getTime() + 24 * 60 * 60 * 1000));
  }

  return occurrences;
}

/** Every upcoming occurrence across a whole plan's active recurring items, sorted chronologically. */
export function getUpcomingOccurrences(items: BudgetRecurringItem[], windowDays: number, referenceDate: Date = new Date()): UpcomingOccurrence[] {
  return items
    .flatMap((item) => getUpcomingOccurrencesForItem(item, windowDays, referenceDate))
    .sort((a, b) => a.date.localeCompare(b.date));
}
