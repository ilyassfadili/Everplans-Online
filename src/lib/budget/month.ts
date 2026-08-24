/**
 * Calendar-month helpers for the Money Overview's month navigation
 * (Everplans Money Prompt 1's "current/previous/next month, month
 * selection" foundation). Pure, no database access - deliberately narrower
 * than `@/lib/budget/period.ts` (which converts a *frequency* like
 * "$500/week" into "per plan period" cents): this is about which literal
 * calendar month the Overview is currently showing, independent of a plan's
 * own `periodType`. A "month" here is always a real calendar month
 * (YYYY-MM), never a rolling 30-day window - the same everyday sense
 * "August 2026" already has for a user, regardless of what cadence they
 * plan their budget around.
 */

/** `"YYYY-MM"` - the one canonical representation every Overview/Transactions query and the `?month=` URL param both use. */
export type MonthKey = string;

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

/** The current calendar month, as a `MonthKey` - the Overview's default when no `?month=` is present. */
export function getCurrentMonthKey(): MonthKey {
  return toMonthKey(new Date());
}

function toMonthKey(date: Date): MonthKey {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Parses a `?month=` search param into a valid `MonthKey`, or the current month if it's missing/malformed - never throws, never lets an invalid param produce a broken date range. */
export function parseMonthParam(value: string | undefined | null): MonthKey {
  if (value && MONTH_KEY_PATTERN.test(value)) {
    const [, month] = value.split("-").map(Number);
    if (month >= 1 && month <= 12) return value;
  }
  return getCurrentMonthKey();
}

/** The inclusive `[start, end]` ISO date range (`YYYY-MM-DD`) covering an entire calendar month - what every date-range query filters against. */
export function getMonthDateRange(month: MonthKey): { start: string; end: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 0));
  return { start: formatIsoDate(start), end: formatIsoDate(end) };
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The month `delta` months away from `month` - `shiftMonth(month, -1)` for "previous," `shiftMonth(month, 1)` for "next." */
export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return toMonthKey(shifted);
}

/** Human-readable label for a month, e.g. "August 2026." */
export function formatMonthLabel(month: MonthKey): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1, 1));
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

/** Whether `month` is the current calendar month - the Overview uses this to hide a redundant "back to today" control when already there. */
export function isCurrentMonth(month: MonthKey): boolean {
  return month === getCurrentMonthKey();
}
