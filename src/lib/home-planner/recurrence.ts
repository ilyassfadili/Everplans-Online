import type { MaintenanceRecurrenceFrequency } from "@/types/home-planner";
import type { SelectOption } from "@/components/ui/form/select";

/**
 * Recurring Tasks' own date math (Everplans Home Planner Prompt 3 Phase 2).
 * Every function here is pure - no `Date.now()`, no database access - so
 * `calculateNextDueDate` can be called from both the server (generating
 * the next real occurrence) and used to build a purely illustrative
 * preview, and always agree.
 */

export const RECURRENCE_FREQUENCY_OPTIONS: SelectOption[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom interval" },
];

const RECURRENCE_FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  custom: "Custom",
};

/** Resolves a stored `recurrence_frequency` value back into its display label. Falls back to the raw value, so a display never renders `undefined`. */
export function getRecurrenceFrequencyLabel(frequency: string): string {
  return RECURRENCE_FREQUENCY_LABELS[frequency] ?? frequency;
}

function toUtcDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Adds whole months to a UTC date, clamping the day-of-month to the target
 * month's last real day instead of letting it overflow into the month
 * after (Phase 2's own requirement: "handle month boundaries... leap-year/
 * date edge cases"). January 31 + 1 month lands on February 28 (or 29 in a
 * leap year), never March. `new Date(Date.UTC(y, m + 1, 0))` is the
 * standard trick for "the last day of month `m`" - JS normalizes day `0`
 * to the previous month's final day, which already accounts for leap
 * years correctly.
 */
function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const targetMonthIndex = month + months;

  const daysInTargetMonth = new Date(Date.UTC(year, targetMonthIndex + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, daysInTargetMonth);

  return new Date(Date.UTC(year, targetMonthIndex, clampedDay));
}

/**
 * The next due date for a recurring task's next occurrence, given the date
 * its *current* occurrence is anchored to (its own due date if it had one,
 * otherwise the day it was completed - `completeMaintenanceTask`'s own
 * choice). Plain `YYYY-MM-DD` in, plain `YYYY-MM-DD` out.
 */
export function calculateNextDueDate(
  fromDate: string,
  frequency: MaintenanceRecurrenceFrequency,
  intervalDays: number | null,
): string {
  const base = toUtcDateOnly(fromDate);

  switch (frequency) {
    case "daily":
      return formatUtcDateOnly(new Date(base.getTime() + 1 * 86_400_000));
    case "weekly":
      return formatUtcDateOnly(new Date(base.getTime() + 7 * 86_400_000));
    case "monthly":
      return formatUtcDateOnly(addMonthsClamped(base, 1));
    case "quarterly":
      return formatUtcDateOnly(addMonthsClamped(base, 3));
    case "yearly":
      return formatUtcDateOnly(addMonthsClamped(base, 12));
    case "custom": {
      const days = intervalDays && intervalDays > 0 ? intervalDays : 1;
      return formatUtcDateOnly(new Date(base.getTime() + days * 86_400_000));
    }
    default:
      return formatUtcDateOnly(base);
  }
}

/**
 * A purely illustrative preview of the next few occurrence dates - never
 * stored, never a guarantee (Phase 2: "keep the experience understandable"
 * / "view upcoming occurrences"). Real occurrences are only ever generated
 * one at a time, when the current one is completed
 * (`completeMaintenanceTask`) - this is what lets a user see roughly what's
 * ahead without the system fabricating rows that don't exist yet.
 */
export function previewUpcomingOccurrences(
  fromDate: string,
  frequency: MaintenanceRecurrenceFrequency,
  intervalDays: number | null,
  count = 3,
): string[] {
  const dates: string[] = [];
  let cursor = fromDate;
  for (let i = 0; i < count; i += 1) {
    cursor = calculateNextDueDate(cursor, frequency, intervalDays);
    dates.push(cursor);
  }
  return dates;
}
