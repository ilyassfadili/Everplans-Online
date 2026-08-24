import type { BudgetFrequency, BudgetPeriodType } from "@/types/budget";

/**
 * Pure frequency math - no database access. The one place a recurring
 * amount of any cadence ("$500/week", "$1,200/quarterly") is translated
 * into "how much per plan period" - every other module (income totals,
 * recurring items, savings targets) calls through here rather than
 * re-deriving its own conversion, so a monthly plan and a weekly plan never
 * disagree about what "$500/week" means for "expected income this period."
 *
 * Approximate by design (a "month" is 30.44 days on average, a "year" is
 * 365.25) - Prompt 2 Phase 2's own instruction is to "correctly translate
 * recurring income into the relevant budget period without creating
 * misleading totals," not to model exact calendar weeks-per-month. `one-time`
 * income converts to `0` for any recurring period - a one-time amount isn't
 * "expected every period," it's counted once, separately, wherever it's
 * relevant.
 */

const DAYS_PER_OCCURRENCE: Record<Exclude<BudgetFrequency, "one-time">, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30.44,
  quarterly: 91.31,
  yearly: 365.25,
};

const DAYS_PER_PERIOD: Record<BudgetPeriodType, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30.44,
  yearly: 365.25,
};

/** Converts an amount of a given frequency into "per plan period" cents, rounded to the nearest cent. `one-time` always converts to `0`. */
export function convertToPeriodCents(amountCents: number, frequency: BudgetFrequency, periodType: BudgetPeriodType): number {
  if (frequency === "one-time") return 0;

  const perDay = amountCents / DAYS_PER_OCCURRENCE[frequency];
  return Math.round(perDay * DAYS_PER_PERIOD[periodType]);
}

/** How many days one plan period spans - exported for callers that need to convert a *duration* (e.g. "days until a goal's target date") into a period count, not an amount. */
export function getPeriodDurationDays(periodType: BudgetPeriodType): number {
  return DAYS_PER_PERIOD[periodType];
}

/** Human-readable label for a period type, e.g. for "Expected income this month." */
export function getPeriodLabel(periodType: BudgetPeriodType): string {
  switch (periodType) {
    case "weekly":
      return "week";
    case "biweekly":
      return "2 weeks";
    case "monthly":
      return "month";
    case "yearly":
      return "year";
  }
}
