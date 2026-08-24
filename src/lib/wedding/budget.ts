import type { WeddingBudgetCategory, WeddingBudgetCategorySummary, WeddingBudgetSummary, WeddingExpense } from "@/types/wedding";

/**
 * Pure derivations over already-fetched categories/expenses - no database
 * access. "Total planned budget," "actual spending," and "remaining" are
 * never stored anywhere (Phase 2's own "avoid storing derived values
 * unnecessarily" instruction) - these are the one place they're computed,
 * so the overview, the category list, and the dashboard summary can never
 * disagree with each other.
 */

export function calculateBudgetSummary(categories: WeddingBudgetCategory[], expenses: WeddingExpense[]): WeddingBudgetSummary {
  const totalPlannedCents = categories.reduce((sum, category) => sum + category.plannedAmountCents, 0);
  const totalActualCents = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);

  return {
    totalPlannedCents,
    totalActualCents,
    remainingCents: totalPlannedCents - totalActualCents,
  };
}

/**
 * Per-category planned/actual/remaining, plus the expenses that landed in
 * each - `isOverBudget` is `actual > planned`, calculated fresh each time
 * rather than a stored flag that could go stale the moment a new expense
 * is added.
 */
export function calculateCategorySummaries(
  categories: WeddingBudgetCategory[],
  expenses: WeddingExpense[],
): WeddingBudgetCategorySummary[] {
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
export function getUncategorizedExpenses(expenses: WeddingExpense[]): WeddingExpense[] {
  return expenses.filter((expense) => !expense.categoryId);
}
