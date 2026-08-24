import type { TripBudgetCategory, TripBudgetCategorySummary, TripBudgetSummary, TripExpense } from "@/types/travel";

/**
 * Pure derivations over already-fetched categories/expenses - no database
 * access, deliberately kept in its own module (not `server-only`) so a
 * Client Component can import these directly, the same split
 * `@/lib/wedding/budget` establishes against `@/lib/wedding/budget-categories`.
 * "Total planned budget," "actual spending," and "remaining" are never
 * stored anywhere - this is the one place they're computed, so the
 * overview, the category list, and any future dashboard summary can never
 * disagree with each other.
 */

/**
 * "Total planned budget / planned category amounts / total actual spending
 * / remaining / unallocated" (Phase 1 §6, extended by Phase 2 §6). Both
 * `remainingCents` (spending-focused) and `unallocatedCents`
 * (allocation-focused) can go negative - the UI surfaces that rather than
 * clamping it away.
 */
export function calculateBudgetSummary(
  totalBudgetCents: number,
  categories: TripBudgetCategory[],
  expenses: TripExpense[] = [],
): TripBudgetSummary {
  const totalPlannedCents = categories.reduce((sum, category) => sum + category.plannedAmountCents, 0);
  const totalActualCents = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);

  return {
    totalBudgetCents,
    totalPlannedCents,
    totalActualCents,
    remainingCents: totalBudgetCents - totalActualCents,
    unallocatedCents: totalBudgetCents - totalPlannedCents,
  };
}

/**
 * Per-category planned/actual/remaining, plus the expenses that landed in
 * each (Phase 2 §6). Same shape as `calculateCategorySummaries` (Wedding
 * Planner).
 */
export function calculateCategorySummaries(categories: TripBudgetCategory[], expenses: TripExpense[]): TripBudgetCategorySummary[] {
  return categories.map((category) => {
    const categoryExpenses = expenses.filter((expense) => expense.categoryId === category.id);
    const actualCents = categoryExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);

    return {
      category,
      actualCents,
      remainingCents: category.plannedAmountCents - actualCents,
      isOverBudget: actualCents > category.plannedAmountCents,
      expenses: categoryExpenses,
    };
  });
}

/** Expenses with no category at all - "Uncategorized" isn't a real category row, just what's left after grouping by the real ones. */
export function getUncategorizedExpenses(expenses: TripExpense[]): TripExpense[] {
  return expenses.filter((expense) => !expense.categoryId);
}
